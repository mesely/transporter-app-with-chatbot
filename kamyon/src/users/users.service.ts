import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { Profile } from './schemas/profile.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  findProvidersByType(searchType: string, arg1: number, arg2: number): any {
    throw new Error('Method not implemented.');
  }
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Profile.name) private profileModel: Model<Profile>,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 Sistem Hazır: 10x Performans Motoru ve İndeksler Aktif.');
  }

  // --- 1. VERİ OLUŞTURMA (Create/Upsert) ---
  async create(data: any) {
    try {
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

      // GeoJSON Formatı (veya Legacy Pairs [lng, lat])
      const geoLocation = data.location?.coordinates 
        ? data.location 
        : (data.lat && data.lng) 
          ? { type: 'Point', coordinates: [parseFloat(data.lng), parseFloat(data.lat)] }
          : null;

      const profileData = {
        user: user['_id'],
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        address: data.address,
        serviceType: data.serviceType,
        city: data.city,
        routes: data.routes,
        rating: data.rating || 0,
        isActive: true, // İndeks ve Hız için kritik
        location: geoLocation,
        reservationUrl: data.reservationUrl || '',
        vehicleType: data.vehicleType || '',
        extraWarnings: data.extraWarnings || '',
        openingFee: data.openingFee || 250,
        pricePerUnit: data.pricePerUnit || 30,
        minAmount: data.minAmount || 0
      };

      return this.profileModel.findOneAndUpdate(
        { user: user['_id'] },
        profileData,
        { upsert: true, new: true, lean: true }
      );
    } catch (error) {
      this.logger.error(`Kayıt Hatası (${data.email}): ${error.message}`);
      throw error;
    }
  }

  // --- 2. HIZLI YAKINDAKİLER SORGUSU (10x Optimize) ---
  async findNearby(lat: number, lng: number, type?: string) {
    const query: any = { isActive: true }; // İndeksin ilk elemanı (Equality)

    // Filtreleme Mantığı (ESR Kuralı)
    if (type) {
      if (type === 'sarj') {
        query.serviceType = { $in: ['sarj_istasyonu', 'seyyar_sarj'] };
      } else if (type === 'kurtarici') {
        query.serviceType = { $in: ['kurtarici', 'vinc', 'oto_kurtarma'] };
      } else if (type === 'nakliye') {
        query.serviceType = { $in: ['nakliye', 'kamyon', 'tir', 'kamyonet', 'evden_eve'] };
      } else {
        query.serviceType = type;
      }
    }

    return this.profileModel.find({
      ...query,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: 200000 // 200 KM yarıçap
        }
      }
    })
    // 🔥 PROJECTION: Sadece lazım olanları çek
    .select('_id firstName lastName location serviceType rating phoneNumber address city openingFee pricePerUnit minAmount vehicleType reservationUrl')
    // 🔥 LIMIT: Sonsuz veri çekme
    .limit(100)
    // 🔥 LEAN: %50 RAM Tasarrufu
    .lean()
    .exec();
  }

  // --- 3. VERİTABANI DÜZELTME (MIGRATION) ---
  // Controller'dan burayı çağıracağız. profileModel burada erişilebilir.
  async migrateIsActiveField() {
    const profiles = await this.profileModel.find().populate('user');
    let updatedCount = 0;

    for (const profile of profiles) {
      if (profile.user) {
        // User tablosundaki durumu al
        const userStatus = (profile.user as any).isActive;
        
        // Profile tablosuna işle
        // Not: updateOne kullanarak tüm dökümanı save etmekten daha hızlıdır
        await this.profileModel.updateOne(
            { _id: profile._id }, 
            { $set: { isActive: userStatus } }
        );
        updatedCount++;
      }
    }
    return { message: `İşlem Tamam! ${updatedCount} adet profil güncellendi. Hiçbir veri silinmedi.` };
  }

  async findAll() {
    return this.profileModel.find().lean().exec();
  }

  async deleteAll() {
    await this.profileModel.deleteMany({});
    await this.userModel.deleteMany({ role: { $ne: 'admin' } });
    return { status: 'DELETED' };
  }
}