import { Injectable, Logger } from '@nestjs/common';
import { Mistral } from '@mistralai/mistralai';
import { UsersService } from '../users/users.service';
import { TariffsService } from '../tariffs/tariffs.service';

/**
 * AI'ın Düşünce Yapısı (Structured Output)
 */
interface AIThoughtProcess {
  thought: string;          // Adım adım düşünme süreci (CoT)
  intent: 'search_driver' | 'calculate_price' | 'get_tariff' | 'general_chat' | 'clarification_needed';
  confidence: number;       // 0.0 - 1.0 arası emin olma durumu
  entities: {
    serviceType?: string;   // 'kurtarici', 'nakliye', 'vinc' vs.
    location?: string;
    amount?: number;
    unit?: string;
  };
  missing_info?: string[];  // Eksik olan bilgiler (örn: 'Hangi araç lazım?')
  search_keywords?: string[]; // Vektör araması için anahtar kelimeler
}

@Injectable()
export class ChatService {
  private client: Mistral;
  private readonly logger = new Logger(ChatService.name);

  // 🔥 GELİŞMİŞ FEW-SHOT PROMPT (EĞİTİM VERİSİ)
  private readonly REASONING_PROMPT = `
    Sen Transporter uygulamasının 'Bilişsel Karar Mekanizması'sın.
    Görevin: Kullanıcı mesajını analiz et, eksik bilgiyi tespit et ve JSON formatında çıktı ver.

    KURALLAR:
    1. "thought" alanında adım adım düşün. (Chain of Thought)
    2. Eğer kullanıcı belirsiz konuşuyorsa (örn: "araç lazım"), "intent": "clarification_needed" yap ve sor.
    3. Eğer kullanıcı "aküm bitti", "lastik patladı" derse, bunu "search_keywords" alanında ['oto_kurtarma', 'lastik', 'akü'] olarak genişlet.
    4. Sadece JSON formatında yanıt ver.

    --- FEW-SHOT EXAMPLES (ÖRNEKLER) ---
    User: "İzmirdeyim arabam bozuldu"
    AI: {
      "thought": "Kullanıcı arıza bildiriyor. Konum İzmir. Hizmet türü belirtmemiş ama 'bozuldu' dediği için çekici veya yol yardım lazım.",
      "intent": "search_driver",
      "confidence": 0.95,
      "entities": { "location": "İzmir", "serviceType": "kurtarici" },
      "search_keywords": ["oto_kurtarma", "çekici", "yol_yardım"]
    }

    User: "Fiyat ne kadar?"
    AI: {
      "thought": "Kullanıcı fiyat sordu ama neyin fiyatı? Nakliye mi, çekici mi? Bilgi eksik.",
      "intent": "clarification_needed",
      "confidence": 0.2,
      "entities": {},
      "missing_info": ["service_type"]
    }

    User: "Bornovadan İstanbula ev taşıycam kaç para tutar?"
    AI: {
      "thought": "Kullanıcı evden eve nakliye fiyatı istiyor. Mesafe hesaplama niyeti var.",
      "intent": "calculate_price",
      "confidence": 0.98,
      "entities": { "serviceType": "nakliye", "unit": "km" },
      "search_keywords": ["evden_eve", "nakliye", "kamyon"]
    }
    ------------------------------------
  `;

