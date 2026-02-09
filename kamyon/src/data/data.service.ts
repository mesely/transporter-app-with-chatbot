import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { NewUser, NewUserDocument } from './schemas/new-user.schema'; // Yeni Tablo
import { NewProvider, NewProviderDocument } from './schemas/new-provider.schema'; // Yeni Tablo
import { Profile } from './schemas/profile.schema';

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
   * 1. Eski tablodan veriyi çeker.
   * 2. "Elektrik/Klima"cıları ve "Seyyar Şarj"ları eler.
   * 3. Adres parse edip İl/İlçe çıkarır.
   * 4. Her İlçe + Hizmet Tipi için SADECE 1 kayıt tutar.
   * 5. Yeni 'new_users' ve 'new_providers' tablolarına yazar.
   */
  async radicalMigration() {
    this.logger.log('🚨 RADİKAL MİGRASYON BAŞLATILIYOR...');

    // 1. Yeni tabloları sıfırla (Temiz sayfa)
    await this.newUserModel.deleteMany({});
    await this.newProviderModel.deleteMany({});

    // 2. Eski veriyi çek
    const rawProfiles = await this.oldProfileModel.find({ isActive: true }).lean();
    this.logger.log(`📦 Toplam Ham Veri: ${rawProfiles.length}`);

    // Tekilleştirme Haritası (Key: "İzmir-Karabağlar-KURTARICI")
    const uniqueMap = new Map<string, any>();
    
    // Sayaçlar
    let stats = {
      eliminatedElectric: 0,
      eliminatedSeyyar: 0,
      kept: 0,
      duplicateSkipped: 0
    };

    for (const profile of rawProfiles) {
      const name = profile.firstName || '';
      const oldType = profile.serviceType;

      // --- A. FİLTRELEME KURALLARI ---

      // Kural 1: Seyyar Şarjları tamamen sil
      if (oldType === 'seyyar_sarj') {
        stats.eliminatedSeyyar++;
        continue;
      }

      // Kural 2: Oto Kurtarma içinde "Elektrik", "Klima", "Akü" geçenleri sil
      const forbiddenKeywords = ['elektrik', 'klima', 'akü', 'aku', 'kilit', 'anahtar'];
      const isKurtarici = ['kurtarici', 'oto_kurtarma', 'vinc'].includes(oldType);
      
      if (isKurtarici) {
        const lowerName = name.toLocaleLowerCase('tr-TR');
        if (forbiddenKeywords.some(k => lowerName.includes(k))) {
          stats.eliminatedElectric++;
          continue;
        }
      }

      // --- B. ADRES VE KATEGORİ ANALİZİ ---

      // Adres Parse: "...., Karabağlar/İzmir" formatını çöz
      const { district, city } = this.parseAddressRadical(profile.address, profile.city);
      
      if (!district || !city) continue; // Adres çözülemezse atla

      // Kategori Dönüşümü
      const category = this.mapToNewCategory(oldType);

      // --- C. TEKİLLEŞTİRME (DEDUPLICATION) ---
      // Her ilçeden her kategoride sadece 1 tane olsun.
      const uniqueKey = `${city}-${district}-${category.main}`;
      
      // Eğer bu ilçede bu hizmeti veren biri henüz listeye eklenmediyse ekle
      // (Mevcut verideki ilk rast geleni alır, ratingi yüksek olanı seçmek istersen mantığı değiştirebiliriz)
      if (!uniqueMap.has(uniqueKey)) {
        uniqueMap.set(uniqueKey, {
            original: profile,
            derived: {
                district,
                city,
                category
            }
        });
        stats.kept++;
      } else {
        stats.duplicateSkipped++;
      }
    }

    this.logger.log(`🧹 Temizlik Sonucu: 
      - Elektrikçi/Klimacı Silindi: ${stats.eliminatedElectric}
      - Seyyar Şarj Silindi: ${stats.eliminatedSeyyar}
      - Çakışan (Aynı İlçe) Atlandı: ${stats.duplicateSkipped}
      - ✅ EKLENECEK TEMİZ KAYIT: ${stats.kept}
    `);

    // --- D. YENİ TABLOYA KAYIT ---
    
    const operations = [];
    const passwordHash = await bcrypt.hash('Transporter2026!', 10); // Default şifre

    for (const [key, data] of uniqueMap) {
      const p = data.original;
      const d = data.derived;

      // 1. NewUser Oluştur
      const email = `provider_${p.phoneNumber.slice(-10)}@transporter.app`;
      
      const newUser = new this.newUserModel({
        email: email,
        password: passwordHash,
        role: 'provider',
        isActive: true
      });
      const savedUser = await newUser.save();

      // 2. NewProvider Oluştur
      const newProvider = new this.newProviderModel({
        user: savedUser._id,
        businessName: p.firstName.trim(),
        phoneNumber: p.phoneNumber,
        address: {
          fullText: p.address,
          city: d.city,
          district: d.district
        },
        service: {
          mainType: d.category.main,
          subType: d.category.sub, // Eski tip artık alt tip oldu (örn: vinc)
          tags: [d.category.sub, '7/24', 'profesyonel'] // Default taglar
        },
        pricing: {
          openingFee: 350, // Default
          pricePerUnit: 40 // Default
        },
        location: p.location,
        website: p.link || ''
      });

      operations.push(newProvider.save());
    }

    await Promise.all(operations);
    this.logger.log('✅ YENİ VERİTABANI OLUŞTURULDU.');
    
    return { success: true, stats };
  }

  // --- YARDIMCI METODLAR ---

  private parseAddressRadical(address: string, fallbackCity: string): { district: string, city: string } {
    try {
      if (!address) return { district: 'Merkez', city: fallbackCity };

      // Örnek: "Peker, 5162. Sk. No:6, Karabağlar/İzmir"
      // Virgüllerle böl
      const parts = address.split(','); 
      // Son parçayı al: " Karabağlar/İzmir"
      const lastPart = parts[parts.length - 1].trim(); 

      if (lastPart.includes('/')) {
        const [d, c] = lastPart.split('/');
        return { district: d.trim(), city: c.trim() };
      } 
      
      // "/" yoksa ama şehir verisi varsa manuel mapping gerekebilir, 
      // ama senin verin düzenli görünüyor.
      return { district: 'Merkez', city: fallbackCity || 'Bilinmiyor' };

    } catch (e) {
      return { district: 'Merkez', city: fallbackCity };
    }
  }

  private mapToNewCategory(oldType: string): { main: string, sub: string } {
    const kurtariciGrubu = ['kurtarici', 'oto_kurtarma', 'vinc', 'yol_yardim'];
    const nakliyeGrubu = ['nakliye', 'kamyon', 'kamyonet', 'tir', 'evden_eve', 'yurt_disi_nakliye'];
    const sarjGrubu = ['sarj_istasyonu']; // Seyyar silindi

    if (kurtariciGrubu.includes(oldType)) return { main: 'KURTARICI', sub: oldType };
    if (nakliyeGrubu.includes(oldType)) return { main: 'NAKLIYE', sub: oldType };
    if (sarjGrubu.includes(oldType)) return { main: 'SARJ', sub: 'istasyon' };

    return { main: 'KURTARICI', sub: 'genel' }; // Default
  }
}