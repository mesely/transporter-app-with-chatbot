



import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import axios from 'axios';

@Injectable()
export class DataService {
  private readonly logger = new Logger(DataService.name);
  private readonly googleApiKey = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyCbbq8XeceIkg99CEQui1-_09zMnDtglrk';

    private readonly TURKEY_DATA = [
  { il: 'Tunceli', ilce: 'Tunceli Merkez' }, { il: 'Tunceli', ilce: 'Çemişgezek' },
  { il: 'Uşak', ilce: 'Banaz' }, { il: 'Uşak', ilce: 'Eşme' }, { il: 'Uşak', ilce: 'Karahallı' },
  { il: 'Uşak', ilce: 'Sivaslı' }, { il: 'Uşak', ilce: 'Ulubey' }, { il: 'Uşak', ilce: 'Uşak Merkez' },
  { il: 'Van', ilce: 'Bahçesaray' }, { il: 'Van', ilce: 'Başkale' }, { il: 'Van', ilce: 'Edremit' },
  { il: 'Van', ilce: 'Erciş' }, { il: 'Van', ilce: 'Gevaş' }, { il: 'Van', ilce: 'Gürpınar' },
  { il: 'Van', ilce: 'Muradiye' }, { il: 'Van', ilce: 'Saray' }, { il: 'Van', ilce: 'Tuşba' },
  { il: 'Van', ilce: 'Çaldıran' }, { il: 'Van', ilce: 'Çatak' }, { il: 'Van', ilce: 'Özalp' }, { il: 'Van', ilce: 'İpekyolu' },
  { il: 'Yalova', ilce: 'Altınova' }, { il: 'Yalova', ilce: 'Armutlu' }, { il: 'Yalova', ilce: 'Termal' },
  { il: 'Yalova', ilce: 'Yalova Merkez' }, { il: 'Yalova', ilce: 'Çiftlikköy' }, { il: 'Yalova', ilce: 'Çınarcık' },
  { il: 'Yozgat', ilce: 'Akdağmadeni' }, { il: 'Yozgat', ilce: 'Aydıncık' }, { il: 'Yozgat', ilce: 'Boğazlıyan' },
  { il: 'Yozgat', ilce: 'Kadışehri' }, { il: 'Yozgat', ilce: 'Saraykent' }, { il: 'Yozgat', ilce: 'Sarıkaya' },
  { il: 'Yozgat', ilce: 'Sorgun' }, { il: 'Yozgat', ilce: 'Yenifakılı' }, { il: 'Yozgat', ilce: 'Yerköy' },
  { il: 'Yozgat', ilce: 'Yozgat Merkez' }, { il: 'Yozgat', ilce: 'Çandır' }, { il: 'Yozgat', ilce: 'Çayıralan' },
  { il: 'Yozgat', ilce: 'Çekerek' }, { il: 'Yozgat', ilce: 'Şefaatli' },
  { il: 'Zonguldak', ilce: 'Alaplı' }, { il: 'Zonguldak', ilce: 'Devrek' }, { il: 'Zonguldak', ilce: 'Ereğli' },
  { il: 'Zonguldak', ilce: 'Gökçebey' }, { il: 'Zonguldak', ilce: 'Kilimli' }, { il: 'Zonguldak', ilce: 'Kozlu' }, { il: 'Zonguldak', ilce: 'Zonguldak Merkez' }, { il: 'Zonguldak', ilce: 'Çaycuma' },
  { il: 'Çanakkale', ilce: 'Ayvacık' }, { il: 'Çanakkale', ilce: 'Bayramiç' }, { il: 'Çanakkale', ilce: 'Biga' },
  { il: 'Çanakkale', ilce: 'Bozcaada' }, { il: 'Çanakkale', ilce: 'Eceabat' }, { il: 'Çanakkale', ilce: 'Ezine' },
  { il: 'Çanakkale', ilce: 'Gelibolu' }, { il: 'Çanakkale', ilce: 'Gökçeada' }, { il: 'Çanakkale', ilce: 'Lapseki' },
  { il: 'Çanakkale', ilce: 'Yenice' }, { il: 'Çanakkale', ilce: 'Çan' }, { il: 'Çanakkale', ilce: 'Çanakkale Merkez' },
  { il: 'Çankırı', ilce: 'Atkaracalar' }, { il: 'Çankırı', ilce: 'Bayramören' }, { il: 'Çankırı', ilce: 'Eldivan' },
  { il: 'Çankırı', ilce: 'Ilgaz' }, { il: 'Çankırı', ilce: 'Korgun' }, { il: 'Çankırı', ilce: 'Kurşunlu' },
  { il: 'Çankırı', ilce: 'Kızılırmak' }, { il: 'Çankırı', ilce: 'Orta' }, { il: 'Çankırı', ilce: 'Yapraklı' },
  { il: 'Çankırı', ilce: 'Çankırı Merkez' }, { il: 'Çankırı', ilce: 'Çerkeş' }, { il: 'Çankırı', ilce: 'Şabanözü' },
  { il: 'Çorum', ilce: 'Alaca' }, { il: 'Çorum', ilce: 'Bayat' }, { il: 'Çorum', ilce: 'Boğazkale' },
  { il: 'Çorum', ilce: 'Dodurga' }, { il: 'Çorum', ilce: 'Kargı' }, { il: 'Çorum', ilce: 'Laçin' },
  { il: 'Çorum', ilce: 'Mecitözü' }, { il: 'Çorum', ilce: 'Ortaköy' }, { il: 'Çorum', ilce: 'Osmancık' },
  { il: 'Çorum', ilce: 'Oğuzlar' }, { il: 'Çorum', ilce: 'Sungurlu' }, { il: 'Çorum', ilce: 'Uğurludağ' },
  { il: 'Çorum', ilce: 'Çorum Merkez' }, { il: 'Çorum', ilce: 'İskilip' },
  { il: 'İstanbul', ilce: 'Adalar' }, { il: 'İstanbul', ilce: 'Arnavutköy' }, { il: 'İstanbul', ilce: 'Ataşehir' },
  { il: 'İstanbul', ilce: 'Avcılar' }, { il: 'İstanbul', ilce: 'Bahçelievler' }, { il: 'İstanbul', ilce: 'Bakırköy' },
  { il: 'İstanbul', ilce: 'Bayrampaşa' }, { il: 'İstanbul', ilce: 'Bağcılar' }, { il: 'İstanbul', ilce: 'Başakşehir' },
  { il: 'İstanbul', ilce: 'Beykoz' }, { il: 'İstanbul', ilce: 'Beylikdüzü' }, { il: 'İstanbul', ilce: 'Beyoğlu' },
  { il: 'İstanbul', ilce: 'Beşiktaş' }, { il: 'İstanbul', ilce: 'Büyükçekmece' }, { il: 'İstanbul', ilce: 'Esenler' },
  { il: 'İstanbul', ilce: 'Esenyurt' }, { il: 'İstanbul', ilce: 'Eyüpsultan' }, { il: 'İstanbul', ilce: 'Fatih' },
  { il: 'İstanbul', ilce: 'Gaziosmanpaşa' }, { il: 'İstanbul', ilce: 'Güngören' }, { il: 'İstanbul', ilce: 'Kadıköy' },
  { il: 'İstanbul', ilce: 'Kartal' }, { il: 'İstanbul', ilce: 'Kâğıthane' }, { il: 'İstanbul', ilce: 'Küçükçekmece' },
  { il: 'İstanbul', ilce: 'Maltepe' }, { il: 'İstanbul', ilce: 'Pendik' }, { il: 'İstanbul', ilce: 'Sancaktepe' },
  { il: 'İstanbul', ilce: 'Sarıyer' }, { il: 'İstanbul', ilce: 'Silivri' }, { il: 'İstanbul', ilce: 'Sultanbeyli' },
  { il: 'İstanbul', ilce: 'Sultangazi' }, { il: 'İstanbul', ilce: 'Tuzla' }, { il: 'İstanbul', ilce: 'Zeytinburnu' },
  { il: 'İstanbul', ilce: 'Çatalca' }, { il: 'İstanbul', ilce: 'Çekmeköy' }, { il: 'İstanbul', ilce: 'Ümraniye' },
  { il: 'İstanbul', ilce: 'Üsküdar' }, { il: 'İstanbul', ilce: 'Şile' }, { il: 'İstanbul', ilce: 'Şişli' },
  { il: 'İzmir', ilce: 'Aliağa' }, { il: 'İzmir', ilce: 'Balçova' }, { il: 'İzmir', ilce: 'Bayraklı' },
  { il: 'İzmir', ilce: 'Bayındır' }, { il: 'İzmir', ilce: 'Bergama' }, { il: 'İzmir', ilce: 'Beydağ' },
  { il: 'İzmir', ilce: 'Bornova' }, { il: 'İzmir', ilce: 'Buca' }, { il: 'İzmir', ilce: 'Dikili' },
  { il: 'İzmir', ilce: 'Foça' }, { il: 'İzmir', ilce: 'Gaziemir' }, { il: 'İzmir', ilce: 'Güzelbahçe' },
  { il: 'İzmir', ilce: 'Karabağlar' }, { il: 'İzmir', ilce: 'Karaburun' }, { il: 'İzmir', ilce: 'Karşıyaka' },
  { il: 'İzmir', ilce: 'Kemalpaşa' }, { il: 'İzmir', ilce: 'Kiraz' }, { il: 'İzmir', ilce: 'Konak' },
  { il: 'İzmir', ilce: 'Kınık' }, { il: 'İzmir', ilce: 'Menderes' }, { il: 'İzmir', ilce: 'Menemen' },
  { il: 'İzmir', ilce: 'Narlıdere' }, { il: 'İzmir', ilce: 'Seferihisar' }, { il: 'İzmir', ilce: 'Selçuk' },
  { il: 'İzmir', ilce: 'Tire' }, { il: 'İzmir', ilce: 'Torbalı' }, { il: 'İzmir', ilce: 'Urla' },
  { il: 'İzmir', ilce: 'Çeşme' }, { il: 'İzmir', ilce: 'Çiğli' }, { il: 'İzmir', ilce: 'Ödemiş' },
  { il: 'Şanlıurfa', ilce: 'Akçakale' }, { il: 'Şanlıurfa', ilce: 'Birecik' }, { il: 'Şanlıurfa', ilce: 'Bozova' },
  { il: 'Şanlıurfa', ilce: 'Ceylanpınar' }, { il: 'Şanlıurfa', ilce: 'Eyyübiye' }, { il: 'Şanlıurfa', ilce: 'Halfeti' },
  { il: 'Şanlıurfa', ilce: 'Haliliye' }, { il: 'Şanlıurfa', ilce: 'Harran' }, { il: 'Şanlıurfa', ilce: 'Hilvan' },
  { il: 'Şanlıurfa', ilce: 'Karaköprü' }, { il: 'Şanlıurfa', ilce: 'Siverek' }, { il: 'Şanlıurfa', ilce: 'Suruç' },
  { il: 'Şanlıurfa', ilce: 'Viranşehir' },
  { il: 'Şırnak', ilce: 'Beytüşşebap' }, { il: 'Şırnak', ilce: 'Cizre' }, { il: 'Şırnak', ilce: 'Güçlükonak' },
  { il: 'Şırnak', ilce: 'Silopi' }, { il: 'Şırnak', ilce: 'Uludere' }, { il: 'Şırnak', ilce: 'İdil' }, { il: 'Şırnak', ilce: 'Şırnak Merkez' }
];
  
