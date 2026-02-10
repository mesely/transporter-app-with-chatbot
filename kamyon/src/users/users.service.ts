import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

// ŞEMALAR
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
    this.logger.log('🚀 Transporter Engine (V4 - Analytics & Clustering): Hazır.');
    try {
      await this.providerModel.collection.createIndex({ location: '2dsphere' });
    } catch (e) {}
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
        user = await new this.userModel({
          email: email, password: hashedPassword, role: 'provider', isActive: true
        }).save();
      }

      let coords: [number, number] = [27.1428, 38.4237];
      if (data.location?.coordinates) coords = data.location.coordinates;
      else if (data.lng && data.lat) coords = [parseFloat(data.lng), parseFloat(data.lat)];

      const providerData = {
        user: user._id,
        businessName: cleanName || 'İsimsiz İşletme',
        phoneNumber: rawPhone,
        address: {
          fullText: data.address || '',
          city: data.city || 'Bilinmiyor',
          district: data.district || 'Merkez'
        },
        service: {
          mainType: this.mapToEnum(data.serviceType), 
          subType: data.serviceType || 'genel',
          tags: data.filterTags || []
        },
        pricing: {
          openingFee: Number(data.openingFee) || 350,
          pricePerUnit: Number(data.pricePerUnit) || 40
        },
        location: { type: 'Point', coordinates: coords }
      };

      return this.providerModel.findOneAndUpdate(
        { user: user._id }, providerData, { upsert: true, new: true }
      );
    } catch (error) { return null; }
  }

  // --- 2. FIND NEARBY (TURBO LIMIT) ---
  async findNearby(lat: number, lng: number, rawType?: string, zoom?: number) {
    const query: any = {};
    const safeZoom = zoom || 15;

    if (rawType) {
        const type = rawType.toLowerCase();
        const mainEnum = this.mapToEnum(type);

        // Ana Gruplar
        if (['nakliye', 'sarj', 'kurtarici', 'kurtarıcı', 'genel'].includes(type)) {
             query['service.mainType'] = mainEnum;
        } 
        // Özel Alt Tipler
        else {
             if(type === 'sarj_istasyonu') query['service.subType'] = 'istasyon';
             else if(type === 'seyyar_sarj') query['service.subType'] = 'MOBIL_UNIT';
             else if(type === 'yurt_disi') query['service.subType'] = 'yurt_disi_nakliye';
             else query['service.subType'] = type;
        }
    }

    // Zoom Uzaksa (Tüm Türkiye) Limiti Aç
    let limit = 150;
    let maxDist = 500000; 

    if (safeZoom < 9) { 
        limit = 3000; // 🔥 3000 Kayıt (Tüm illeri kapsasın)
        maxDist = 10000000; // 10.000 KM
    } else if (safeZoom < 12) {
        limit = 500;
        maxDist = 1000000; 
    }

    return this.providerModel.find({
      ...query,
      location: { 
        $near: { 
            $geometry: { type: 'Point', coordinates: [lng, lat] }, 
            $maxDistance: maxDist 
        } 
      }
    })
    .select('businessName location service pricing address phoneNumber rating') 
    .limit(limit) 
    .lean()
    .exec(); 
  }

  // --- 3. 🔥 ANALİZ METODU: DB'DEKİ TÜM TİPLERİ GETİR ---
  // Bunu bir endpoint'e bağla ve dönen JSON'a bak.
  async getServiceTypes() {
    return this.providerModel.aggregate([
      {
        $group: {
          _id: null,
          allMainTypes: { $addToSet: "$service.mainType" }, // Tüm benzersiz Ana Tipler
          allSubTypes: { $addToSet: "$service.subType" },   // Tüm benzersiz Alt Tipler
          totalDocs: { $sum: 1 }
        }
      }
    ]).exec();
  }

  // --- 4. KARIŞIK LİSTE ---
  async findDiverseList(lat: number, lng: number, limitPerType: number = 5) {
    return this.providerModel.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          key: 'location',
          distanceField: 'distance',
          maxDistance: 5000000, 
          spherical: true
        }
      },
      { $sort: { distance: 1 } },
      {
        $group: {
          _id: "$service.mainType", 
          drivers: { $push: "$$ROOT" } 
        }
      },
      { $project: { drivers: { $slice: ["$drivers", limitPerType] } } },
      { $unwind: "$drivers" },
      { $replaceRoot: { newRoot: "$drivers" } }
    ]).exec();
  }

  // --- 5. SMART MAP ---
  async findSmartMapData(lat: number, lng: number) {
    return this.providerModel.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          key: 'location',
          distanceField: 'distance',
          maxDistance: 5000000,
          spherical: true
        }
      },
      {
        $group: {
          _id: "$service.mainType", 
          doc: { $first: "$$ROOT" } 
        }
      },
      { $replaceRoot: { newRoot: "$doc" } }
    ]).exec();
  }

  // --- YARDIMCI METHODLAR ---
  async findFiltered(city?: string, type?: string) {
    const query: any = {};
    if (city && city !== 'Tümü') query['address.city'] = city;
    if (type && type !== 'Tümü') query['service.mainType'] = this.mapToEnum(type);
    return this.providerModel.find(query).sort({ createdAt: -1 }).limit(100).lean().exec();
  }

  async updateOne(id: string, data: any) {
    return this.providerModel.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteOne(id: string) {
    const provider = await this.providerModel.findById(id);
    if (provider) {
        await this.userModel.findByIdAndDelete(provider.user);
        return this.providerModel.findByIdAndDelete(id);
    }
    return null;
  }

  // MAPPER
  private mapToEnum(type: string): string {
    if (!type) return 'KURTARICI';
    const t = type.toLowerCase();
    if (t.includes('nakli') || t.includes('kamyon') || t.includes('tir') || t.includes('evden') || t.includes('yurt')) return 'NAKLIYE';
    if (t.includes('sarj') || t.includes('şarj') || t.includes('istasyon') || t.includes('mobil')) return 'SARJ';
    return 'KURTARICI';
  }
}