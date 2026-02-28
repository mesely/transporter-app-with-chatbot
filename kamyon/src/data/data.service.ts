import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose'; 
import * as bcrypt from 'bcrypt';
import axios from 'axios';

import { NewUser, NewUserDocument } from './schemas/new-user.schema';
import { NewProvider, NewProviderDocument } from './schemas/new-provider.schema';
import { Profile } from '../users/schemas/profile.schema';
import { TURKEY_DATA } from './turkey_data';
import { european_data, us_data } from './abroad';

type ImportLastikOptions = {
  start?: number;
  end?: number;
  perDistrictLimit?: number;
  dryRun?: boolean;
};

type ImportAbroadOptions = {
  start?: number;
  end?: number;
  perServiceLimit?: number;
  dryRun?: boolean;
  includeEurope?: boolean;
  includeUs?: boolean;
};

type StaticPassengerFirm = {
  name: string;
  categories: Array<'otobus' | 'midibus' | 'minibus' | 'vip_tasima'>;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
};

@Injectable()
export class DataService {
  private readonly logger = new Logger(DataService.name);
  private readonly abroadServiceDefs: Array<{
    key: string;
    mainType: 'KURTARICI' | 'NAKLIYE' | 'SARJ' | 'YOLCU' | 'YURT_DISI';
    subType: string;
    tags: string[];
    queries: string[];
  }> = [
    { key: 'oto_kurtarma', mainType: 'KURTARICI', subType: 'oto_kurtarma', tags: ['oto_kurtarma', 'roadside', '7/24'], queries: ['tow truck', 'roadside assistance', 'vehicle recovery'] },
    { key: 'vinc', mainType: 'KURTARICI', subType: 'vinc', tags: ['vinc', 'crane', '7/24'], queries: ['mobile crane service', 'truck crane', 'crane rental'] },
    { key: 'lastik', mainType: 'KURTARICI', subType: 'lastik', tags: ['lastik', 'tire', '7/24'], queries: ['tire shop', 'tyre service', 'auto tire'] },
    { key: 'tir', mainType: 'NAKLIYE', subType: 'tir', tags: ['tir', 'freight'], queries: ['semi truck transport', 'trailer logistics', 'freight trucking'] },
    { key: 'kamyon', mainType: 'NAKLIYE', subType: 'kamyon', tags: ['kamyon', 'freight'], queries: ['truck transport company', 'cargo truck service', 'freight carrier'] },
    { key: 'kamyonet', mainType: 'NAKLIYE', subType: 'kamyonet', tags: ['kamyonet', 'van'], queries: ['cargo van service', 'delivery van company', 'light truck transport'] },
    { key: 'evden_eve', mainType: 'NAKLIYE', subType: 'evden_eve', tags: ['evden_eve', 'moving'], queries: ['moving company', 'house removals', 'home relocation service'] },
    { key: 'yurt_disi_nakliye', mainType: 'NAKLIYE', subType: 'yurt_disi_nakliye', tags: ['yurt_disi_nakliye', 'international'], queries: ['international logistics', 'cross border shipping', 'international freight forwarder'] },
    { key: 'minibus', mainType: 'YOLCU', subType: 'minibus', tags: ['yolcu_tasima', 'minibus'], queries: ['minibus rental', 'minibus transfer', 'minibus charter'] },
    { key: 'midibus', mainType: 'YOLCU', subType: 'midibus', tags: ['yolcu_tasima', 'midibus'], queries: ['midibus rental', 'mini coach charter', 'midibus transfer'] },
    { key: 'otobus', mainType: 'YOLCU', subType: 'otobus', tags: ['yolcu_tasima', 'otobus'], queries: ['bus charter', 'coach rental', 'bus transfer service'] },
    { key: 'vip_tasima', mainType: 'YOLCU', subType: 'vip_tasima', tags: ['yolcu_tasima', 'vip_tasima'], queries: ['vip transfer', 'chauffeur service', 'executive transport'] },
    { key: 'istasyon', mainType: 'SARJ', subType: 'istasyon', tags: ['sarj', 'ev_charging'], queries: ['ev charging station', 'electric vehicle charging', 'charging point'] },
    { key: 'seyyar_sarj', mainType: 'SARJ', subType: 'seyyar_sarj', tags: ['sarj', 'mobil_sarj'], queries: ['mobile ev charging', 'on demand ev charging', 'portable ev charger service'] },
  ];

  constructor(
    @InjectModel(Profile.name) private oldProfileModel: Model<Profile>,
    @InjectModel(NewUser.name) private newUserModel: Model<NewUserDocument>,
    @InjectModel(NewProvider.name) private newProviderModel: Model<NewProviderDocument>,
  ) {}

