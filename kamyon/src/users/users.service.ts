import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { Profile } from './schemas/profile.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Profile.name) private profileModel: Model<Profile>,
  ) {}

  async onModuleInit() {
    this.logger.log('Sistem Hazır: 3005 Portu ve Geo-Sorgu Motoru Aktif.');
  }

  /**
   * VERİ ENTEGRASYONU (CREATE/UPSERT)
   * Değiştirilmedi, mevcut tıkır tıkır çalışan mantığın.
   */
  async create(data: any) {
    try {
      let user = await this.userModel.findOne({ email: data.email });
      if (!user) {
        const hashedPassword = await bcrypt.hash(data.password || '123', 10);
        user = new this.userModel({
          email: data.email,
          password: hashedPassword,
          role: data.role || 'provider',
          isActive: true,
          rating: data.rating || 0
        });
        user = await user.save();
      }

      const geoLocation = data.location || null;

      const profileData = {
        user: user._id,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        address: data.address,
        serviceType: data.serviceType,
        city: data.city,
        routes: data.routes,
        rating: data.rating || 0,
        location: geoLocation,
        // Yeni alanlar (Aksiyon paneli için)
        reservationUrl: data.reservationUrl || '',
        vehicleType: data.vehicleType || '',
        extraWarnings: data.extraWarnings || ''
      };

      const updatedProfile = await this.profileModel.findOneAndUpdate(
        { user: user._id },
        profileData,
        { upsert: true, new: true }
      );

      return updatedProfile;
    } catch (error) {
      this.logger.error(`Kayıt Hatası (${data.email}): ${error.message}`);
      throw error;
    }
  }

  /**
   * 🗺️ GÜNCEL TÜRÜNE GÖRE BULMA
   * Frontend'deki ActionPanel ile tam uyumlu hale getirildi.
   */
  async findProvidersByType(type: string, lat?: number, lng?: number) {
    let query: any = {};

    // 1. Kategori Mantığı (Frontend'den 'sarj' gelirse her iki tipi de bul)
    if (type === 'sarj') {
      query.serviceType = { $in: ['sarj_istasyonu', 'seyyar_sarj'] };
    } else if (type) {
      query.serviceType = type;
    }

    // 2. Koordinat Varsa Yakınlık Sorgusu Yap
    if (lat !== undefined && lng !== undefined) {
      return this.profileModel.find({
        ...query,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
            $maxDistance: 150000, // Çapı 150 KM'ye çıkardım (Daha fazla sonuç için)
          },
        },
      })
      .populate('user', 'email rating role')
      .exec();
    }

    // 3. Koordinat yoksa puanı en yüksekleri getir
    return this.profileModel.find(query)
      .populate('user', 'email rating')
      .sort({ rating: -1 })
      .limit(50)
      .exec();
  }

  /**
   * 🧭 GENEL YAKINDAKİLER SORGUSU (Sayfa ilk açıldığında çalışır)
   */
  async findNearby(lat: number, lng: number, radiusInKm: number = 1600) {
    return this.profileModel.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: radiusInKm * 1000,
        },
      },
    })
    .populate('user', 'email rating role')
    .exec();
  }

  async findAll() {
    return this.profileModel.find().populate('user', 'email role isActive').exec();
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async deleteAll() {
    await this.profileModel.deleteMany({});
    await this.userModel.deleteMany({ role: { $ne: 'admin' } });
    return { status: 'DELETED' };
  }
}