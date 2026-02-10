import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { NewUser, NewUserDocument } from '../data/schemas/new-user.schema';
import { NewProvider, NewProviderDocument } from '../data/schemas/new-provider.schema';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(NewUser.name) private userModel: Model<NewUserDocument>,
    @InjectModel(NewProvider.name) private providerModel: Model<NewProviderDocument>,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 Transporter V12 (Full Service): Sistem Hazır.');
    try { await this.providerModel.collection.createIndex({ location: '2dsphere' }); } catch (e) {}
  }

  // --- 1. CREATE ---
  async create(data: any) {
    try {
      const cleanName = (data.firstName || data.businessName || '').trim();
      const rawPhone = data.phoneNumber ? String(data.phoneNumber).replace(/\D/g, '') : '';
      const email = data.email || `provider_${rawPhone.slice(-10)}@transporter.app`;

      let user = await this.userModel.findOne({ email });
      if (!user) {
        const hashedPassword = await bcrypt.hash(data.password || '123456', 10);
        user = await new this.userModel({ email, password: hashedPassword, role: 'provider', isActive: true }).save();
      }

      let coords: [number, number] = [27.1428, 38.4237];
      if (data.location?.coordinates) coords = data.location.coordinates;
      else if (data.lng && data.lat) coords = [parseFloat(data.lng), parseFloat(data.lat)];

      let mainType = 'KURTARICI';
      if (data.serviceType) {
         const t = data.serviceType.toUpperCase();
         if (['NAKLIYE', 'SARJ', 'KURTARICI'].includes(t)) mainType = t;
      }

      return this.providerModel.findOneAndUpdate(
        { user: user._id },
        {
          user: user._id,
          businessName: cleanName || 'İsimsiz',
          phoneNumber: rawPhone,
          address: { fullText: data.address || '', city: data.city || 'Bilinmiyor', district: data.district || 'Merkez' },
          service: {
            mainType: mainType,
            subType: data.serviceType || 'genel',
            tags: data.filterTags || []
          },
          pricing: { openingFee: Number(data.openingFee) || 350, pricePerUnit: Number(data.pricePerUnit) || 40 },
          location: { type: 'Point', coordinates: coords }
        },
        { upsert: true, new: true }
      );
    } catch (e) { return null; }
  }

  // --- 2. FIND NEARBY (ANA ARAMA) ---
  async findNearby(lat: number, lng: number, rawType: string, zoom: number) {
    const safeZoom = zoom ? Number(zoom) : 15;
    let maxDist = 500000; 
    let limit = 200;

    if (safeZoom < 9) {
        maxDist = 20000000; 
        limit = 5000;
    } else if (safeZoom < 12) {
        maxDist = 2000000;
        limit = 1000;
    }

    const query: any = {
        location: {
            $near: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: maxDist
            }
        }
    };

    if (rawType) {
        const type = rawType.toLowerCase();
        if (type === 'nakliye') query['service.mainType'] = 'NAKLIYE';
        else if (type === 'sarj') query['service.mainType'] = 'SARJ';
        else if (type === 'kurtarici') query['service.mainType'] = 'KURTARICI';
        else {
            if (type === 'sarj_istasyonu') query['service.subType'] = 'istasyon';
            else if (type === 'yurt_disi') query['service.subType'] = 'yurt_disi_nakliye';
            else query['service.subType'] = type;
        }
    }

    return this.providerModel.find(query)
        .select('businessName location service pricing address phoneNumber rating')
        .limit(limit)
        .lean()
        .exec();
  }

  // --- 3. DİĞER FONKSİYONLAR (HATA VEREN KISIMLAR DÜZELTİLDİ) ---

  // Liste Modu (Karışık Getir) - Parametreler eklendi
  async findDiverseList(lat: number, lng: number, limit: number = 5) {
      // Şimdilik yakındaki herkesi getiriyoruz, ileride burayı özelleştirebilirsin
      return this.findNearby(lat, lng, '', 15);
  }

  // Akıllı Harita (Uzak Zoom) - Parametreler eklendi
  async findSmartMapData(lat: number, lng: number) {
      // Uzaktan bakınca çok veri çek (Zoom 8 gibi davran)
      return this.findNearby(lat, lng, '', 8);
  }

  // Yönetim Paneli Filtreleme - Parametreler eklendi
  async findFiltered(city?: string, type?: string) {
      const query: any = {};
      
      if (city) {
          query['address.city'] = new RegExp(city, 'i');
      }
      
      if (type) {
          if (['NAKLIYE', 'SARJ', 'KURTARICI'].includes(type.toUpperCase())) {
              query['service.mainType'] = type.toUpperCase();
          } else {
              query['service.subType'] = type;
          }
      }

      return this.providerModel.find(query).sort({ _id: -1 }).limit(100).exec();
  }

  // Update & Delete
  async updateOne(id: string, data: any) { 
      return this.providerModel.findByIdAndUpdate(id, data, { new: true }); 
  }
  
  async deleteOne(id: string) { 
      return this.providerModel.findByIdAndDelete(id); 
  }

  // İstatistik
  async getServiceTypes() {
    return this.providerModel.aggregate([{
        $group: { _id: "$service.mainType", count: { $sum: 1 } }
    }]).exec();
  }
}