  constructor(private readonly usersService: UsersService) {}

  // 1. Manuel veya Toplu Kayıt İşleyici
  async processAndSave(data: any) {
    try {
      let finalData = { ...data };

      // Google Enrichment (Eğer koordinat yoksa)
      if (!finalData.lat || !finalData.lng) {
        const googlePlace = await this.getSinglePlaceFromGoogle(finalData.firstName, finalData.city);
        if (googlePlace) {
          finalData.lat = googlePlace.location.latitude;
          finalData.lng = googlePlace.location.longitude;
          if (!finalData.phoneNumber) finalData.phoneNumber = googlePlace.nationalPhoneNumber;
          if (!finalData.rating) finalData.rating = googlePlace.rating;
          if (!finalData.address) finalData.address = this.cleanAddress(googlePlace.formattedAddress);
          if (googlePlace.websiteUri) finalData.link = googlePlace.websiteUri;
        }
      }

      // Akıllı Kategori Temizliği
      const refined = this.refineMobileCharging(finalData.serviceType, finalData.firstName);
      finalData.serviceType = refined.type;
      
      const existingTags = finalData.filterTags || [];
      finalData.filterTags = [...new Set([...existingTags, ...refined.tags])];

      // Metadata
      const meta = this.getEnhancedMetadata(finalData.serviceType, finalData.city || 'Tüm Türkiye', '');
      
      // Kayıt
      return this.usersService.create({
        ...finalData,
        routes: meta.route,
        companyStatus: meta.status
      });
    } catch (error) {
      this.logger.error(`Akıllı Kayıt Hatası: ${error.message}`);
      return null;
    }
  }

