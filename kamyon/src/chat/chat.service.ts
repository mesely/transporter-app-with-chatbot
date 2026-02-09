import { Injectable, Logger } from '@nestjs/common';
import { Mistral } from '@mistralai/mistralai';
import { UsersService } from '../users/users.service';
import { TariffsService } from '../tariffs/tariffs.service';

@Injectable()
export class ChatService {
  private client: Mistral;
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly tariffsService: TariffsService
  ) {
    this.client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY || 'MISSING_KEY' });
  }

  /**
   * YARDIMCI: Metin içinde hizmet türünü sektörel anahtar kelimelerle tespit eder.
   */
  private detectServiceType(text: string): string | null {
    const t = text.toLowerCase();
    if (t.includes('nakliye') || t.includes('taşıma') || t.includes('evden eve')) return 'nakliye';
    if (t.includes('çekici') || t.includes('kurtarıcı') || t.includes('kurtarici')) return 'kurtarici';
    if (t.includes('mobil şarj') || t.includes('mobil sarj') || t.includes('seyyar')) return 'seyyar_sarj';
    if (t.includes('istasyon') || t.includes('sabit şarj')) return 'sarj_istasyonu';
    if (t.includes('vinç') || t.includes('vinc')) return 'vinc';
    return null;
  }

  /**
   * YARDIMCI: Hizmet türüne göre hesaplama birimini döner.
   */
  private getUnitType(service: string): string {
    const units: Record<string, string> = {
      sarj_istasyonu: 'dk',
      seyyar_sarj: 'saat',
      vinc: 'saat',
      kurtarici: 'km',
      nakliye: 'km'
    };
    return units[service] || 'km';
  }

  /**
   * YARDIMCI: Sistem durum kodlarını kullanıcı dostu Türkçe mesajlara çevirir.
   */
  private getMessageForCode(code: string): string {
    const messages: Record<string, string> = {
      HESAP_HIZMET_SEC: "Hangi hizmet için fiyat hesaplaması yapmak istersiniz?",
      HESAP_KM_GIRIS: "Lütfen gidilecek mesafeyi (KM) belirtiniz.",
      HESAP_DK_GIRIS: "Şarj süresini (Dakika) belirtiniz.",
      HESAP_SAAT_GIRIS: "Hizmet süresini (Saat) belirtiniz.",
      HESAP_KW_GIRIS: "Dolum miktarını (kW) giriniz.",
      HESAP_SONUC: "Fiyat simülasyonu tamamlandı. İşte detaylar:",
      LISTE_TARIFE: "Güncel lojistik tarifelerimiz aşağıdadır:",
      LISTE_SIPARIS: "Geçmiş siparişleriniz listelendi. Destek almak istediğiniz kaydı seçebilirsiniz:",
      ARAC_BULUNDU: "Bölgenizdeki aktif hizmet sağlayıcılar listelendi:",
      ARAC_YOK: "Üzgünüm, şu an bu bölgede aktif bir araç bulamadım.",
      BILGI_KURUMSAL: "Kurumsal iş ortaklığı ve Lojistik-Destek hattımız: 0850 305 35 35"
    };
    return messages[code] || "Anlaşılamadı, lütfen biraz daha detay verir misiniz?";
  }

  /**
   * ANA SOHBET FONKSİYONU
   * @param message Kullanıcı mesajı
   * @param history Sohbet geçmişi
   * @param location { lat, lng } Kullanıcı konumu (Opsiyonel)
   */
  async chat(message: string, history: any[], location?: { lat: number; lng: number }) {
    try {
      let systemCode = "";
      let foundData: any = null;
      let dataType = 'text'; // Varsayılan veri tipi
      let aiNeeded = false;
      
      const lowerMsg = message.toLowerCase();

      // --- NİYET ANALİZİ (Intent Classification) ---
      let isCalculation = lowerMsg.includes('hesap') || !!lowerMsg.match(/\d+/);
      let isTariff = lowerMsg.includes('fiyat') || lowerMsg.includes('tarife');
      let isComplaint = lowerMsg.includes('şikayet') || lowerMsg.includes('destek') || lowerMsg.includes('sipariş');
      let isCorporate = lowerMsg.includes('kurumsal') || lowerMsg.includes('şirket');
      let searchType = this.detectServiceType(message);

      // --- SENARYO 1: HESAPLAMA VE SİMÜLASYON ---
      if (isCalculation && !isTariff && !isComplaint) {
        let serviceKey = this.detectServiceType(message);
        
        // Geçmişten hizmet türü hatırlama (Context Awareness)
        if (!serviceKey && history.length > 0) {
          for (let i = history.length - 1; i >= 0; i--) {
            const pastService = this.detectServiceType(history[i].content);
            if (pastService) { serviceKey = pastService; break; }
          }
        }

        if (!serviceKey) {
          systemCode = "HESAP_HIZMET_SEC";
          foundData = [
            { label: 'Nakliye Hesapla', query: 'Nakliye fiyatı hesapla' },
            { label: 'Çekici Hesapla', query: 'Çekici fiyatı hesapla' },
            { label: 'Şarj Hesapla', query: 'Mobil şarj fiyatı hesapla' }
          ];
          dataType = 'selection';
        } else {
          const unitType = this.getUnitType(serviceKey);
          const amountMatch = message.match(/(\d+)/);
          const amount = amountMatch ? parseInt(amountMatch[0]) : null;

          if (!amount) {
            systemCode = unitType === 'dk' ? "HESAP_DK_GIRIS" : (unitType === 'saat' ? "HESAP_SAAT_GIRIS" : "HESAP_KM_GIRIS");
            dataType = 'input_value';
            foundData = { service: serviceKey, unit: unitType };
          } else {
            // Dinamik Tarife Hesaplama
            let safeTariff = { openingFee: 500, pricePerUnit: 20, unit: unitType }; // Default değerler
            try {
              // Veritabanından güncel tarifeyi çek
              const dbTariff = await this.tariffsService.findByType(serviceKey);
              if (dbTariff) {
                safeTariff = { 
                  openingFee: dbTariff.openingFee, 
                  pricePerUnit: dbTariff.pricePerUnit, 
                  unit: dbTariff.unit 
                };
              }
            } catch (e) { 
              this.logger.warn("Tarife çekilemedi, default değerler kullanılıyor."); 
            }

            const total = safeTariff.openingFee + (amount * safeTariff.pricePerUnit);
            
            foundData = {
              service: serviceKey.toUpperCase().replace('_', ' '),
              amount, 
              unit: safeTariff.unit, 
              total,
              openingFee: safeTariff.openingFee,
              pricePerUnit: safeTariff.pricePerUnit,
              breakdown: `${safeTariff.openingFee} TL Açılış + (${amount} ${safeTariff.unit} x ${safeTariff.pricePerUnit} TL)`
            };
            dataType = 'calculation_result';
            systemCode = "HESAP_SONUC";
          }
        }
      }

      // --- SENARYO 2: TARİFELER ---
      else if (isTariff) {
        try {
          foundData = await this.tariffsService.findAll();
          if (!foundData || foundData.length === 0) {
            // Veritabanı boşsa örnek veri dön
            foundData = [{ serviceType: 'kurtarici', openingFee: 1200, pricePerUnit: 35, unit: 'km' }];
          }
        } catch (e) { foundData = []; }
        dataType = 'tariffs';
        systemCode = "LISTE_TARIFE";
      }

      // --- SENARYO 3: KURUMSAL BİLGİ ---
      else if (isCorporate) {
        systemCode = "BILGI_KURUMSAL";
      }

      // --- SENARYO 4: ARAÇ / HİZMET ARAMA (Konum Bazlı) ---
      else if (searchType) {
        // Eğer konum bilgisi geldiyse onu kullan, yoksa varsayılan (İzmir) kullan
        const lat = location?.lat || 38.42;
        const lng = location?.lng || 27.14;

        this.logger.log(`Araç Arama: ${searchType} @ [${lat}, ${lng}]`);

        // UsersService üzerinden arama yap (Artık findNearby kullanıyoruz)
        foundData = await this.usersService.findNearby(lat, lng, searchType);
        
        dataType = 'drivers';
        systemCode = foundData && foundData.length > 0 ? "ARAC_BULUNDU" : "ARAC_YOK";
      }

      // --- SENARYO 5: GENEL SOHBET (AI) ---
      else {
        aiNeeded = true;
      }

      // --- CEVAP OLUŞTURMA VE DATA PACKET ---
      let content = "";
      if (systemCode) {
        // Sistem mesajını al
        content = this.getMessageForCode(systemCode);
      } else if (aiNeeded) {
        // AI'ya sor
        try {
          const chatResponse = await this.client.chat.complete({
            model: 'mistral-tiny',
            messages: [
              { role: 'system', content: 'Sen Transporter uygulamasının zeki asistanı Madlensin. Lojistik, çekici ve şarj konularında kısa, profesyonel Türkçe cevaplar ver. Kullanıcıya her zaman yardımcı olmaya çalış.' },
              ...history, // Önceki konuşmalar
              { role: 'user', content: message } // Güncel mesaj
            ] as any,
          });
          content = (chatResponse.choices?.[0]?.message?.content as string) || "Üzgünüm, şu an cevap veremiyorum.";
        } catch (aiError) {
          this.logger.error(`AI Hatası: ${aiError}`);
          content = "Bağlantı yoğunluğu nedeniyle şu an cevap veremiyorum, lütfen tekrar deneyin.";
        }
      }

      // Data Packet Ekleme (Frontend'in parse edeceği kısım)
      // Format: ||DATA||{...JSON...}||DATA||
      if (foundData) {
        const packet = { 
          type: dataType, 
          items: Array.isArray(foundData) ? foundData : [foundData] 
        };
        content += `||DATA||${JSON.stringify(packet)}||DATA||`;
      }

      return { response: content, role: 'assistant' };

    } catch (error) {
      this.logger.error(`Chat Servis Hatası: ${error.message}`);
      return { response: "Sistemsel bir hata oluştu, lütfen daha sonra tekrar deneyin.", role: 'assistant' };
    }
  }
}