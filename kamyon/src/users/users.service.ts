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
    this.logger.log('🚀 Transporter Engine (V3 - Max Range): Veri Motoru Aktif.');
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
          email: email,
          password: hashedPassword,
          role: 'provider',
          isActive: true
        }).save();
      }

      let coords: [number, number] = [27.1428, 38.4237];
      if (data.location?.coordinates) {
        coords = data.location.coordinates;
      } else if (data.lng && data.lat) {
        coords = [parseFloat(data.lng), parseFloat(data.lat)];
      }

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
        { user: user._id },
        providerData,
        { upsert: true, new: true }
      );

    } catch (error) {
      this.logger.error(`Kayıt Hatası: ${error.message}`);
      return null;
    }
  }

  // --- 2. FIND NEARBY (TURBO RANGE) ---
  async findNearby(lat: number, lng: number, rawType?: string, zoom?: number) {
    const query: any = {};
    
    if (rawType) {
        const type = rawType.toLowerCase();
        const mainEnum = this.mapToEnum(type);

        if (['nakliye', 'sarj', 'kurtarici', 'kurtarıcı', 'genel'].includes(type)) {
             query['service.mainType'] = mainEnum;
        } else {
             query['service.subType'] = type;
        }
    }

    // 🔥 MAX DISTANCE ARTIK 15.000 KM (Tüm Kıtalar)
    // Zoom seviyesine göre limit belirle. Eğer çok zoom out (uzak) ise limiti patlat.
    const maxDist = 15000000; 
    
    // 🔥 LİMİT ARTIK 1000 (Yakındaki 200 kişiye takılmasın diye)
    // Zoom uzaksa (Tüm Türkiye bakılıyorsa) limiti yüksek tutuyoruz.
    const limit = (zoom && zoom < 10) ? 1000 : 300;

    return this.providerModel.find({
      ...query,
      location: { 
        $near: { 
            $geometry: { type: 'Point', coordinates: [lng, lat] }, 
            $maxDistance: maxDist 
        } 
      }
    })
    .limit(limit) // Limiti artırdık!
    .lean()
    .exec(); 
  }

  // --- 3. FIND DIVERSE LIST (KARMA LİSTE) ---
  async findDiverseList(lat: number, lng: number, limitPerType: number = 5) {
    return this.providerModel.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          key: 'location',
          distanceField: 'distance',
          maxDistance: 15000000, // 🔥 15.000 KM
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
      { $replaceRoot: { newRoot: "$drivers" } },
      { $sort: { distance: 1 } }
    ]).exec();
  }

  // --- 4. AKILLI HARİTA (SMART MAP) ---
  async findSmartMapData(lat: number, lng: number, zoomLevel: number = 10) {
    return this.providerModel.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          key: 'location',
          distanceField: 'distance',
          maxDistance: 15000000, // 🔥 15.000 KM
          spherical: true
        }
      },
      {
        $group: {
          // Basit bir gruplama yapıp tekil verileri döndürüyoruz
          // İleride gridleme buraya eklenebilir
          _id: "$service.mainType", 
          doc: { $first: "$$ROOT" } 
        }
      },
      { $replaceRoot: { newRoot: "$doc" } }
    ]).exec();
  }

  // --- 5. YARDIMCI METHODLAR ---
  async findFiltered(city?: string, type?: string) {
    const query: any = {};
    if (city && city !== 'Tümü') query['address.city'] = city;
    if (type && type !== 'Tümü') query['service.mainType'] = this.mapToEnum(type);
    return this.providerModel.find(query).sort({ createdAt: -1 }).limit(200).lean().exec();
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

  private mapToEnum(type: string): string {
    if (!type) return 'KURTARICI';
    const t = type.toLowerCase();

    if (t.includes('nakli') || t.includes('kamyon') || t.includes('tir') || t.includes('evden') || t.includes('yurt')) return 'NAKLIYE';
    if (t.includes('sarj') || t.includes('şarj') || t.includes('istasyon') || t.includes('mobil')) return 'SARJ';
    if (t.includes('kurtar') || t.includes('oto') || t.includes('vinç') || t.includes('vinc')) return 'KURTARICI';

    return 'KURTARICI';
  }
}