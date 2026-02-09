import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose'; // Types buraya eklendi
import * as bcrypt from 'bcrypt';

import { NewUser, NewUserDocument } from './schemas/new-user.schema';
import { NewProvider, NewProviderDocument } from './schemas/new-provider.schema';
import { Profile } from '../users/schemas/profile.schema'; // Yol farklıysa düzelt

@Injectable()
export class DataService {
  private readonly logger = new Logger(DataService.name);

  constructor(
    @InjectModel(Profile.name) private oldProfileModel: Model<Profile>,
    @InjectModel(NewUser.name) private newUserModel: Model<NewUserDocument>,
    @InjectModel(NewProvider.name) private newProviderModel: Model<NewProviderDocument>,
  ) {}

  /**
   * RADİKAL MİGRASYON VE TEMİZLİK ROBOTU
   */
  async radicalMigration() {
    this.logger.log('🚨 RADİKAL MİGRASYON BAŞLATILIYOR...');

    // 1. Yeni tabloları sıfırla
    await this.newUserModel.deleteMany({});
    await this.newProviderModel.deleteMany({});

    // 2. Eski veriyi çek
    const rawProfiles = await this.oldProfileModel.find({ isActive: true }).lean();
    this.logger.log(`📦 Toplam Ham Veri: ${rawProfiles.length}`);

    const uniqueMap = new Map<string, any>();
    
    let stats = {
      eliminatedElectric: 0,
      eliminatedSeyyar: 0,
      kept: 0,
      duplicateSkipped: 0
    };

    for (const profile of rawProfiles) {
      const name = profile.firstName || '';
      const oldType = profile.serviceType;

      // Kural 1: Seyyar Şarjları sil
      if (oldType === 'seyyar_sarj') {
        stats.eliminatedSeyyar++;
        continue;
      }

      // Kural 2: Elektrik/Klima sil
      const forbiddenKeywords = ['elektrik', 'klima', 'akü', 'aku', 'kilit', 'anahtar'];
      const isKurtarici = ['kurtarici', 'oto_kurtarma', 'vinc'].includes(oldType);
      
      if (isKurtarici) {
        const lowerName = name.toLocaleLowerCase('tr-TR');
        if (forbiddenKeywords.some(k => lowerName.includes(k))) {
          stats.eliminatedElectric++;
          continue;
        }
      }

      const { district, city } = this.parseAddressRadical(profile.address, profile.city);
      if (!district || !city) continue;

      const category = this.mapToNewCategory(oldType);

      // Her ilçeden her kategoride sadece 1 tane
      const uniqueKey = `${city}-${district}-${category.main}`;
      
      if (!uniqueMap.has(uniqueKey)) {
        uniqueMap.set(uniqueKey, {
            original: profile,
            derived: { district, city, category }
        });
        stats.kept++;
      } else {
        stats.duplicateSkipped++;
      }
    }

    this.logger.log(`🧹 Filtreleme Bitti. DB Yazma İşlemi Başlıyor... (${stats.kept} Kayıt)`);

    // --- D. YENİ TABLOYA KAYIT ---
    
    const passwordHash = await bcrypt.hash('Transporter2026!', 10);
    
    // 🔥 CACHE MEKANİZMASI: Aynı telefon numarasını hafızada tutuyoruz
    const processedPhones = new Map<string, Types.ObjectId>(); 

    for (const [key, data] of uniqueMap) {
      const p = data.original;
      const d = data.derived;

      // Telefonu temizle (Sadece rakamlar, son 10 hane)
      const rawPhone = p.phoneNumber ? String(p.phoneNumber).replace(/\D/g, '').slice(-10) : '';
      if (!rawPhone || rawPhone.length < 10) continue; // Bozuk telefonları atla

      let userId: Types.ObjectId;

      // 1. Kullanıcı Zaten Var mı? (Cache Kontrolü)
      if (processedPhones.has(rawPhone)) {
         // Evet var, o zaman mevcut ID'yi kullan
         userId = processedPhones.get(rawPhone);
      } else {
         // Hayır yok, yeni kullanıcı yarat
         const email = `provider_${rawPhone}@transporter.app`;
         
         const newUser = new this.newUserModel({
            email: email,
            password: passwordHash,
            role: 'provider',
            isActive: true
         });

         try {
            const savedUser = await newUser.save();
            userId = savedUser._id as Types.ObjectId; // Tür dönüşümü
            // Cache'e ekle
            processedPhones.set(rawPhone, userId);
         } catch (error) {
            this.logger.warn(`Kullanıcı oluşturma hatası (Atlanıyor): ${email}`);
            continue; 
         }
      }

      // 2. NewProvider Oluştur
      const newProvider = new this.newProviderModel({
        user: userId,
        businessName: p.firstName.trim(),
        phoneNumber: p.phoneNumber,
        address: {
          fullText: p.address,
          city: d.city,
          district: d.district
        },
        service: {
          mainType: d.category.main,
          subType: d.category.sub,
          tags: [d.category.sub, '7/24', 'profesyonel']
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

    this.logger.log('✅ ESKİ VERİLER TEMİZLENİP AKTARILDI.');

    // --- VIP EKLEME ---
    await this.injectPremiumChargers(); 
    // ------------------

    return { success: true, stats };
  }

  /**
   * 3 ADET VIP ŞARJ FİRMASINI EKLEYEN FONKSİYON
   */
  async injectPremiumChargers() {
    this.logger.log('🔋 VIP MOBİL ŞARJ KURUMLARI EKLENİYOR...');

    const vipChargers = [
      {
        name: "E-Şarj Mobil Destek",
        phone: "08502221100",
        city: "İstanbul",
        district: "Ataşehir",
        address: "Barbaros Mah. Lale Sk. No:1, Ataşehir/İstanbul",
        lat: 40.992,
        lng: 29.115,
        website: "https://esarj.com",
        price: 500
      },
      {
        name: "ZES Acil Şarj",
        phone: "08503332200",
        city: "Ankara",
        district: "Çankaya",
        address: "Balgat Mah. Ziyabey Cad. No:5, Çankaya/Ankara",
        lat: 39.908,
        lng: 32.815,
        website: "https://zes.net",
        price: 450
      },
      {
        name: "Voltrun Yol Yardım",
        phone: "08504443300",
        city: "İzmir",
        district: "Bornova",
        address: "Kazımdirik Mah. Üniversite Cad. No:10, Bornova/İzmir",
        lat: 38.462,
        lng: 27.215,
        website: "https://voltrun.com",
        price: 400
      }
    ];

    for (const vip of vipChargers) {
      // 1. Kullanıcı Hesabı Oluştur
      const email = `vip_${vip.name.replace(/\s/g, '').toLowerCase()}@transporter.app`;
      
      // Çakışmayı önlemek için önce sil
      await this.newUserModel.deleteOne({ email });
      
      const passwordHash = await bcrypt.hash('Vip12345!', 10);
      
      const user = await new this.newUserModel({
        email: email,
        password: passwordHash,
        role: 'provider',
        isActive: true
      }).save();

      // 2. Provider Detaylarını Ekle
      await new this.newProviderModel({
        user: user._id,
        businessName: vip.name,
        phoneNumber: vip.phone,
        website: vip.website,
        address: {
          fullText: vip.address,
          city: vip.city,
          district: vip.district
        },
        service: {
          mainType: 'SARJ',     // Ana Kategori
          subType: 'MOBIL_UNIT', // Alt Kategori
          tags: ['HIZLI_SARJ', '7/24', 'KURUMSAL', 'ACIL_DESTEK']
        },
        pricing: {
          openingFee: vip.price,
          pricePerUnit: 50
        },
        location: {
          type: 'Point',
          coordinates: [vip.lng, vip.lat] // [Lng, Lat]
        }
      }).save();
    }

    this.logger.log(`✅ ${vipChargers.length} ADET VIP MOBİL ŞARJ EKLENDİ.`);
  }

  // --- YARDIMCI METODLAR ---

  private parseAddressRadical(address: string, fallbackCity: string): { district: string, city: string } {
    try {
      if (!address) return { district: 'Merkez', city: fallbackCity };

      const parts = address.split(','); 
      const lastPart = parts[parts.length - 1].trim(); 

      if (lastPart.includes('/')) {
        const [d, c] = lastPart.split('/');
        return { district: d.trim(), city: c.trim() };
      } 
      
      return { district: 'Merkez', city: fallbackCity || 'Bilinmiyor' };

    } catch (e) {
      return { district: 'Merkez', city: fallbackCity };
    }
  }

  private mapToNewCategory(oldType: string): { main: string, sub: string } {
    const kurtariciGrubu = ['kurtarici', 'oto_kurtarma', 'vinc', 'yol_yardim'];
    const nakliyeGrubu = ['nakliye', 'kamyon', 'kamyonet', 'tir', 'evden_eve', 'yurt_disi_nakliye'];
    const sarjGrubu = ['sarj_istasyonu']; 

    if (kurtariciGrubu.includes(oldType)) return { main: 'KURTARICI', sub: oldType };
    if (nakliyeGrubu.includes(oldType)) return { main: 'NAKLIYE', sub: oldType };
    if (sarjGrubu.includes(oldType)) return { main: 'SARJ', sub: 'istasyon' };

    return { main: 'KURTARICI', sub: 'genel' };
  }
}