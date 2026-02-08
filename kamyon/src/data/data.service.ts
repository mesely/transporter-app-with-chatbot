import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import axios from 'axios';

@Injectable()
export class DataService {
  private readonly logger = new Logger(DataService.name);
  private readonly googleApiKey = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyCbbq8XeceIkg99CEQui1-_09zMnDtglrk';

  // TURKEY_DATA listesini buraya eski haliyle bırakabilirsin.
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

  private cleanAddress(fullAddress: string): string {
    if (!fullAddress) return '';
    let clean = fullAddress.replace(/, Türkiye|, Turkey/gi, '');
    clean = clean.replace(/\b\d{5}\b/g, '').replace(/\s\s+/g, ' ').trim();
    return clean.endsWith(',') ? clean.slice(0, -1) : clean;
  }

  private getEnhancedMetadata(type: string, city: string, district: string) {
    const cityUpper = city.toLocaleUpperCase('tr-TR');
    const distUpper = district.toLocaleUpperCase('tr-TR');
    const metaMap: Record<string, { route: string; status: string }> = {
      sarj_istasyonu: { route: `${cityUpper} - AKILLI ŞARJ AĞI`, status: 'KURUMSAL' },
      seyyar_sarj: { route: `${distUpper} / ${cityUpper} MOBİL DESTEK`, status: '7/24 AKTİF' },
      kurtarici: { route: `${cityUpper} MERKEZ & OTOYOL DESTEK`, status: 'ONAYLI ÇEKİCİ' },
      vinc: { route: `${cityUpper} GENELİ AĞIR OPERASYON`, status: 'OPERASYONEL' },
      tir: { route: `${cityUpper} - ULUSLARARASI KORİDOR`, status: 'L2 BELGELİ' },
      kamyon: { route: `ŞEHİRLER ARASI SEVKİYAT`, status: 'K1 BELGELİ' },
      kamyonet: { route: `${distUpper} İÇİ EKSPRES DAĞITIM`, status: 'ŞEHİR İÇİ' },
      nakliye: { route: `${distUpper} / ${cityUpper} EVDEN EVE`, status: 'K3 BELGELİ' }
    };
    return metaMap[type] || { route: 'TÜM TÜRKİYE', status: 'ONAYLI' };
  }

  private getResultLimit(city: string): number {
    const metropolises = ['İstanbul', 'Ankara', 'İzmir'];
    return metropolises.includes(city) ? 5 : 2;
  }

  async fetchPlaceFromGoogle(query: string, type: string, il: string, ilce: string, tag: string, limit: number) {
    try {
      const url = 'https://places.googleapis.com/v1/places:searchText';
      const requestBody = {
        textQuery: `${query} in ${ilce} ${il}`,
        maxResultCount: limit,
        rankPreference: 'RELEVANCE'
      };

      const headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.googleApiKey,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.internationalPhoneNumber,places.nationalPhoneNumber,places.rating'
      };

      const response = await axios.post(url, requestBody, { headers });
      const places = response.data.places;

      if (!places || places.length === 0) return 0;

      for (const place of places) {
        const meta = this.getEnhancedMetadata(type, il, ilce);
        const placeName = place.displayName?.text;
        let phone = place.nationalPhoneNumber?.replace(/\D/g, '') || `05${Math.floor(30 + Math.random() * 20)}${Math.floor(1000000 + Math.random() * 9000000)}`;
        const email = `${placeName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)}_${Math.floor(Math.random() * 9999)}@transporter.app`;

        await this.usersService.create({
          email,
          password: '123',
          role: 'provider',
          isActive: true,
          firstName: `${placeName} (${tag})`,
          lastName: 'Hizmetleri',
          phoneNumber: phone.startsWith('0') ? phone : '0' + phone,
          serviceType: type,
          address: this.cleanAddress(place.formattedAddress),
          city: il,
          routes: meta.route,
          companyStatus: meta.status,
          rating: place.rating || 0,
          location: {
            type: 'Point',
            coordinates: [place.location.longitude, place.location.latitude]
          }
        } as any);
      }
      return places.length;
    } catch (error) {
      this.logger.error(`❌ API Hatası: ${error.message}`);
      return 0;
    }
  }

  async populateTurkeyData() {
    this.logger.log("⚡️ EK KAYNAK TARAMASI BAŞLATILDI: Şarj, Mobil Şarj ve Kamyon Garajları aranıyor...");
    
    // 🔥 SADECE İSTENEN 3 KATEGORİ 🔥
    const categories = [
      // 1. Şarj İstasyonları
      { q: 'Elektrikli Araç Şarj İstasyonu', t: 'sarj_istasyonu', tag: 'İstasyon' },
      
      // 2. Mobil Şarj (Yol Yardım üzerinden bulunur)
      { q: 'Oto Elektrik Yol Yardım', t: 'seyyar_sarj', tag: 'Mobil Şarj' },

      // 3. Kamyon (Garaj ve Nakliyeciler Sitesi üzerinden bulunur)
      { q: 'Kamyon Garajı Nakliyeciler Sitesi', t: 'kamyon', tag: 'Kamyon' }
    ];

    let totalSaved = 0;
    for (const item of this.TURKEY_DATA) {
      const limit = this.getResultLimit(item.il);
      for (const cat of categories) {
        const count = await this.fetchPlaceFromGoogle(cat.q, cat.t, item.il, item.ilce, cat.tag, limit);
        totalSaved += count;
        // Hız limiti aşmamak için bekleme
        await new Promise(r => setTimeout(r, 150)); 
      }
      this.logger.log(`✅ ${item.ilce} / ${item.il} tarandı. Eklenen: ${totalSaved}`);
    }
    return { status: 'SUCCESS', totalAdded: totalSaved };
  }

  async getDbStats() {
    const allUsers: any[] = await this.usersService.findAll();
    
    const stats = allUsers.reduce((acc, user) => {
      const type = user.serviceType || (user.profile && user.profile.serviceType) || 'belirsiz';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return {
      total: allUsers.length,
      distribution: stats,
      dbStatus: allUsers.length > 0 ? 'SYNCHRONIZED' : 'EMPTY'
    };
  }
}