  async radicalMigration() {
    this.logger.log('🚨 RADİKAL MİGRASYON V4 (AGRESİF TEMİZLİK & TEKİLLEŞTİRME)...');

    // 1. MEVCUT TABLOLARI SİL
    await this.newUserModel.deleteMany({});
    await this.newProviderModel.deleteMany({});
    this.logger.log('🗑️ Tablolar sıfırlandı.');

    // 2. HAM VERİYİ ÇEK VE SIRALA (Rating'e göre en iyiler önce gelsin)
    // Böylece "Tek bir tane" seçeceğimiz zaman, en kalitesiz olanı değil en iyisini seçmiş oluruz.
    let rawProfiles = await this.oldProfileModel.find({ isActive: true }).lean();
    
    // (Varsa rating'e göre, yoksa oluşturulma tarihine göre tersten sırala)
    rawProfiles = rawProfiles.sort((a, b) => {
        const rateA = a['rating'] || 0;
        const rateB = b['rating'] || 0;
        return rateB - rateA; // Büyükten küçüğe
    });

    this.logger.log(`📦 Toplam Ham Veri: ${rawProfiles.length} (En iyiler başa alındı)`);

    const uniqueMap = new Map<string, any>();
    
    let stats = {
      eliminatedElectric: 0,
      eliminatedSeyyar: 0,
      kept: 0,
      duplicateSkipped: 0
    };

    // --- A. ANALİZ VE SEÇME DÖNGÜSÜ ---
    for (const profile of rawProfiles) {
      const originalName = profile.firstName || '';

      // 🔥 1. AGRESİF İSİM TEMİZLİĞİ 🔥
      // Parantez (), Köşeli [], Süslü {} ve içindeki her şeyi siler.
      // Örn: "Ahmet Çekici (7/24 Hizmet) [Merkez]" -> "Ahmet Çekici"
      let cleanName = originalName
        .replace(/[\(\[\{].*?[\)\]\}]/g, '') // Parantezleri ve içini sil
        .replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, ' ') // Harf ve rakam dışı sembolleri (.,- vs) boşluk yap
        .replace(/\s+/g, ' ') // Çift boşlukları teke indir
        .trim(); // Baştaki sondaki boşluğu at

      // Eğer isim temizlenince bomboş kaldıysa (örn: ismi sadece "(Çekici)" ise), orijinali kullan ama parantezsiz
      if (cleanName.length < 3) {
         cleanName = originalName.replace(/[\(\)]/g, '').trim(); 
      }

      // Kategori ve Yasaklı Kelime Kontrolü
      const oldType = profile.serviceType;

      if (oldType === 'seyyar_sarj') {
        stats.eliminatedSeyyar++;
        continue;
      }

      const forbiddenKeywords = ['elektrik', 'klima', 'akü', 'aku', 'kilit', 'anahtar', 'lastik'];
      const isKurtarici = ['kurtarici', 'oto_kurtarma', 'vinc'].includes(oldType);
      
      if (isKurtarici) {
        // İsim kontrolünü temizlenmiş isim üzerinden değil, ham isim üzerinden yap ki kaçmasın
        const lowerName = originalName.toLocaleLowerCase('tr-TR');
        if (forbiddenKeywords.some(k => lowerName.includes(k))) {
          stats.eliminatedElectric++;
          continue;
        }
      }

      // Adres Analizi
      const { district, city } = this.parseAddressRadical(profile.address, profile.city);
      if (!district || !city || city === 'Bilinmiyor') continue;

      const category = this.mapToNewCategory(oldType);

      // 🔥 2. MATEMATİKSEL KİLİT (HER İLÇEYE 1 TANE) 🔥
      // Anahtar: "İzmir-Bornova-KURTARICI"
      // Map yapısı bu anahtardan SADECE BİR tane tutabilir.
      const uniqueKey = `${city}-${district}-${category.main}`;
      
      if (!uniqueMap.has(uniqueKey)) {
        // Henüz bu ilçede kimseyi seçmedik, bu kişiyi (en yüksek puanlı olanı) seç!
        uniqueMap.set(uniqueKey, {
            original: profile,
            cleanName: cleanName, // Temizlenmiş ismi buraya koyuyoruz
            derived: { district, city, category }
        });
        stats.kept++;
      } else {
        // Bu ilçede zaten bir kralımız var, diğerlerini atla.
        stats.duplicateSkipped++;
      }
    }

