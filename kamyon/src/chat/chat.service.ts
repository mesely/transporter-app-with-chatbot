import { Injectable, Logger } from '@nestjs/common';
import { Mistral } from '@mistralai/mistralai';
import { UsersService } from '../users/users.service';
import { TariffsService } from '../tariffs/tariffs.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatHistory, ChatHistoryDocument } from './schemas/chat-history.schema';

interface AIThoughtProcess {
  thought: string;
  intent: 'search_driver' | 'calculate_price' | 'get_tariff' | 'general_chat' | 'clarification_needed';
  confidence: number;
  entities: {
    mainType?: string;
    subType?: string;
    tags?: string[];
    location?: string;
    amount?: number;
  };
  missing_info?: string[];
  search_keywords?: string[];
}

@Injectable()
export class ChatService {
  private client: Mistral;
  private readonly logger = new Logger(ChatService.name);

  private readonly REASONING_PROMPT = `
    Sen Transporter uygulamasının zeki asistanı Madlen'sin.
    Görevin: Kullanıcı mesajını analiz et ve yeni lojistik veritabanı şemasına uygun JSON üret.
    Sadece JSON formatında yanıt ver.
  `;

  constructor(
    private readonly usersService: UsersService,
    private readonly tariffsService: TariffsService,
    @InjectModel(ChatHistory.name) private readonly chatHistoryModel: Model<ChatHistoryDocument>,
  ) {
    this.client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY || '' });
  }

  async chat(
    message: string,
    history: any[],
    location?: { lat: number; lng: number },
    customerId?: string
  ) {
    const text = this.normalize(message);
    const safeHistory = Array.isArray(history) ? history : [];

    try {
      if (this.isQuickActionsIntent(text)) {
        const payload = {
          type: 'quick_actions',
          data: [
            { id: 'call_vehicle', label: 'Arac Cagir', prompt: 'Arac Cagir' },
            { id: 'price_calc', label: 'Fiyat Hesapla', prompt: 'Fiyat hesapla' },
            { id: 'privacy', label: 'KVKK ve Gizlilik', prompt: 'KVKK ve gizlilik metnini goster.' },
            { id: 'profile_help', label: 'Profil Duzenleme', prompt: 'Profil bilgilerimi nasil duzenlerim?' },
          ]
        };
        const out = {
          response: `Asagidaki islemlerden birini secerek devam edebilirsiniz.||DATA||${JSON.stringify(payload)}||DATA||`,
          role: 'assistant'
        };
        await this.persistChat(customerId, message, out.response);
        return out;
      }

      if (this.isPrivacyIntent(text)) {
        const out = {
          response:
            'KVKK ve gizlilik icin Ayarlar > Gizlilik ve Profil > KVKK bolumlerini acabilirsiniz. Kisisel verileriniz yalnizca hizmet eslestirme, fiyatlama ve destek kaydi icin islenir; talep halinde silme/duzeltme hakkiniz vardir.',
          role: 'assistant'
        };
        await this.persistChat(customerId, message, out.response);
        return out;
      }

      if (this.isProfileIntent(text)) {
        const out = {
          response:
            'Profil duzenlemek icin Profil sayfasinda isim, telefon ve iletisim alanlarini guncelleyebilirsiniz. Sag ustteki profil ikonundan veya /profile adresinden ilerleyin.',
          role: 'assistant'
        };
        await this.persistChat(customerId, message, out.response);
        return out;
      }

      if (this.isVehicleCallIntent(text)) {
        const payload = {
          type: 'vehicle_options',
          data: [
            { id: 'oto_kurtarma', label: 'Oto Kurtarma', prompt: 'Bana en yakin oto kurtarma araclarini getir.' },
            { id: 'vinc', label: 'Vinc', prompt: 'Bana en yakin vinc araclarini getir.' },
            { id: 'nakliye', label: 'Nakliye', prompt: 'Bana en yakin nakliye araclarini getir.' },
            { id: 'evden_eve', label: 'Evden Eve', prompt: 'Bana en yakin evden eve araclarini getir.' },
            { id: 'tir', label: 'Tir', prompt: 'Bana en yakin tir araclarini getir.' },
            { id: 'kamyon', label: 'Kamyon', prompt: 'Bana en yakin kamyon araclarini getir.' },
            { id: 'kamyonet', label: 'Kamyonet', prompt: 'Bana en yakin kamyonet araclarini getir.' },
          ]
        };
        const out = {
          response: `Lutfen arac turunu secin.||DATA||${JSON.stringify(payload)}||DATA||`,
          role: 'assistant'
        };
        await this.persistChat(customerId, message, out.response);
        return out;
      }

      if (this.isPriceIntent(text)) {
        const out = await this.handlePriceCalculation(message, safeHistory);
        await this.persistChat(customerId, message, out.response);
        return out;
      }

      if (this.isSearchIntent(text)) {
        const out = await this.handleProviderSearch(message, location, safeHistory);
        await this.persistChat(customerId, message, out.response);
        return out;
      }

      const analysis = await this.analyzeIntentWithCoT(message, safeHistory);
      this.logger.log(`AI Thought: ${analysis.thought}`);

      if (analysis.intent === 'search_driver') {
        const out = await this.handleProviderSearch(message, location, safeHistory, analysis);
        await this.persistChat(customerId, message, out.response);
        return out;
      }
      if (analysis.intent === 'calculate_price') {
        const out = await this.handlePriceCalculation(message, safeHistory, analysis);
        await this.persistChat(customerId, message, out.response);
        return out;
      }

      const fallback = await this.safeGeneralChat(message, safeHistory);
      await this.persistChat(customerId, message, fallback);
      return { response: fallback, role: 'assistant' };
    } catch (error: any) {
      this.logger.error(`Chat error: ${error?.message || 'unknown'}`);
      const fallback = 'Su an baglanti kurulamadi. Lutfen tekrar deneyin.';
      await this.persistChat(customerId, message, fallback);
      return { response: fallback, role: 'assistant' };
    }
  }

  async getHistory(customerId?: string) {
    if (!customerId) return { messages: [] };
    const doc = await this.chatHistoryModel.findOne({ customerId }).lean().exec();
    return { messages: Array.isArray(doc?.messages) ? doc.messages : [] };
  }

  async clearHistory(customerId?: string) {
    if (!customerId) return { success: false };
    await this.chatHistoryModel.findOneAndUpdate(
      { customerId },
      { $set: { messages: [] } },
      { upsert: true, new: true }
    ).exec();
    return { success: true };
  }

  private async handleProviderSearch(
    message: string,
    location: { lat: number; lng: number } | undefined,
    history: any[],
    analysis?: AIThoughtProcess,
  ) {
    const subType = this.detectSubType(this.normalize(message), analysis);
    const mainType = analysis?.entities?.mainType;
    const searchType = subType || (mainType ? mainType.toLowerCase() : 'kurtarici');
    const lat = Number.isFinite(location?.lat) ? Number(location?.lat) : undefined;
    const lng = Number.isFinite(location?.lng) ? Number(location?.lng) : undefined;

    let candidates: any[] = [];

    // Her durumda once DB text aramasi denenir: ilce/isim gecen sorgularda daha dogru sonuc verir.
    candidates = await this.usersService.searchByText(message, searchType, lat, lng, 120);

    if (candidates.length === 0 && Number.isFinite(lat) && Number.isFinite(lng)) {
      const nearby = await this.usersService.findNearby(
        Number(lat),
        Number(lng),
        searchType,
        15,
        undefined,
        120
      );
      candidates = nearby;
    }

    const ranked = this.semanticReRank(
      candidates,
      analysis?.entities?.tags || [],
      analysis?.search_keywords || []
    ).slice(0, 6);

    if (ranked.length === 0) {
      return {
        response:
          'Istediginiz kriterde aktif kayit bulunamadi. Ilce/semt veya arac tipini biraz daha net yazarsaniz DB uzerinden tekrar sorgulayayim.',
        role: 'assistant'
      };
    }

    const packet = JSON.stringify({ type: 'drivers_map', data: ranked });
    const firstKm = ranked[0]?.distance ? `${Math.round(ranked[0].distance / 1000)} km` : 'mesafe bilgisi yok';
    return {
      response: `DB uzerinden ${ranked.length} kayit buldum. En yakin sonuc: ${firstKm}.||DATA||${packet}||DATA||`,
      role: 'assistant'
    };
  }

  private async handlePriceCalculation(
    message: string,
    history: any[],
    analysis?: AIThoughtProcess
  ) {
    const normalized = this.normalize(message);
    const unitFromText = normalized.includes('kwh') || normalized.includes('kw') ? 'kwh' : 'km';
    const amountFromText = this.extractAmount(normalized);
    const amount = amountFromText ?? analysis?.entities?.amount;

    const subType = this.detectSubType(normalized, analysis);
    const tariffType = this.resolveTariffType(subType, analysis?.entities?.mainType);
    const tariff = await this.tariffsService.findByType(tariffType) || {
      openingFee: 0,
      pricePerUnit: 40,
      unit: unitFromText,
      currency: 'TL'
    };

    if (!amount || amount <= 0) {
      return {
        response: `Ortalama fiyat hesaplamak icin hizmet turu ve miktar yazin. Ornek: "oto kurtarma 18 km" veya "seyyar sarj 22 kwh".`,
        role: 'assistant'
      };
    }

    const total = Number(tariff.openingFee || 0) + Number(amount) * Number(tariff.pricePerUnit || 0);
    const payload = JSON.stringify({
      type: 'calculation_result',
      data: {
        serviceType: tariffType,
        amount,
        unit: tariff.unit || unitFromText,
        openingFee: tariff.openingFee || 0,
        pricePerUnit: tariff.pricePerUnit || 0,
        total: Math.round(total),
        currency: tariff.currency || 'TL'
      }
    });

    return {
      response:
        `Ortalama fiyat hesabi hazir: ${Math.round(total)} ${(tariff.currency || 'TL')}.` +
        `||DATA||${payload}||DATA||`,
      role: 'assistant'
    };
  }

  private async safeGeneralChat(message: string, history: any[]) {
    try {
      const chatResponse = await this.client.chat.complete({
        model: 'mistral-tiny',
        messages: [
          { role: 'system', content: "Sen Madlen'sin. Kisa ve cozum odakli konus." },
          ...history.slice(-3),
          { role: 'user', content: message }
        ] as any
      });
      return (chatResponse.choices?.[0]?.message?.content as string) || 'Size nasil yardimci olabilirim?';
    } catch {
      return 'Arac cagir, fiyat hesapla, KVKK veya profil islemleri icin yardimci olabilirim.';
    }
  }

  private semanticReRank(drivers: any[], targetTags: string[], keywords: string[]): any[] {
    if (!Array.isArray(drivers) || drivers.length === 0) return [];

    return drivers.map((driver) => {
      let score = 0;
      const driverTags = driver?.service?.tags || [];
      const searchableText = `${driver?.businessName || ''} ${driver?.service?.subType || ''} ${driverTags.join(' ')}`.toLowerCase();

      targetTags.forEach((t) => {
        if (driverTags.includes(t?.toLowerCase?.())) score += 50;
      });
      keywords.forEach((kw) => {
        if (searchableText.includes((kw || '').toLowerCase())) score += 15;
      });
      score += Number(driver?.rating || 0) * 4;
      score -= Number(driver?.distance || 0) / 1200;

      return { ...driver, _score: score };
    })
    .sort((a, b) => b._score - a._score)
    .map(({ _score, ...driver }) => driver);
  }

  private async analyzeIntentWithCoT(message: string, history: any[]): Promise<AIThoughtProcess> {
    try {
      const response = await this.client.chat.complete({
        model: 'mistral-small',
        messages: [
          { role: 'system', content: this.REASONING_PROMPT },
          ...history.slice(-2),
          { role: 'user', content: message }
        ] as any,
        responseFormat: { type: 'json_object' }
      });

      return JSON.parse(response.choices?.[0]?.message?.content as string);
    } catch {
      return { thought: 'Analiz hatasi', intent: 'general_chat', confidence: 0.5, entities: {} };
    }
  }

  private normalize(value: string) {
    return (value || '')
      .toLocaleLowerCase('tr')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private isQuickActionsIntent(text: string) {
    return /(secenek|seçenek|menu|menü|neler yapabilirsin|yardim)/i.test(text);
  }

  private isPrivacyIntent(text: string) {
    return /(kvkk|gizlilik|privacy|veri koruma|aydinlatma)/i.test(text);
  }

  private isProfileIntent(text: string) {
    return /(profil|hesap bilgisi|telefon degistir|bilgi guncelle|duzenle)/i.test(text);
  }

  private isPriceIntent(text: string) {
    return /(fiyat|ucret|ücret|hesapla|km|kwh|kw)/i.test(text);
  }

  private isVehicleCallIntent(text: string) {
    return /(arac cagir|araç çağır|arac cagır|arac cagirir|arac cagir)/i.test(text);
  }

  private isSearchIntent(text: string) {
    return /(cekici|çekici|oto kurtarma|vinc|vinç|tir|kamyon|kamyonet|arac|araç|en yakin|en yakın|kac km|kaç km|var mi|var mı|tuzla|oray)/i.test(text);
  }

  private extractAmount(text: string): number | undefined {
    const m = text.match(/(\d+(?:[.,]\d+)?)/);
    if (!m) return undefined;
    const value = Number(m[1].replace(',', '.'));
    return Number.isFinite(value) ? value : undefined;
  }

  private detectSubType(text: string, analysis?: AIThoughtProcess): string | undefined {
    if (analysis?.entities?.subType) return analysis.entities.subType.toLowerCase();
    if (/(cekici|çekici|oto kurtarma)/i.test(text)) return 'oto_kurtarma';
    if (/(vinc|vinç)/i.test(text)) return 'vinc';
    if (/(seyyar sarj|seyyar şarj|mobil sarj|mobil şarj)/i.test(text)) return 'seyyar_sarj';
    if (/(istasyon|sarj istasyon|şarj istasyon)/i.test(text)) return 'istasyon';
    if (/\btir\b/.test(text)) return 'tir';
    if (/\bkamyonet\b/.test(text)) return 'kamyonet';
    if (/\bkamyon\b/.test(text)) return 'kamyon';
    return undefined;
  }

  private resolveTariffType(subType?: string, mainType?: string): string {
    if (subType && ['seyyar_sarj', 'istasyon'].includes(subType)) return 'sarj';
    if (subType && ['oto_kurtarma', 'vinc'].includes(subType)) return 'kurtarici';
    if (subType && ['tir', 'kamyon', 'kamyonet', 'evden_eve', 'yurt_disi_nakliye'].includes(subType)) return 'nakliye';
    const normalizedMain = (mainType || '').toLowerCase();
    if (normalizedMain === 'sarj') return 'sarj';
    if (normalizedMain === 'nakliye') return 'nakliye';
    return 'kurtarici';
  }

  private splitPacket(text: string): { cleanText: string; dataPacket: any | null } {
    const match = text.match(/\|\|DATA\|\|([\s\S]*?)\|\|DATA\|\|/);
    if (!match) return { cleanText: text, dataPacket: null };
    try {
      return { cleanText: text.replace(match[0], '').trim(), dataPacket: JSON.parse(match[1]) };
    } catch {
      return { cleanText: text.replace(match[0], '').trim(), dataPacket: null };
    }
  }

  private async persistChat(customerId: string | undefined, userMessage: string, assistantRawResponse: string) {
    if (!customerId) return;
    const { cleanText, dataPacket } = this.splitPacket(assistantRawResponse || '');
    const now = new Date();
    await this.chatHistoryModel.findOneAndUpdate(
      { customerId },
      {
        $push: {
          messages: {
            $each: [
              { role: 'user', content: userMessage, createdAt: now, dataPacket: null },
              { role: 'assistant', content: cleanText || assistantRawResponse, createdAt: now, dataPacket: dataPacket || null },
            ],
            $slice: -120,
          },
        },
      },
      { upsert: true, new: true }
    ).exec();
  }
}