  constructor(
    private readonly usersService: UsersService,
    private readonly tariffsService: TariffsService
  ) {
    this.client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY || 'MISSING_KEY' });
  }

  /**
   * ANA SOHBET AKIŞI
   */
  async chat(message: string, history: any[], location?: { lat: number; lng: number }) {
    try {
      // 1. ADIM: BİLİŞSEL ANALİZ (Cognitive Analysis Step)
      // AI önce düşünüp karar veriyor, cevap yazmıyor.
      const analysis = await this.analyzeIntentWithCoT(message, history);
      
      this.logger.log(`🧠 AI Düşüncesi: ${analysis.thought}`);
      this.logger.log(`🎯 Tespit Edilen Niyet: ${analysis.intent} (Güven: ${analysis.confidence})`);

      let systemResponse = "";
      let foundData: any = null;
      let dataType = 'text';

      // 2. ADIM: EYLEM (Action Step)
      
      // SENARYO A: Yetersiz Bilgi / Teyit Gerekiyor
      if (analysis.intent === 'clarification_needed' || analysis.confidence < 0.70) {
        // AI doğrudan kullanıcıya soru sorsun
        return { 
          response: this.generateClarificationQuestion(analysis.missing_info), 
          role: 'assistant' 
        };
      }

      // SENARYO B: Araç Arama (Semantik/Vektör Simülasyonu)
      if (analysis.intent === 'search_driver') {
        const lat = location?.lat || 38.4237;
        const lng = location?.lng || 27.1428;

        // Vektör Araması Simülasyonu:
        // AI'ın ürettiği "search_keywords" (örn: ['lastik', 'yardım']) ile veritabanındaki tag'leri eşleştiriyoruz.
        const drivers = await this.usersService.findNearby(lat, lng, analysis.entities.serviceType);
        
        // Semantic Filter: Gelen sürücülerin tag'leri ile AI keywordlerini karşılaştır
        // (Basit bir re-ranking algoritması)
        const rankedDrivers = this.semanticReRank(drivers, analysis.search_keywords);

        if (rankedDrivers.length > 0) {
          foundData = rankedDrivers.slice(0, 5); // En alakalı 5 tanesi
          dataType = 'drivers_map';
          systemResponse = `Bölgenizde ihtiyacınıza en uygun ${rankedDrivers.length} araç buldum. Haritada görebilirsiniz.`;
        } else {
          systemResponse = "Şu an bölgenizde tam eşleşen bir araç bulamadım ancak çevre bölgeleri tarıyorum.";
        }
      }

      // SENARYO C: Fiyat Hesaplama
      if (analysis.intent === 'calculate_price') {
        const type = analysis.entities.serviceType || 'kurtarici';
        const tariff = await this.tariffsService.findByType(type) || { openingFee: 350, pricePerUnit: 30, unit: 'km' };
        
        // Miktar yoksa sor
        if (!analysis.entities.amount) {
           return { 
             response: `${tariff.unit === 'km' ? 'Mesafe' : 'Süre'} bilgisini de yazarsanız net fiyat çıkarabilirim. (Örn: 100 km)`, 
             role: 'assistant' 
           };
        }

        const total = tariff.openingFee + (analysis.entities.amount * tariff.pricePerUnit);
        
        foundData = {
          service: type.toUpperCase(),
          amount: analysis.entities.amount,
          unit: tariff.unit,
          total,
          details: `${tariff.openingFee} TL Açılış + (${analysis.entities.amount}x${tariff.pricePerUnit})`
        };
        dataType = 'calculation_result';
        systemResponse = `Hesaplamayı yaptım. Tahmini tutar: **${total} TL**`;
      }

      // SENARYO D: Tarife Bilgisi
      if (analysis.intent === 'get_tariff') {
        foundData = await this.tariffsService.findAll();
        dataType = 'tariffs';
        systemResponse = "Güncel piyasa koşullarına göre tarifelerimiz şöyledir:";
      }

      // SENARYO E: Genel Sohbet (AI Cevaplasın)
      if (analysis.intent === 'general_chat') {
        // Burada tekrar LLM'e gidip "Madlen" persona'sıyla cevap ürettiriyoruz.
        const chatResponse = await this.client.chat.complete({
          model: 'mistral-tiny',
          messages: [
            { role: 'system', content: "Sen Madlen'sin. Lojistik asistanısın. Kısa ve nazik cevap ver." },
            ...history.slice(-3),
            { role: 'user', content: message }
          ] as any
        });
        systemResponse = (chatResponse.choices?.[0]?.message?.content as string) || "Anlaşıldı.";
      }

      // 3. ADIM: CEVAP PAKETLEME (Synthesis Step)
      if (foundData) {
        const packet = JSON.stringify({ type: dataType, data: foundData });
        systemResponse += `||DATA||${packet}||DATA||`;
      }

      return { response: systemResponse, role: 'assistant' };

    } catch (error) {
      this.logger.error(`AI Motor Hatası: ${error.message}`);
      return { response: "Bağlantıda anlık bir kopma oldu, lütfen tekrar deneyin.", role: 'assistant' };
    }
  }

  // --- YARDIMCI FONKSİYONLAR ---

  /**
   * 🧠 BEYİN: Chain of Thought Analizi Yapar
   */
  private async analyzeIntentWithCoT(message: string, history: any[]): Promise<AIThoughtProcess> {
    try {
      const response = await this.client.chat.complete({
        model: 'mistral-small', // Daha zeki model kullanıyoruz analiz için
        messages: [
          { role: 'system', content: this.REASONING_PROMPT },
          ...history.slice(-2), // Sadece son bağlam
          { role: 'user', content: `ANALİZ ET: "${message}"` }
        ] as any,
        responseFormat: { type: 'json_object' } // Zorunlu JSON modu
      });

      const content = response.choices?.[0]?.message?.content;
      // JSON Parsing güvenliği
      try {
        return JSON.parse(content as string);
      } catch (e) {
        // AI JSON döndüremezse fallback
        return { 
          thought: "JSON hatası, manuel fallback.", 
          intent: 'general_chat', 
          confidence: 0.5, 
          entities: {} 
        };
      }
    } catch (e) {
      return { thought: "API Hatası", intent: 'general_chat', confidence: 0, entities: {} };
    }
  }

  /**
   * 🔍 SEMANTIC RE-RANKING (Basit Vektör Simülasyonu)
   * Veritabanından gelen 50 aracı, AI'ın belirlediği kelimelere göre puanlar ve sıralar.
   */
  private semanticReRank(drivers: any[], keywords: string[]): any[] {
    if (!keywords || keywords.length === 0) return drivers;

    return drivers.map(driver => {
      let score = 0;
      // Driver'ın verilerini birleştir (tags, isim, servis tipi)
      const driverText = `${driver.service?.tags?.join(' ') || ''} ${driver.businessName} ${driver.service?.subType}`.toLowerCase();
      
      // Keyword eşleşmelerine puan ver
      keywords.forEach(kw => {
        if (driverText.includes(kw.toLowerCase())) score += 10;
      });

      // Rating bonusu
      score += (driver.rating || 0); 

      return { ...driver, score };
    })
    .sort((a, b) => b.score - a.score) // Puanı yüksek olanı başa al
    .map(({ score, ...driver }) => driver); // Score alanını temizle ve dön
  }

  /**
   * ❓ Soru Üretici
   */
  private generateClarificationQuestion(missingInfo: string[] | undefined): string {
    if (!missingInfo || missingInfo.length === 0) return "Tam olarak nasıl yardımcı olabilirim?";
    
    if (missingInfo.includes('service_type')) return "Size yardımcı olabilmem için hangi hizmete ihtiyacınız olduğunu belirtir misiniz? (Örn: Çekici, Nakliye, Şarj)";
    if (missingInfo.includes('amount')) return "Fiyat hesaplayabilmem için mesafe (km) veya süre bilgisini yazabilir misiniz?";
    
    return "Biraz daha detay verebilir misiniz?";
  }
}