    this.logger.log(`🧹 Temizlik Bitti. ${stats.kept} adet SEÇİLMİŞ kayıt DB'ye yazılıyor...`);
    this.logger.log(`🚫 Çöpe Atılanlar: ${stats.duplicateSkipped} (Aynı ilçe tekrarları), ${stats.eliminatedElectric} (Elektrikçi), ${stats.eliminatedSeyyar} (Eski şarjcı)`);

    // --- B. YENİ TABLOYA KAYIT DÖNGÜSÜ ---
    
    const passwordHash = await bcrypt.hash('Transporter2026!', 10);
    const processedPhones = new Map<string, Types.ObjectId>(); 
    let counter = 0;

    for (const [key, data] of uniqueMap) {
      counter++;
      const p = data.original;
      const d = data.derived;
      const finalName = data.cleanName; // Yukarıda temizlediğimiz isim

      if (counter % 100 === 0) this.logger.log(`⏳ Yazılıyor... ${counter}/${stats.kept}`);

      const rawPhone = p.phoneNumber ? String(p.phoneNumber).replace(/\D/g, '').slice(-10) : '';
      if (!rawPhone || rawPhone.length < 10) continue;

      let userId: Types.ObjectId;

      // User Oluşturma
      if (processedPhones.has(rawPhone)) {
         userId = processedPhones.get(rawPhone);
      } else {
         const emailToUse = (p['email'] && p['email'].includes('@')) 
            ? p['email'] 
            : `provider_${rawPhone}@transporter.app`;

         const newUser = new this.newUserModel({
            email: emailToUse,
            password: passwordHash,
            role: 'provider',
            isActive: true
         });

         try {
            const savedUser = await newUser.save();
            userId = savedUser._id as Types.ObjectId;
            processedPhones.set(rawPhone, userId);
         } catch (error) { continue; }
      }

      // Provider Oluşturma
      const newProvider = new this.newProviderModel({
        user: userId,
        businessName: finalName, // 🔥 TEMİZ İSİM BURADA KULLANILIYOR
        phoneNumber: p.phoneNumber,
        address: {
          fullText: p.address || `${d.district}, ${d.city}`,
          city: d.city,
          district: d.district
        },
        service: {
          mainType: d.category.main,
          subType: d.category.sub,
          tags: [d.category.sub, '7/24']
        },
        pricing: {
          openingFee: 350,
          pricePerUnit: 40
        },
        location: p.location,
        website: p.link || ''
      });

      await newProvider.save();
    }

    this.logger.log('✅ SEÇİLMİŞ KAYITLAR AKTARILDI.');

    // --- C. VIP KURUMLARI EKLE ---
    await this.injectPremiumChargers(); 

