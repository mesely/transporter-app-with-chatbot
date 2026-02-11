import { Injectable, Logger } from '@nestjs/common';
import { Mistral } from '@mistralai/mistralai';
import { UsersService } from '../users/users.service';
import { TariffsService } from '../tariffs/tariffs.service';

/**
 * AI'ın Gelişmiş Düşünce Yapısı
 */
interface AIThoughtProcess {
  thought: string;
  intent: 'search_driver' | 'calculate_price' | 'get_tariff' | 'general_chat' | 'clarification_needed';
  confidence: number;
  entities: {
    mainType?: string;    // 'KURTARICI', 'NAKLIYE', 'SARJ'
    subType?: string;     // 'tir', 'kamyon', 'kamyonet', 'oto_kurtarma', 'istasyon'
    tags?: string[];      // 'frigorifik', 'lowbed', 'tenteli', '6_teker'
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

    VERİ YAPISI KURALLARI:
    1. mainType: 'KURTARICI', 'NAKLIYE' veya 'SARJ' olmalı.
    2. subType: 'tir', 'kamyon', 'kamyonet', 'oto_kurtarma', 'vinc', 'istasyon', 'seyyar_sarj', 'yurt_disi_nakliye', 'evden_eve' olmalı.
    3. tags: Araç özellikleridir. Örn: 'frigorifik', 'lowbed', 'tenteli', '10_teker', 'panelvan', 'damperli'.

    STRATEJİ:
    - Eğer kullanıcı "soğuk zincir" veya "donmuş gıda" derse -> tags: ["frigorifik"], subType: "tir"
    - Eğer kullanıcı "iş makinesi" veya "ağır yük" derse -> tags: ["lowbed"], subType: "tir"
    - Eğer kullanıcı "ev taşıyacağım" derse -> subType: "evden_eve", mainType: "NAKLIYE"
    - Eğer kullanıcı "elektrikli arabam yolda kaldı" derse -> subType: "seyyar_sarj", mainType: "SARJ"

    Sadece JSON formatında yanıt ver.

    --- ÖRNEKLER ---
    User: "Antalya'ya donmuş gıda götürecek tır lazım"
    AI: {
      "thought": "Kullanıcı donmuş gıda dediği için frigorifik (soğutmalı) araç lazım. Araç tipi Tır.",
      "intent": "search_driver",
      "confidence": 0.98,
      "entities": { "mainType": "NAKLIYE", "subType": "tir", "tags": ["frigorifik"], "location": "Antalya" },
      "search_keywords": ["frigo", "soğutmalı", "gıda"]
    }

    User: "Vinç fiyatları ne kadar?"
    AI: {
      "thought": "Kullanıcı vinç fiyatı sordu. Fiyat hesaplama için miktar (saat/km) eksik.",
      "intent": "calculate_price",
      "confidence": 0.90,
      "entities": { "mainType": "KURTARICI", "subType": "vinc" },
      "missing_info": ["amount"]
    }
  `;

  constructor(
    private readonly usersService: UsersService,
    private readonly tariffsService: TariffsService,
  ) {
    this.client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY || '' });
  }

  async chat(message: string, history: any[], location?: { lat: number; lng: number }) {
    try {
      // 1. ADIM: ANALİZ
      const analysis = await this.analyzeIntentWithCoT(message, history);
      
      this.logger.log(`🧠 AI Thought: ${analysis.thought}`);

      let systemResponse = "";
      let foundData: any = null;
      let dataType = 'text';

      // 2. ADIM: EYLEM KARARI
      
      if (analysis.intent === 'clarification_needed' || analysis.confidence < 0.6) {
        return { 
          response: this.generateClarificationQuestion(analysis.missing_info), 
          role: 'assistant' 
        };
      }

      // SENARYO: ARAÇ ARAMA (Yeni Filtrelerle)
      if (analysis.intent === 'search_driver') {
        const lat = location?.lat || 38.4237;
        const lng = location?.lng || 27.1428;

        // Backend findNearby metoduna yeni filtreleri gönderiyoruz
        // Not: findNearby metodunu bu parametreleri alacak şekilde güncellemiş olmalısın
        const drivers = await this.usersService.findNearby(
          lat, 
          lng, 
          analysis.entities.subType || analysis.entities.mainType, 
          15
        );
        
        // Semantic Filter: AI'ın belirlediği TAG'lere göre önceliklendirme yap
        const rankedDrivers = this.semanticReRank(drivers, analysis.entities.tags || [], analysis.search_keywords || []);

        if (rankedDrivers.length > 0) {
          foundData = rankedDrivers.slice(0, 5);
          dataType = 'drivers_map';
          systemResponse = `İhtiyacınıza uygun özellikleri taşıyan ${rankedDrivers.length} profesyonel taşıyıcı buldum. Haritada görebilirsiniz.`;
        } else {
          systemResponse = "İstediğiniz kriterlerde (etiketlerde) şu an aktif araç bulunamadı ancak genel kategorideki en yakın araçları listeliyorum.";
          foundData = drivers.slice(0, 3);
          dataType = 'drivers_map';
        }
      }

      // SENARYO: FİYAT HESAPLAMA (Açılış + Birim Fiyat)
      if (analysis.intent === 'calculate_price') {
        const subType = analysis.entities.subType || 'tir';
        const tariff = await this.tariffsService.findByType(subType) || { openingFee: 350, pricePerUnit: 40, unit: 'km' };
        
        if (!analysis.entities.amount) {
           return { 
             response: `Fiyat çıkarabilmem için yaklaşık kaç ${tariff.unit === 'km' ? 'kilometre' : 'saat'} yol yapılacağını söyler misiniz?`, 
             role: 'assistant' 
           };
        }

        const total = tariff.openingFee + (analysis.entities.amount * tariff.pricePerUnit);
        
        foundData = {
          service: subType.toUpperCase(),
          amount: analysis.entities.amount,
          unit: tariff.unit,
          total,
          details: `${tariff.openingFee} TL Başlangıç + (${analysis.entities.amount} ${tariff.unit} x ${tariff.pricePerUnit} TL)`
        };
        dataType = 'calculation_result';
        systemResponse = `Tahmini hesaplama sonucuna göre maliyetiniz **${total} TL** olacaktır. (Not: Bu fiyat trafiğe ve net konuma göre değişebilir.)`;
      }

      // SENARYO: GENEL SOHBET
      if (analysis.intent === 'general_chat') {
        const chatResponse = await this.client.chat.complete({
          model: 'mistral-tiny',
          messages: [
            { role: 'system', content: "Sen Madlen'sin. Transporter lojistik ağının asistanısın. Nezaketi elden bırakma, kısa ve çözüm odaklı konuş." },
            ...history.slice(-3),
            { role: 'user', content: message }
          ] as any
        });
        systemResponse = (chatResponse.choices?.[0]?.message?.content as string) || "Size nasıl yardımcı olabilirim?";
      }

      // 3. ADIM: VERİ PAKETLEME
      if (foundData) {
        const packet = JSON.stringify({ type: dataType, data: foundData });
        systemResponse += `||DATA||${packet}||DATA||`;
      }

      return { response: systemResponse, role: 'assistant' };

    } catch (error) {
      this.logger.error(`Mistral API Error: ${error.message}`);
      return { response: "Şu an bağlantı kuramıyorum, lütfen harita üzerinden manuel seçim yapın.", role: 'assistant' };
    }
  }

  /**
   * 🧠 SEMANTIC RE-RANKING (Etiket ve Anahtar Kelime Uyumu)
   */
  private semanticReRank(drivers: any[], targetTags: string[], keywords: string[]): any[] {
    if (drivers.length === 0) return [];

    return drivers.map(driver => {
      let score = 0;
      const driverTags = driver.service?.tags || [];
      const searchableText = `${driver.businessName} ${driver.service?.subType} ${driverTags.join(' ')}`.toLowerCase();

      // 1. Tag Uyumu (En Yüksek Puan)
      targetTags.forEach(t => {
        if (driverTags.includes(t.toLowerCase())) score += 50;
      });

      // 2. Keyword Uyumu
      keywords.forEach(kw => {
        if (searchableText.includes(kw.toLowerCase())) score += 15;
      });

      // 3. Rating & Mesafe Uyumu
      score += (driver.rating || 0) * 5;
      score -= (driver.distance / 1000); // Kilometre başına puan düşür (yakınlık bonusu)

      return { ...driver, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ score, ...driver }) => driver);
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
    } catch (e) {
      return { thought: "Analiz hatası", intent: 'general_chat', confidence: 0.5, entities: {} };
    }
  }

  private generateClarificationQuestion(missingInfo: string[] | undefined): string {
    if (!missingInfo) return "Size nasıl yardımcı olabilirim?";
    if (missingInfo.includes('amount')) return "Hesaplama yapabilmem için tahmini kaç km yol gidileceğini söyler misiniz?";
    if (missingInfo.includes('service_type')) return "Hangi araç tipine ihtiyacınız var? (Örn: Tır, Kamyonet veya Çekici)";
    return "Detay verirseniz size en uygun aracı hemen bulabilirim.";
  }
}