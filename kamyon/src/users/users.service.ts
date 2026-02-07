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
        isActive: true,
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

  // --- 2. HIZLI YAKINDAKİLER SORGUSU (ZOOM OUT FIX) ---
  async findNearby(lat: number, lng: number, type?: string) {
    const query: any = { isActive: true };

    // Filtreleme Mantığı (ESR Kuralı)
    if (type) {
      if (type === 'sarj') {
        query.serviceType = { $in: ['sarj_istasyonu', 'seyyar_sarj'] };
      } else if (type === 'kurtarici') {
        query.serviceType = { $in: ['kurtarici', 'vinc', 'oto_kurtarma'] };
      } else if (type === 'nakliye') {
        query.serviceType = { $in: ['nakliye', 'kamyon', 'tir', 'kamyonet', 'evden_eve'] };
      } else if (type === 'ticari') {
        query.serviceType = { $in: ['kamyon', 'tir', 'kamyonet'] };
      } else {
        query.serviceType = type;
      }
    }

    return this.profileModel.find({
      ...query,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          // 🔥 GÜNCELLEME 1: Çap 2.000 KM yapıldı (Tüm Türkiye'yi kapsar)
          $maxDistance: 2000000 
        }
      }
    })
    .select('_id firstName lastName location serviceType rating phoneNumber address city openingFee pricePerUnit minAmount vehicleType reservationUrl')
    // 🔥 GÜNCELLEME 2: Limit 2500 yapıldı (Scroll bitmesin diye)
    .limit(2500)
    .lean()
    .exec();
  }

  // --- 3. MIGRATION ---
  async migrateIsActiveField() {
    return { message: "Bu özellik güvenlik nedeniyle devre dışı bırakıldı." };
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