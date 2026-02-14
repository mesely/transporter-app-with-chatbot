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

      // 1. User Şemasını Güncelle/Oluştur (Link Dahil)
      let user = await this.userModel.findOne({ email });
      if (!user) {
        const hashedPassword = await bcrypt.hash(data.password || '123456', 10);
        user = await new this.userModel({ 
          email, 
          password: hashedPassword, 
          role: 'provider', 
          isActive: true,
          link: data.website || data.link || '' 
        }).save();
      } else if (data.website || data.link) {
        // 🔥 TS2339 Hatası Çözümü: Doğrudan veritabanı update sorgusu atılır, tip hatasına takılmaz.
        await this.userModel.updateOne(
          { _id: user._id }, 
          { $set: { link: data.website || data.link } }
        );
      }

      let coords: [number, number] = [35.6667, 39.1667]; 
      if (data.location?.coordinates) coords = data.location.coordinates;
      else if (data.lng && data.lat) coords = [parseFloat(data.lng), parseFloat(data.lat)];

      let mainType = 'KURTARICI';
      if (data.serviceType || data.service?.subType) {
         const t = (data.service?.subType || data.serviceType).toUpperCase();
         if (['NAKLIYE', 'SARJ', 'KURTARICI', 'YOLCU'].includes(t)) mainType = t;
         else if (['TIR', 'KAMYON', 'KAMYONET', 'YURT_DISI_NAKLIYE'].includes(t)) mainType = 'NAKLIYE';
         else if (['OTO_KURTARMA', 'VINC'].includes(t)) mainType = 'KURTARICI';
         else if (['ISTASYON', 'SEYYAR_SARJ', 'MOBIL_UNIT'].includes(t)) mainType = 'SARJ';
         else if (['YOLCU_TASIMA', 'MINIBUS', 'OTOBUS', 'MIDIBUS', 'VIP_TASIMA'].includes(t)) mainType = 'YOLCU';
      }

      const subTypeToSave = data.serviceType === 'MOBIL_UNIT' ? 'seyyar_sarj' : (data.serviceType || data.service?.subType || 'genel');

      // 2. Provider/Profile Şemasını Güncelle/Oluştur
      return this.providerModel.findOneAndUpdate(
        { user: user._id },
        {
          user: user._id,
          businessName: cleanName || 'İsimsiz İşletme',
          phoneNumber: rawPhone,
          address: { fullText: data.address || '', city: data.city || 'Bilinmiyor', district: data.district || 'Merkez' },
          service: { mainType, subType: subTypeToSave, tags: data.filterTags || data.service?.tags || [] },
          pricing: { openingFee: Number(data.openingFee || data.pricing?.openingFee) || 350, pricePerUnit: Number(data.pricePerUnit || data.pricing?.pricePerUnit) || 40 },
          location: { type: 'Point', coordinates: coords },
          link: data.website || data.link || '', // Eğer Profile tablosunda loose type (esnek) varsa oraya da yazılır.
          website: data.website || data.link || '',
          rating: 5.0 
        },
        { upsert: true, new: true }
      );
    } catch (e) { return null; }
  }

  // --- 2. FIND NEARBY (HARİTA & LİSTE İÇİN) ---
  async findNearby(lat: number, lng: number, rawType: string, zoom: number) {
    const safeZoom = zoom ? Number(zoom) : 15;
    let maxDist = 500000; 
    let limit = 200;

    // Geniş alan taraması ayarları
    if (safeZoom < 8) { maxDist = 20000000; limit = 3000; } 
    else if (safeZoom < 11) { maxDist = 2000000; limit = 1000; } 
    else { maxDist = 100000; limit = 200; }

    const filterQuery: any = {};
    if (rawType && rawType !== '') {
        const type = rawType.toLowerCase().trim();
        if (type === 'nakliye') filterQuery['service.mainType'] = 'NAKLIYE';
        else if (type === 'kurtarici') filterQuery['service.mainType'] = 'KURTARICI';
        else if (type === 'sarj') filterQuery['service.mainType'] = 'SARJ';
        else if (type === 'yolcu') filterQuery['service.mainType'] = 'YOLCU';
        else if (type === 'sarj_istasyonu') filterQuery['service.subType'] = 'istasyon';
        else if (type === 'seyyar_sarj') filterQuery['service.subType'] = { $in: ['seyyar_sarj', 'MOBIL_UNIT'] };
        else filterQuery['service.subType'] = type;
    }

    return this.providerModel.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          distanceField: 'distance',
          key: 'location',
          maxDistance: maxDist,
          spherical: true,
          query: filterQuery 
        }
      },
      // 🟢 User (newusers) tablosundaki "link" bilgisini Profile (provider) içine gömüyoruz
      {
        $lookup: {
          from: 'newusers', // Mongoose koleksiyon adı (Eğer standart ise 'users' olarak değiştirin)
          localField: 'user',
          foreignField: '_id',
          as: 'userData'
        }
      },
      { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } },
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
          distance: 1,
          // userData'daki linki öncelikli al, yoksa kendi linkini kullan
          link: { $ifNull: [ "$userData.link", "$link" ] },
          website: { $ifNull: [ "$userData.link", "$website" ] }
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
      if (city && city !== 'Tümü') query['address.city'] = new RegExp(city, 'i');
      if (type && type !== 'Tümü') {
          if (['NAKLIYE', 'SARJ', 'KURTARICI', 'YOLCU'].includes(type.toUpperCase())) query['service.mainType'] = type.toUpperCase();
          else query['service.subType'] = type;
      }
      return this.providerModel.find(query).sort({ _id: -1 }).limit(500).exec();
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