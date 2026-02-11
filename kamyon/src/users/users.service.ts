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
    // GeoSpatial Index oluşturma
    try { 
      await this.providerModel.collection.createIndex({ location: '2dsphere' }); 
      this.logger.log('✅ Konum indeksi doğrulandı.');
    } catch (e) {
      this.logger.error('Index hatası (zaten varsa sorun yok):', e);
    }
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

      let coords: [number, number] = [35.6667, 39.1667]; 
      if (data.location?.coordinates) coords = data.location.coordinates;
      else if (data.lng && data.lat) coords = [parseFloat(data.lng), parseFloat(data.lat)];

      let mainType = 'KURTARICI';
      if (data.serviceType) {
         const t = data.serviceType.toUpperCase();
         if (['NAKLIYE', 'SARJ', 'KURTARICI'].includes(t)) mainType = t;
         else if (['TIR', 'KAMYON', 'KAMYONET', 'YURT_DISI'].includes(t)) mainType = 'NAKLIYE';
         else if (['OTO_KURTARMA', 'VINC'].includes(t)) mainType = 'KURTARICI';
         else if (['ISTASYON', 'SEYYAR_SARJ', 'MOBIL_UNIT'].includes(t)) mainType = 'SARJ';
      }

      const subTypeToSave = data.serviceType === 'MOBIL_UNIT' ? 'seyyar_sarj' : (data.serviceType || 'genel');

      return this.providerModel.findOneAndUpdate(
        { user: user._id },
        {
          user: user._id,
          businessName: cleanName || 'İsimsiz İşletme',
          phoneNumber: rawPhone,
          address: { fullText: data.address || '', city: data.city || 'Bilinmiyor', district: data.district || 'Merkez' },
          service: { mainType, subType: subTypeToSave, tags: data.filterTags || [] },
          pricing: { openingFee: Number(data.openingFee) || 350, pricePerUnit: Number(data.pricePerUnit) || 40 },
          location: { type: 'Point', coordinates: coords },
          rating: 5.0 
        },
        { upsert: true, new: true }
      );
    } catch (e) { return null; }
  }

  // --- 2. FIND NEARBY (GÜNCELLENMİŞ VE KEY EKLENMİŞ HALİ) ---
  async findNearby(lat: number, lng: number, rawType: string, zoom: number) {
    const safeZoom = zoom ? Number(zoom) : 15;
    let maxDist = 500000; 
    let limit = 200;

    if (safeZoom < 8) { maxDist = 20000000; limit = 3000; } 
    else if (safeZoom < 11) { maxDist = 2000000; limit = 1000; } 
    else { maxDist = 100000; limit = 200; }

    const filterQuery: any = {};
    if (rawType && rawType !== '') {
        const type = rawType.toLowerCase().trim();
        if (type === 'nakliye') filterQuery['service.mainType'] = 'NAKLIYE';
        else if (type === 'kurtarici') filterQuery['service.mainType'] = 'KURTARICI';
        else if (type === 'sarj') filterQuery['service.mainType'] = 'SARJ';
        else if (type === 'sarj_istasyonu') filterQuery['service.subType'] = 'istasyon';
        else if (type === 'seyyar_sarj') filterQuery['service.subType'] = { $in: ['seyyar_sarj', 'MOBIL_UNIT'] };
        else if (type === 'yurt_disi') filterQuery['service.subType'] = 'yurt_disi_nakliye';
        else filterQuery['service.subType'] = type;
    }

    return this.providerModel.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          distanceField: 'distance',
          key: 'location', // 🔥 KRİTİK: Birden fazla indeks hatasını önleyen satır
          maxDistance: maxDist,
          spherical: true,
          query: filterQuery 
        }
      },
      { $limit: limit },
      {
        $project: {
          businessName: 1,
          location: 1,
          service: 1,
          pricing: 1,
          address: 1,
          phoneNumber: 1,
          rating: 1,
          distance: 1 
        }
      }
    ]).exec();
  }

  // --- 3. DİĞER FONKSİYONLAR ---
  async findDiverseList(lat: number, lng: number) {
      return this.findNearby(lat, lng, '', 13);
  }

  async findFiltered(city?: string, type?: string) {
      const query: any = {};
      if (city) query['address.city'] = new RegExp(city, 'i');
      if (type) {
          if (['NAKLIYE', 'SARJ', 'KURTARICI'].includes(type.toUpperCase())) query['service.mainType'] = type.toUpperCase();
          else query['service.subType'] = type;
      }
      return this.providerModel.find(query).sort({ _id: -1 }).limit(100).exec();
  }

  async updateOne(id: string, data: any) { 
      return this.providerModel.findByIdAndUpdate(id, data, { new: true }).exec(); 
  }
  
  async deleteOne(id: string) { 
      return this.providerModel.findByIdAndDelete(id).exec(); 
  }

  async getServiceTypes() {
    return this.providerModel.aggregate([{ $group: { _id: "$service.mainType", count: { $sum: 1 } } }]).exec();
  }
}