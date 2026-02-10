import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose'; 
import * as bcrypt from 'bcrypt';

import { NewUser, NewUserDocument } from './schemas/new-user.schema';
import { NewProvider, NewProviderDocument } from './schemas/new-provider.schema';
import { Profile } from '../users/schemas/profile.schema';

@Injectable()
export class DataService {
  private readonly logger = new Logger(DataService.name);

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
    if (['kurtarici', 'oto_kurtarma', 'vinc', 'yol_yardim'].includes(t)) return { main: 'KURTARICI', sub: t };
    if (['nakliye', 'kamyon', 'kamyonet', 'tir', 'evden_eve', 'yurt_disi_nakliye'].includes(t)) return { main: 'NAKLIYE', sub: t };
    if (['sarj_istasyonu'].includes(t)) return { main: 'SARJ', sub: 'istasyon' };
    return { main: 'KURTARICI', sub: 'genel' };
  }
}