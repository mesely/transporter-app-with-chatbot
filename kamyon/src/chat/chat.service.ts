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
    this.logger.log('🚀 Transporter V7 (Query Fix Final): Hazır.');
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

      const mappedMainType = this.mapToEnum(data.serviceType);

      return this.providerModel.findOneAndUpdate(
        { user: user._id },
        {
          user: user._id,
          businessName: cleanName || 'İsimsiz',
          phoneNumber: rawPhone,
          address: { fullText: data.address || '', city: data.city || 'Bilinmiyor', district: data.district || 'Merkez' },
          service: {
            mainType: mappedMainType,
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

  // --- 2. FIND NEARBY (FIXED QUERY) ---
  async findNearby(lat: number, lng: number, rawType: string, zoom: number) {
    // 1. Zoom ve Menzil Ayarı
    const safeZoom = zoom ? Number(zoom) : 15;
    let maxDist = 500000; // 500 km default
    let limit = 200;

    if (safeZoom < 8) {
        maxDist = 20000000; // 20.000 KM (Dünya)
        limit = 5000; // Tüm veriyi çek
    } else if (safeZoom < 11) {
        maxDist = 2000000; // 2000 KM
        limit = 1000;
    }

    // 2. SORGUNUN KURULUMU (Query Object)
    // MongoDB'de $near kullanırken, diğer filtreler de aynı objede olmalı.
    const query: any = {
        location: {
            $near: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: maxDist
            }
        }
    };

    // 3. TÜR FİLTRESİ (Kesin Eşleşme)
    if (rawType) {
        const type = rawType.toLowerCase();
        
        // Ana Kategori Araması
        if (['nakliye', 'sarj', 'kurtarici', 'kurtarıcı'].includes(type)) {
            // mapToEnum fonksiyonu doğru ENUM'u döndürür (Örn: 'kurtarici' -> 'KURTARICI')
            query['service.mainType'] = this.mapToEnum(type);
        } 
        // Alt Kategori Araması
        else {
            // Frontend -> DB Mapping
            if (type === 'sarj_istasyonu') query['service.subType'] = 'istasyon';
            else if (type === 'seyyar_sarj') query['service.subType'] = 'MOBIL_UNIT';
            else if (type === 'yurt_disi') query['service.subType'] = 'yurt_disi_nakliye';
            else if (type === 'vinc') query['service.subType'] = 'vinc';
            else if (type === 'oto_kurtarma') query['service.subType'] = 'oto_kurtarma';
            // Diğerleri için esnek arama (tir, kamyon vs.)
            else query['service.subType'] = new RegExp(type, 'i');
        }
    }

    // 4. LOGLAMA (Ne aradığımızı görelim)
    this.logger.log(`🔍 FIXED QUERY: ${JSON.stringify(query)} | Limit: ${limit}`);

    return this.providerModel.find(query)
        .select('businessName location service pricing address phoneNumber rating')
        .limit(limit)
        .lean()
        .exec();
  }

  // --- Diğerleri ---
  async getServiceTypes() {
    return this.providerModel.aggregate([{
        $group: { _id: null, allMainTypes: { $addToSet: "$service.mainType" }, allSubTypes: { $addToSet: "$service.subType" }, totalDocs: { $sum: 1 } }
    }]).exec();
  }
  
  async findDiverseList(lat: number, lng: number, limit: number) { return []; }
  async findSmartMapData(lat: number, lng: number) { return []; }
  async findFiltered(city?, type?) { return []; }
  async updateOne(id, data) { return this.providerModel.findByIdAndUpdate(id, data, { new: true }); }
  async deleteOne(id) { return this.providerModel.findByIdAndDelete(id); }

  private mapToEnum(type: string): string {
    if (!type) return 'KURTARICI';
    const t = type.toLowerCase();
    if (t.includes('nakli') || t.includes('kamyon') || t.includes('tir') || t.includes('evden') || t.includes('yurt')) return 'NAKLIYE';
    if (t.includes('sarj') || t.includes('şarj') || t.includes('istasyon') || t.includes('mobil')) return 'SARJ';
    if (t.includes('kurtar') || t.includes('oto') || t.includes('vinç') || t.includes('vinc')) return 'KURTARICI';
    return 'KURTARICI';
  }
}