  // 🛡️ GÜVENLİ MOD: VERİTABANI DÜZELTME ROBOTU
  async fixExistingCategories() {
    this.logger.log("🧹 Veritabanı Temizliği Başladı...");
    
    // Tüm kullanıcıları getir
    const allUsers: any[] = await this.usersService.findAll();
    let stationCount = 0;
    let batteryCount = 0;
    let errorCount = 0;

    for (const user of allUsers) {
      try {
        // 🛑 KORUMA KALKANI: İsim veya Tip yoksa bu kaydı atla!
        if (!user.firstName || !user.serviceType) {
            continue; 
        }

        if (user.serviceType === 'seyyar_sarj') {
          // Güvenli küçültme (String olduğundan emin oluyoruz)
          const nameLower = String(user.firstName).toLocaleLowerCase('tr-TR');
          let needsUpdate = false;
          let updateData: any = {};

          // SENARYO A: Şarj İstasyonları
          const stationKeywords = ['istasyon', 'zes', 'eşarj', 'esarj', 'voltrun', 'trugo', 'togg', 'sharz', 'beefull', 'astor', 'şarj', 'charge'];
          if (stationKeywords.some(k => nameLower.includes(k))) {
            updateData.serviceType = 'sarj_istasyonu';
            const currentTags = user.filterTags || [];
            if (!currentTags.includes('hızlı_şarj')) {
               updateData.filterTags = [...currentTags, 'hızlı_şarj'];
            }
            needsUpdate = true;
            stationCount++;
          }

          // SENARYO B: Akücüler
          const batteryKeywords = ['akü', 'aku', 'battery', 'varta', 'mutlu', 'inci', 'yiğit', 'enerji', 'elektrik'];
          if (batteryKeywords.some(k => nameLower.includes(k))) {
            updateData.serviceType = 'oto_kurtarma';
            const currentTags = user.filterTags || [];
            if (!currentTags.includes('akü_takviye')) {
               updateData.filterTags = [...currentTags, 'akü_takviye'];
            }
            needsUpdate = true;
            batteryCount++;
          }

          // Değişiklik varsa güncelle
          if (needsUpdate) {
            await this.usersService.updateOne(user._id, updateData);
          }
        }
      } catch (e) {
        // Tekil hata olursa logla ve devam et (Sistemi çökertme)
        this.logger.error(`Satır atlandı (ID: ${user._id}): ${e.message}`);
        errorCount++;
      }
    }

    return {
      status: 'SUCCESS',
      message: 'Temizlik Tamamlandı.',
      movedToStation: stationCount,
      movedToRescue: batteryCount,
      skippedErrors: errorCount
    };
  }