    return { success: true, stats };
  }

  async fixNakliyeToEvdenEve() {
    this.logger.log('🛠️ FIX: "nakliye" olan subtype değerleri "evden_eve" olarak güncelleniyor...');
    
    const result = await this.newProviderModel.updateMany(
      { 'service.subType': 'nakliye' }, // Filtre: subtype'ı nakliye olanlar
      { $set: { 'service.subType': 'evden_eve' } } // Güncelleme: evden_eve yap
    );

    this.logger.log(`✅ İşlem tamamlandı. Güncellenen kayıt sayısı: ${result.modifiedCount}`);
    return { success: true, updatedCount: result.modifiedCount };
  }

  async importLastikFromGoogle(options: ImportLastikOptions = {}) {
    const apiKey = (
      process.env.GOOGLE_PLACES_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      ''
    ).trim();

    const start = Math.max(0, Number(options.start || 0));
    const endRaw = Number.isFinite(Number(options.end)) ? Number(options.end) : TURKEY_DATA.length;
    const end = Math.min(TURKEY_DATA.length, Math.max(start + 1, endRaw));
    const perDistrictLimit = Math.max(1, Math.min(8, Number(options.perDistrictLimit || 2)));
    const dryRun = Boolean(options.dryRun);
    const seenPlaceIds = new Set<string>();

    const stats = {
      scannedDistricts: 0,
      scannedPlaces: 0,
      insertedOrUpdated: 0,
      skippedDuplicates: 0,
      failed: 0,
      districtsWithNoResults: 0,
      keyMissing: false,
      dryRun,
      start,
      end,
      perDistrictLimit,
    };

    if (!apiKey) {
      stats.keyMissing = true;
      if (dryRun) {
        return stats;
      }
      throw new Error('GOOGLE_MAPS_API_KEY (veya NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) tanımlı değil.');
    }

    const districts = TURKEY_DATA.slice(start, end);
    this.logger.log(`🛞 Lastik import başladı. İlçe aralığı: ${start}-${end} / ${TURKEY_DATA.length}`);

    for (const district of districts) {
      stats.scannedDistricts++;
      let places: any[] = [];
      try {
        places = await this.searchTirePlacesForDistrict(district.il, district.ilce, apiKey, perDistrictLimit);
      } catch (error) {
        stats.failed++;
        this.logger.warn(`⚠️ Places arama hatası (${district.il}/${district.ilce}): ${(error as any)?.message || error}`);
        continue;
      }
      if (places.length === 0) {
        stats.districtsWithNoResults++;
      }

      for (const place of places) {
        const placeId = String(place?.place_id || '').trim();
        if (!placeId) continue;
        if (seenPlaceIds.has(placeId)) {
          stats.skippedDuplicates++;
          continue;
        }
        seenPlaceIds.add(placeId);
        stats.scannedPlaces++;

        try {
          const details = await this.fetchGooglePlaceDetails(placeId, apiKey);
          const phone = this.normalizePhone(details?.formatted_phone_number || details?.international_phone_number || '');
          const website = String(details?.website || '');
          const businessName = String(place?.name || '').trim() || `Lastikçi ${district.ilce}`;
          const coords: [number, number] = [
            Number(place?.geometry?.location?.lng || 28.9784),
            Number(place?.geometry?.location?.lat || 41.0082),
          ];
          const fullAddress = String(place?.formatted_address || `${district.ilce}, ${district.il}`);

          if (dryRun) continue;

          await this.upsertSeedProvider({
            key: `google_lastik_${placeId}`,
            businessName,
            phoneNumber: phone,
            website,
            fullAddress,
            city: district.il,
            district: district.ilce,
            mainType: 'KURTARICI',
            subType: 'lastik',
            tags: ['lastik', '7/24', `google_place_id:${placeId}`],
            location: coords,
          });
          stats.insertedOrUpdated++;
        } catch (error) {
          stats.failed++;
          this.logger.warn(`⚠️ Lastik kaydı atlandı (${district.il}/${district.ilce}): ${(error as any)?.message || error}`);
        }
      }

      await this.sleep(170);
    }

    this.logger.log(`✅ Lastik import tamamlandı. Eklenen/Güncellenen: ${stats.insertedOrUpdated}`);
    return stats;
  }

  async importStaticYolcuFirms() {
    const firms: StaticPassengerFirm[] = [
      {
        name: 'Gürsel Turizm',
        categories: ['otobus', 'midibus', 'minibus', 'vip_tasima'],
        phone: '02165753355',
        email: 'info@gurseltur.com.tr',
        address: 'İçerenköy Mah. Çayır Cad. No:1 Ataşehir / İstanbul',
        city: 'İstanbul',
        district: 'Ataşehir',
      },
      {
        name: 'Altur Turizm',
        categories: ['otobus', 'midibus', 'minibus', 'vip_tasima'],
        phone: '02124115000',
        email: 'altur@alturturizm.com.tr',
        address: 'Yenibosna, Cemal Ulusoy Cad. No:1 Bahçelievler / İstanbul',
        city: 'İstanbul',
        district: 'Bahçelievler',
      },
      {
        name: 'Turex Turizm',
        categories: ['otobus', 'midibus', 'minibus', 'vip_tasima'],
        phone: '02126992055',
        email: 'info@turexturizm.com.tr',
        address: 'Zafer Mah. 140. Sok. No:35 Esenyurt / İstanbul',
        city: 'İstanbul',
        district: 'Esenyurt',
      },
      {
        name: 'Platform Turizm',
        categories: ['otobus', 'midibus', 'minibus', 'vip_tasima'],
        phone: '02125384445',
        email: 'iletisim@platformturizm.com',
        address: 'Yenidoğan Mah. Kızılay Sok. No:39 Bayrampaşa / İstanbul',
        city: 'İstanbul',
        district: 'Bayrampaşa',
      },
      {
        name: 'Buskirala',
        categories: ['otobus', 'midibus', 'minibus', 'vip_tasima'],
        phone: '4445072',
        email: 'info@buskirala.com',
        address: 'Dijital Ulusal Kiralama ve Garaj Ağı',
        city: 'İstanbul',
        district: 'Merkez',
      },
      {
        name: 'Progo Travel',
        categories: ['minibus', 'vip_tasima'],
        phone: '08503080444',
        email: 'support@progotravel.com',
        address: 'Şerifali Hendem Cad. No:38 Ümraniye / İstanbul',
        city: 'İstanbul',
        district: 'Ümraniye',
      },
    ];

    const stats = { firms: firms.length, insertedOrUpdated: 0, failed: 0 };

    for (const firm of firms) {
      for (const subType of firm.categories) {
        try {
          const coords = await this.geocodeAddressFallback(firm.address, firm.city, firm.district);
          await this.upsertSeedProvider({
            key: `yolcu_${this.slugify(firm.name)}_${subType}`,
            businessName: firm.name,
            phoneNumber: this.normalizePhone(firm.phone),
            website: '',
            fullAddress: firm.address,
            city: firm.city,
            district: firm.district,
            mainType: 'YOLCU',
            subType,
            tags: ['turkiye_geneli', 'yolcu_tasima', subType],
            location: coords,
          }, firm.email);
          stats.insertedOrUpdated++;
        } catch (error) {
          stats.failed++;
          this.logger.warn(`⚠️ Yolcu seed hatası (${firm.name}/${subType}): ${(error as any)?.message || error}`);
        }
      }
    }

    return stats;
  }

  async importAbroadFromGoogle(options: ImportAbroadOptions = {}) {
    const apiKey = (
      process.env.GOOGLE_PLACES_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      ''
    ).trim();
    const includeEurope = options.includeEurope !== false;
    const includeUs = options.includeUs !== false;
    const perServiceLimit = Math.max(1, Math.min(3, Number(options.perServiceLimit || 1)));
    const dryRun = Boolean(options.dryRun);

    const cityRows = [
      ...(includeEurope ? european_data : []),
      ...(includeUs ? us_data : []),
    ];

    const start = Math.max(0, Number(options.start || 0));
    const endRaw = Number.isFinite(Number(options.end)) ? Number(options.end) : cityRows.length;
    const end = Math.min(cityRows.length, Math.max(start + 1, endRaw));
    const selectedCities = cityRows.slice(start, end);
    const seenPlaceIds = new Set<string>();

    const stats = {
      scannedCities: 0,
      scannedServices: 0,
      scannedPlaces: 0,
      insertedOrUpdated: 0,
      skippedDuplicates: 0,
      failed: 0,
      citiesWithNoResults: 0,
      keyMissing: false,
      dryRun,
      start,
      end,
      perServiceLimit,
      includeEurope,
      includeUs,
    };

    if (!apiKey) {
      stats.keyMissing = true;
      if (dryRun) return stats;
      throw new Error('GOOGLE_PLACES_API_KEY (veya GOOGLE_MAPS_API_KEY) tanımlı değil.');
    }

    this.logger.log(`🌍 Abroad import başladı. Şehir aralığı: ${start}-${end} / ${cityRows.length}`);

    for (const row of selectedCities) {
      const city = String(row?.city || '').trim();
      if (!city) continue;
      stats.scannedCities++;
      let cityHit = 0;

      for (const serviceDef of this.abroadServiceDefs) {
        stats.scannedServices++;
        let places: any[] = [];
        try {
          places = await this.searchAbroadPlacesByService(city, serviceDef.queries, apiKey, perServiceLimit);
        } catch (error: any) {
          stats.failed++;
          this.logger.warn(`⚠️ Abroad arama hatası (${city}/${serviceDef.subType}): ${error?.message || error}`);
          continue;
        }
        if (!places.length) continue;

        for (const place of places) {
          const placeId = String(place?.place_id || '').trim();
          if (!placeId) continue;
          if (seenPlaceIds.has(placeId)) {
            stats.skippedDuplicates++;
            continue;
          }
          seenPlaceIds.add(placeId);
          stats.scannedPlaces++;

          try {
            const details = await this.fetchGooglePlaceDetails(placeId, apiKey);
            const phone = this.normalizePhone(details?.formatted_phone_number || details?.international_phone_number || '');
            const website = String(details?.website || '');
            const businessName = String(place?.name || '').trim() || `${city} ${serviceDef.subType}`;
            const coords: [number, number] = [
              Number(place?.geometry?.location?.lng || 28.9784),
              Number(place?.geometry?.location?.lat || 41.0082),
            ];
            const fullAddress = String(place?.formatted_address || city);

            if (dryRun) {
              cityHit++;
              continue;
            }

            await this.upsertSeedProvider({
              key: `abroad_${this.slugify(city)}_${serviceDef.key}_${placeId}`,
              businessName,
              phoneNumber: phone,
              website,
              fullAddress,
              city,
              district: 'Merkez',
              mainType: serviceDef.mainType,
              subType: serviceDef.subType,
              tags: [...serviceDef.tags, `abroad_city:${this.slugify(city)}`, `google_place_id:${placeId}`],
              location: coords,
            });
            stats.insertedOrUpdated++;
            cityHit++;
          } catch (error: any) {
            stats.failed++;
            this.logger.warn(`⚠️ Abroad kayıt atlandı (${city}/${serviceDef.subType}): ${error?.message || error}`);
          }
        }
        await this.sleep(120);
      }

      if (cityHit === 0) {
        stats.citiesWithNoResults++;
      }
    }

    this.logger.log(`✅ Abroad import tamamlandı. Eklenen/Güncellenen: ${stats.insertedOrUpdated}`);
    return stats;
  }
  
  // --- VIP EKLEME ---
  async injectPremiumChargers() {
    this.logger.log('🔋 VIP MOBİL ŞARJLAR (Skoda, EVbee, OtoPriz) EKLENİYOR...');

    const vipChargers = [
      { firstName: "Skoda E-Mobilite", phone: "4447780", city: "Tüm Türkiye", address: "Tüm Türkiye Geneli Mobil Hizmet", lat: 39.9334, lng: 32.8597, link: "https://www.skoda.com.tr/e-mobilite", tags: ["mobil_sarj", "kurumsal", "7/24"] },
      { firstName: "EVbee", phone: "08509333382", city: "Tüm Türkiye", address: "Tüm Türkiye Geneli Yerinde Şarj", lat: 39.9334, lng: 32.8597, link: "https://www.ev-bee.com/", tags: ["mobil_sarj", "hizli_sarj", "yerinde_sarj"] },
      { firstName: "OtoPriz", phone: "08502424247", city: "Tüm Türkiye", address: "Mobil Hızlı Şarj İstasyonu Ağı", lat: 39.9334, lng: 32.8597, link: "https://otopriz.com.tr/mobil-hizli-sarj-istasyonu", tags: ["mobil_hizli_sarj", "yerinde_sarj", "acil_sarj"] }
    ];

    for (const vip of vipChargers) {
      const cleanName = vip.firstName.replace(/\s/g, '').toLowerCase();
      const email = `vip_${cleanName}@transporter.app`;
      await this.newUserModel.deleteOne({ email });
      
      const user = await new this.newUserModel({
        email: email,
        password: await bcrypt.hash('VipMobile2026!', 10),
        role: 'provider',
        isActive: true
      }).save();

      await new this.newProviderModel({
        user: user._id,
        businessName: vip.firstName,
        phoneNumber: vip.phone,
        website: vip.link,
        address: { fullText: vip.address, city: vip.city, district: 'Genel' },
        service: { mainType: 'SARJ', subType: 'MOBIL_UNIT', tags: vip.tags },
        pricing: { openingFee: 0, pricePerUnit: 0 },
        location: { type: 'Point', coordinates: [vip.lng, vip.lat] }
      }).save();
    }
    this.logger.log(`✅ ${vipChargers.length} VIP EKLENDİ.`);
  }

  // --- YARDIMCI METODLAR ---
  private parseAddressRadical(address: string, fallbackCity: string): { district: string, city: string } {
    try {
      if (!address) return { district: 'Merkez', city: fallbackCity || 'Bilinmiyor' };
      const parts = address.split(','); 
      const lastPart = parts[parts.length - 1].trim(); 
      if (lastPart.includes('/')) {
        const [d, c] = lastPart.split('/');
        return { district: d.trim(), city: c.trim() };
      } 
      return { district: 'Merkez', city: fallbackCity || 'Bilinmiyor' };
    } catch (e) {
      return { district: 'Merkez', city: fallbackCity || 'Bilinmiyor' };
    }
  }

  private mapToNewCategory(oldType: string): { main: string, sub: string } {
    const t = (oldType || '').toLowerCase();
    if (['kurtarici', 'oto_kurtarma', 'vinc', 'yol_yardim', 'lastik'].includes(t)) return { main: 'KURTARICI', sub: t };
    if (['nakliye', 'kamyon', 'kamyonet', 'tir', 'evden_eve', 'yurt_disi_nakliye'].includes(t)) return { main: 'NAKLIYE', sub: t };
    if (['sarj_istasyonu'].includes(t)) return { main: 'SARJ', sub: 'istasyon' };
    return { main: 'KURTARICI', sub: 'genel' };
  }

  private normalizePhone(value: string): string {
    return String(value || '').replace(/\D/g, '');
  }

  private slugify(value: string): string {
    return String(value || '')
      .toLocaleLowerCase('tr')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 60);
  }

  private async ensureProviderUser(emailSeed: string): Promise<Types.ObjectId> {
    const email = emailSeed.includes('@') ? emailSeed : `${emailSeed}@transporter.app`;
    const existing = await this.newUserModel.findOne({ email }).exec();
    if (existing?._id) return existing._id as Types.ObjectId;

    const created = await new this.newUserModel({
      email,
      password: await bcrypt.hash('Transporter2026!', 10),
      role: 'provider',
      isActive: true,
    }).save();
    return created._id as Types.ObjectId;
  }

  private async upsertSeedProvider(
    payload: {
      key: string;
      businessName: string;
      phoneNumber: string;
      website: string;
      fullAddress: string;
      city: string;
      district: string;
      mainType: 'KURTARICI' | 'NAKLIYE' | 'SARJ' | 'YOLCU' | 'YURT_DISI';
      subType: string;
      tags: string[];
      location: [number, number];
    },
    forcedEmail?: string
  ) {
    const email = forcedEmail || `${payload.key}@transporter.app`;
    const userId = await this.ensureProviderUser(email);

    return this.newProviderModel.findOneAndUpdate(
      { user: userId, 'service.subType': payload.subType },
      {
        $set: {
          user: userId,
          businessName: payload.businessName,
          phoneNumber: payload.phoneNumber,
          website: payload.website,
          link: payload.website,
          address: {
            fullText: payload.fullAddress,
            city: payload.city,
            district: payload.district,
          },
          service: {
            mainType: payload.mainType,
            subType: payload.subType,
            tags: Array.from(new Set([...(payload.tags || []), 'source:import'])),
          },
          pricing: {
            openingFee: payload.mainType === 'YOLCU' ? 0 : 150,
            pricePerUnit: payload.mainType === 'YOLCU' ? 0 : 30,
          },
          location: {
            type: 'Point',
            coordinates: payload.location,
          },
          isVerified: true,
        },
      },
      { upsert: true, new: true }
    ).exec();
  }

  private async fetchGooglePlaceDetails(placeId: string, apiKey: string): Promise<any | null> {
    const newApi = await this.fetchGooglePlaceDetailsNew(placeId, apiKey);
    if (newApi) return newApi;

    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
        params: {
          place_id: placeId,
          language: 'tr',
          fields: 'formatted_phone_number,international_phone_number,website,url',
          key: apiKey,
        },
        timeout: 15000,
      });
      return response?.data?.result || null;
    } catch {
      return null;
    }
  }

  private async fetchGooglePlaceDetailsNew(placeId: string, apiKey: string): Promise<any | null> {
    try {
      const response = await axios.get(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,internationalPhoneNumber,nationalPhoneNumber,websiteUri,googleMapsUri',
        },
        timeout: 15000,
      });
      const p = response?.data || {};
      return {
        formatted_phone_number: p?.nationalPhoneNumber || '',
        international_phone_number: p?.internationalPhoneNumber || '',
        website: p?.websiteUri || '',
        url: p?.googleMapsUri || '',
      };
    } catch {
      return null;
    }
  }

  private async searchTirePlacesForDistrict(
    city: string,
    district: string,
    apiKey: string,
    perDistrictLimit: number
  ): Promise<any[]> {
    const queries = [
      `${district}, ${city} lastikçi`,
      `${district}, ${city} lastikci`,
      `${district}, ${city} oto lastik`,
      `${district}, ${city} oto lastikçi`,
    ];

    // Prefer Places API (New) first.
    for (const query of queries) {
      try {
        const response = await axios.post(
          'https://places.googleapis.com/v1/places:searchText',
          {
            textQuery: query,
            languageCode: 'tr',
            regionCode: 'TR',
            maxResultCount: perDistrictLimit,
          },
          {
            headers: {
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location',
            },
            timeout: 15000,
          }
        );

        const places = Array.isArray(response?.data?.places) ? response.data.places : [];
        if (!places.length) continue;

        const mapped = places
          .map((p: any) => ({
            place_id: p?.id || '',
            name: String(p?.displayName?.text || '').trim(),
            formatted_address: String(p?.formattedAddress || '').trim(),
            geometry: {
              location: {
                lat: Number(p?.location?.latitude),
                lng: Number(p?.location?.longitude),
              },
            },
          }))
          .filter((p: any) => p.place_id && Number.isFinite(p.geometry?.location?.lat) && Number.isFinite(p.geometry?.location?.lng));

        if (mapped.length > 0) return mapped.slice(0, perDistrictLimit);
      } catch (error: any) {
        this.logger.warn(`⚠️ Lastik Places(New) denemesi başarısız (${city}/${district}): ${(error as any)?.message || error}`);
      }
    }

    // Fallback to legacy endpoint if project still supports it.
    for (const query of queries) {
      try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
          params: {
            query,
            language: 'tr',
            region: 'tr',
            key: apiKey,
          },
          timeout: 15000,
        });
        const status = String(response?.data?.status || '');
        if (status === 'REQUEST_DENIED' || status === 'OVER_QUERY_LIMIT' || status === 'INVALID_REQUEST') {
          throw new Error(`Places TextSearch status=${status} query="${query}" error="${response?.data?.error_message || ''}"`);
        }
        const results = Array.isArray(response?.data?.results) ? response.data.results : [];
        if (results.length > 0) {
          return results.slice(0, perDistrictLimit);
        }
      } catch (error: any) {
        this.logger.warn(`⚠️ Lastik TextSearch denemesi başarısız (${city}/${district}): ${(error as any)?.message || error}`);
        // Try next query variant
      }
    }

    // Fallback: ilce merkezini geocode edip nearby ile lastikcileri ara.
    try {
      const geoResp = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address: `${district}, ${city}, Türkiye`,
          language: 'tr',
          region: 'tr',
          key: apiKey,
        },
        timeout: 15000,
      });
      const geoStatus = String(geoResp?.data?.status || '');
      if (geoStatus !== 'OK') return [];
      const loc = geoResp?.data?.results?.[0]?.geometry?.location;
      const lat = Number(loc?.lat);
      const lng = Number(loc?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];

      const nearbyResp = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
        params: {
          location: `${lat},${lng}`,
          radius: 20000,
          keyword: 'lastikçi',
          language: 'tr',
          key: apiKey,
        },
        timeout: 15000,
      });
      const nearbyStatus = String(nearbyResp?.data?.status || '');
      if (nearbyStatus !== 'OK') return [];

      const nearbyResults = Array.isArray(nearbyResp?.data?.results) ? nearbyResp.data.results : [];
      if (!nearbyResults.length) return [];

      return nearbyResults.slice(0, perDistrictLimit);
    } catch (error: any) {
      this.logger.warn(`⚠️ Lastik Nearby fallback başarısız (${city}/${district}): ${(error as any)?.message || error}`);
      return [];
    }
    return [];
  }

  private async searchAbroadPlacesByService(
    city: string,
    serviceQueries: string[],
    apiKey: string,
    perServiceLimit: number
  ): Promise<any[]> {
    for (const serviceQuery of serviceQueries) {
      const query = `${serviceQuery} in ${city}`;
      try {
        const response = await axios.post(
          'https://places.googleapis.com/v1/places:searchText',
          {
            textQuery: query,
            languageCode: 'en',
            maxResultCount: perServiceLimit,
          },
          {
            headers: {
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location',
            },
            timeout: 15000,
          }
        );

        const places = Array.isArray(response?.data?.places) ? response.data.places : [];
        if (!places.length) continue;

        const mapped = places
          .map((p: any) => ({
            place_id: p?.id || '',
            name: String(p?.displayName?.text || '').trim(),
            formatted_address: String(p?.formattedAddress || '').trim(),
            geometry: {
              location: {
                lat: Number(p?.location?.latitude),
                lng: Number(p?.location?.longitude),
              },
            },
          }))
          .filter((p: any) => p.place_id && Number.isFinite(p.geometry?.location?.lat) && Number.isFinite(p.geometry?.location?.lng));

        if (mapped.length > 0) return mapped.slice(0, perServiceLimit);
      } catch (error: any) {
        this.logger.warn(`⚠️ Abroad Places(New) denemesi başarısız (${city} / ${serviceQuery}): ${error?.message || error}`);
      }
    }
    return [];
  }

  private async geocodeAddressFallback(address: string, city: string, district: string): Promise<[number, number]> {
    const apiKey = (
      process.env.GOOGLE_PLACES_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      ''
    ).trim();
    if (!apiKey) return [28.9784, 41.0082];
    const query = `${address}, ${district}, ${city}, Türkiye`;
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: { address: query, language: 'tr', region: 'tr', key: apiKey },
        timeout: 15000,
      });
      const loc = response?.data?.results?.[0]?.geometry?.location;
      if (loc && Number.isFinite(loc.lng) && Number.isFinite(loc.lat)) {
        return [Number(loc.lng), Number(loc.lat)];
      }
      return [28.9784, 41.0082];
    } catch {
      return [28.9784, 41.0082];
    }
  }

  private async sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
