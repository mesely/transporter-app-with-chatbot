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
    this.logger.log('🚀 Transporter Engine: Veri Motoru Aktif.');
  }

  async create(data: any) {
    try {
      // 1. MEVCUT İSİM TEMİZLEME (Parantez içi temizleme)
      let cleanFirstName = data.firstName;
      if (cleanFirstName) {
         cleanFirstName = cleanFirstName.replace(/\s*\(.*?\)\s*/g, '').trim(); 
      }

      // 2. MEVCUT TELEFON TEKİLLEŞTİRME (Son 10 hane logic)
      const rawPhone = data.phoneNumber ? String(data.phoneNumber).replace(/\D/g, '') : '';
      const last10 = rawPhone.slice(-10);
      
      let existingProfile = await this.profileModel.findOne({ 
        phoneNumber: { $regex: last10 } 
      });

      let userId = existingProfile ? existingProfile.user : null;

      if (!userId) {
        const tempEmail = data.email || `${last10 || Math.random().toString(36).substr(2,5)}@transporter.app`;
        let user = await this.userModel.findOne({ email: tempEmail });
        
        if (!user) {
          const hashedPassword = await bcrypt.hash(data.password || '123', 10);
          user = await new this.userModel({
            email: tempEmail,
            password: hashedPassword,
            role: 'provider',
            isActive: true,
            // 🛠 YENİ ALANLAR: Create sırasında ekleniyor
            filterTags: data.filterTags || [],
            metadata: data.metadata || {},
            link: data.link || ''
          }).save();
        }
        userId = user._id;
      }

      // 3. MEVCUT GEOLOCATION (İzmir Default)
      let coords: [number, number] = [27.1428, 38.4237];
      if (data.location?.coordinates) {
        coords = data.location.coordinates;
      } else if (data.lng && data.lat) {
        coords = [parseFloat(data.lng), parseFloat(data.lat)];
      }

      const profileData = {
        user: userId,
        firstName: cleanFirstName,
        lastName: data.lastName || 'Hizmetleri',
        phoneNumber: data.phoneNumber,
        address: data.address || '',
        serviceType: data.serviceType || 'kurtarici',
        city: data.city || 'İzmir',
        routes: data.routes || '',
        rating: parseFloat(data.rating) || 4.5,
        isActive: true,
        location: { type: 'Point', coordinates: coords },
        openingFee: Number(data.openingFee) || 250,
        pricePerUnit: Number(data.pricePerUnit) || 30
      };

      return this.profileModel.findOneAndUpdate(
        { user: userId },
        profileData,
        { upsert: true, new: true }
      );
    } catch (error) {
      this.logger.error(`Kayıt Hatası: ${error.message}`);
      return null;
    }
  }

  // 🔥 MEVCUT AKILLI GRUPLANDIRMA (Bozulmadı)
  async findNearby(lat: number, lng: number, type?: string) {
    const query: any = { isActive: true };
    if (type) {
        if (type === 'sarj') query.serviceType = { $in: ['sarj_istasyonu', 'seyyar_sarj'] };
        else if (type === 'kurtarici') query.serviceType = { $in: ['kurtarici', 'oto_kurtarma', 'vinc'] };
        else if (type === 'nakliye') query.serviceType = { $in: ['nakliye', 'yurt_disi_nakliye', 'kamyon', 'tir', 'evden_eve', 'kamyonet'] };
        else query.serviceType = type;
    }
    return this.profileModel.find({
      ...query,
      location: { $near: { $geometry: { type: 'Point', coordinates: [lng, lat] }, $maxDistance: 5000000 } }
    }).lean().exec();
  }

  async findFiltered(city?: string, type?: string) {
    const query: any = {};
    if (city && city !== 'Tümü') query.city = city;
    if (type && type !== 'Tümü') {
      if (type === 'sarj') query.serviceType = { $in: ['sarj_istasyonu', 'seyyar_sarj'] };
      else if (type === 'kurtarici' || type === 'oto_kurtarma') query.serviceType = { $in: ['kurtarici', 'oto_kurtarma', 'vinc'] };
      else if (type === 'nakliye') query.serviceType = { $in: ['nakliye', 'yurt_disi_nakliye', 'kamyon', 'tir', 'evden_eve', 'kamyonet'] };
      else query.serviceType = type;
    }
    return this.profileModel.find(query).sort({ createdAt: -1 }).limit(100).lean().exec();
  }

  async findAll() { return this.profileModel.find().sort({ createdAt: -1 }).lean().exec(); }
  async updateOne(id: string, data: any) { return this.profileModel.findByIdAndUpdate(id, data, { new: true }); }
  async deleteOne(id: string) { return this.profileModel.findByIdAndDelete(id); }
}