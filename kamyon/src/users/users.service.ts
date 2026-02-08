import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { Profile } from './schemas/profile.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Profile.name) private profileModel: Model<Profile>,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 Sistem Hazır: 10x Performans Motoru ve İndeksler Aktif.');
  }

  // --- 1. VERİ OLUŞTURMA (AKILLI TEKİLLEŞTİRME) ---
  async create(data: any) {
    try {
      // 1. İSİM TEMİZLEME: "(Kamyon)", "(Vinç)" gibi tagleri temizle
      let cleanFirstName = data.firstName;
      if (cleanFirstName) {
         cleanFirstName = cleanFirstName.replace(/\s*\(.*?\)\s*/g, '').trim(); 
      }

      // 2. DUPLICATE KONTROLÜ (Telefon Numarası - Son 10 Hane)
      let existingProfile = null;
      
      if (data.phoneNumber) {
        // Tüm boşlukları ve karakterleri sil, sadece rakam kalsın
        const rawPhone = data.phoneNumber.replace(/\D/g, '');
        if (rawPhone.length >= 10) {
          // Son 10 haneye göre ara (532... veya 0532... fark etmez)
          const last10 = rawPhone.slice(-10);
          existingProfile = await this.profileModel.findOne({ 
            phoneNumber: { $regex: last10 } 
          }).lean();
        }
      }

      // Telefon yoksa veya bulunamadıysa: İsim + Şehir + Tip kombinasyonuna bak
      if (!existingProfile) {
        existingProfile = await this.profileModel.findOne({ 
          firstName: cleanFirstName, 
          city: data.city,
          serviceType: data.serviceType 
        }).lean();
      }

      // Kullanıcı ID Belirleme (Var olanı kullan veya yeni oluştur)
      let userId = existingProfile ? existingProfile.user : null;

      if (!userId) {
        // Profil yoksa User tablosuna bak (Email ile)
        let user = await this.userModel.findOne({ email: data.email }).lean();
        
        if (!user) {
          const hashedPassword = await bcrypt.hash(data.password || '123', 10);
          const newUser = new this.userModel({
            email: data.email,
            password: hashedPassword,
            role: data.role || 'provider',
            isActive: true,
            rating: data.rating || 0
          });
          user = await newUser.save();
        }
        userId = user['_id'];
      }

      // --- PROFİL VERİSİNİ GÜNCELLE / OLUŞTUR ---
      const geoLocation = data.location?.coordinates 
        ? data.location 
        : (data.lat && data.lng) 
          ? { type: 'Point', coordinates: [parseFloat(data.lng), parseFloat(data.lat)] }
          : null;

      const profileData = {
        user: userId,
        firstName: cleanFirstName, // Temiz isim
        lastName: data.lastName,
        phoneNumber: data.phoneNumber, // Formatlanmış numara
        address: data.address,
        serviceType: data.serviceType, // DataService'den gelen (Yurt dışı vb.)
        city: data.city,
        routes: data.routes,
        rating: data.rating || 0,
        isActive: true,
        location: geoLocation,
        reservationUrl: data.reservationUrl || '',
        vehicleType: data.vehicleType || '',
        extraWarnings: data.extraWarnings || '',
        openingFee: data.openingFee || 250,
        pricePerUnit: data.pricePerUnit || 30,
        minAmount: data.minAmount || 0
      };

      // Upsert: Varsa güncelle, yoksa yeni yarat
      return this.profileModel.findOneAndUpdate(
        { user: userId },
        profileData,
        { upsert: true, new: true, lean: true }
      );

    } catch (error) {
      // Hata olsa bile akışı bozma, logla geç
      this.logger.error(`Kayıt Hatası (${data.firstName}): ${error.message}`);
      return null;
    }
  }

  // --- 2. HIZLI YAKINDAKİLER SORGUSU ---
  async findNearby(lat: number, lng: number, type?: string) {
    const query: any = { isActive: true };

    if (type) {
      if (type === 'sarj') {
        query.serviceType = { $in: ['sarj_istasyonu', 'seyyar_sarj'] };
      } 
      else if (type === 'kurtarici') {
        // Vinç de dahil
        query.serviceType = { $in: ['kurtarici', 'oto_kurtarma', 'vinc'] };
      } 
      else if (type === 'vinc') {
        // Sadece vinç
        query.serviceType = 'vinc';
      }
      else if (type === 'nakliye') {
        // Nakliye grubu: Tır, Kamyon, Evden Eve, Yurt Dışı hepsi
        query.serviceType = { $in: ['nakliye', 'evden_eve', 'evden_eve_nakliyat', 'kamyon', 'tir', 'kamyonet', 'yurt_disi_nakliye'] };
      } 
      else if (type === 'yurt_disi') {
        // Sadece Yurt Dışı
        query.serviceType = 'yurt_disi_nakliye';
      }
      else if (type === 'ticari') {
        // Sadece Ticari (Kamyon/Tır)
        query.serviceType = { $in: ['kamyon', 'tir', 'kamyonet', 'yurt_disi_nakliye'] };
      } 
      else {
        // Spesifik tip (örn: 'seyyar_sarj')
        query.serviceType = type;
      }
    }

    return this.profileModel.find({
      ...query,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: 5000000 
        }
      }
    })
    .select('_id firstName lastName location serviceType rating phoneNumber address city openingFee pricePerUnit minAmount vehicleType reservationUrl')
    .limit(10000) 
    .lean()
    .exec();
  }

  async migrateIsActiveField() { return { message: "Devre dışı." }; }
  async findAll() { return this.profileModel.find().lean().exec(); }
  
  // 🔥 TEMİZLİK: Tüm veriyi siler (Yeniden çekim öncesi kullanılabilir)
  async deleteAll() {
    await this.profileModel.deleteMany({});
    await this.userModel.deleteMany({ role: { $ne: 'admin' } });
    return { status: 'DELETED' };
  }
}