  // --- YARDIMCI FONKSİYONLAR ---

  private refineMobileCharging(type: string, name: string): { type: string, tags: string[] } {
    if (type !== 'seyyar_sarj' || !name) return { type, tags: [] };

    const lowerName = name.toLocaleLowerCase('tr-TR');
    
    const stationKeywords = ['istasyon', 'station', 'zes', 'eşarj', 'esarj', 'voltrun', 'trugo', 'togg', 'sharz', 'beefull'];
    if (stationKeywords.some(k => lowerName.includes(k))) {
        return { type: 'sarj_istasyonu', tags: ['hızlı_şarj', 'dc_şarj'] };
    }

    const batteryKeywords = ['akü', 'aku', 'battery', 'oto elektrik', 'mutlu', 'varta', 'inci', 'yiğit'];
    if (batteryKeywords.some(k => lowerName.includes(k))) {
        return { type: 'oto_kurtarma', tags: ['akü_takviye', 'yerinde_montaj'] };
    }

    return { type: 'seyyar_sarj', tags: ['mobil_unit'] };
  }

  private async getSinglePlaceFromGoogle(name: string, city: string) {
    try {
      const url = 'https://places.googleapis.com/v1/places:searchText';
      const response = await axios.post(url, 
        { textQuery: `${name} in ${city}`, maxResultCount: 1 },
        { headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.googleApiKey,
          'X-Goog-FieldMask': 'places.location,places.nationalPhoneNumber,places.rating,places.formattedAddress,places.websiteUri'
        }}
      );
      return response.data.places?.[0] || null;
    } catch (err) { return null; }
  }

  private cleanAddress(fullAddress: string): string {
    if (!fullAddress) return '';
    let clean = fullAddress.replace(/, Türkiye|, Turkey/gi, '');
    clean = clean.replace(/\b\d{5}\b/g, '').replace(/\s\s+/g, ' ').trim();
    return clean.endsWith(',') ? clean.slice(0, -1) : clean;
  }

  private getEnhancedMetadata(type: string, city: string, district: string) {
    const cityUpper = (city || '').toLocaleUpperCase('tr-TR');
    if (type === 'yurt_disi_nakliye') return { route: `${cityUpper} - GLOBAL`, status: 'ULUSLARARASI' };

    const metaMap: Record<string, { route: string; status: string }> = {
      sarj_istasyonu: { route: `${cityUpper} - ŞARJ AĞI`, status: 'KURUMSAL' },
      seyyar_sarj: { route: `${cityUpper} MOBİL DESTEK`, status: '7/24' },
      kurtarici: { route: `${cityUpper} YOL YARDIM`, status: 'ONAYLI' },
      vinc: { route: `${cityUpper} VİNÇ HİZMETİ`, status: 'OPERASYONEL' },
      nakliye: { route: `${cityUpper} EVDEN EVE`, status: 'K3 BELGELİ' },
      oto_kurtarma: { route: `${cityUpper} YOL YARDIM`, status: 'YEREL' }
    };
    return metaMap[type] || { route: 'TÜM TÜRKİYE', status: 'AKTİF' };
  }
    
  // (Burada populateTurkeyData ve diğerleri kalabilir, sildiysen ekle)
   async populateTurkeyData() { return { status: 'Passive' } }
   private getResultLimit(city: string) { return 3; }
   private analyzeServiceType(original: string, name: string) { return original; }
   async fetchPlaceFromGoogle() { return 0; }
   async getDbStats() {
    const allUsers: any[] = await this.usersService.findAll();
    const stats = allUsers.reduce((acc, user) => {
      const type = user.serviceType || 'belirsiz';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    return { total: allUsers.length, distribution: stats };
  }
}