import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

// YENİ ŞEMALARI DATA KLASÖRÜNDEN ÇEKİYORUZ
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
    this.logger.log('🚀 Transporter Engine (V2): Yeni Veri Motoru Aktif.');
    try {
      // GeoSpatial Index'i garantiye al
      await this.providerModel.collection.createIndex({ location: '2dsphere' });
    } catch (e) {}
  }

  // --- 1. CREATE (YENİ KAYIT) ---
  async create(data: any) {
    try {
      // 1. İsim Temizliği
      const cleanName = (data.firstName || data.businessName || '')
        .replace(/[\(\[\{].*?[\)\]\}]/g, '') // Parantezleri sil
        .trim();

      // 2. Telefon Formatla
      const rawPhone = data.phoneNumber ? String(data.phoneNumber).replace(/\D/g, '') : '';
      const email = data.email || `provider_${rawPhone.slice(-10)}@transporter.app`;

      // 3. Önce User Oluştur (Auth için)
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

      // 4. Koordinatları Ayarla
      let coords: [number, number] = [27.1428, 38.4237]; // Default İzmir
      if (data.location?.coordinates) {
        coords = data.location.coordinates;
      } else if (data.lng && data.lat) {
        coords = [parseFloat(data.lng), parseFloat(data.lat)];
      }

      // 5. Provider Oluştur (İşletme Detayı)
      const providerData = {
        user: user._id,
        businessName: cleanName || 'İsimsiz İşletme',
        phoneNumber: rawPhone,
        website: data.link || '',
        address: {
          fullText: data.address || '',
          city: data.city || 'Bilinmiyor',
          district: data.district || 'Merkez'
        },
        service: {
          mainType: this.mapToEnum(data.serviceType), // ENUM'a çevir
          subType: data.serviceType || 'genel',
          tags: data.filterTags || []
        },
        pricing: {
          openingFee: Number(data.openingFee) || 350,
          pricePerUnit: Number(data.pricePerUnit) || 40
        },
        location: { type: 'Point', coordinates: coords }
      };

      // Upsert: Varsa güncelle, yoksa yarat
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

  // --- 2. READ: AKILLI HARİTA (Smart Map) ---
  async findSmartMapData(lat: number, lng: number, zoomLevel: number = 10) {
    const precision = zoomLevel < 12 ? 1 : 2; 

    return this.providerModel.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          key: 'location',
          distanceField: 'distance',
          maxDistance: 500000, 
          spherical: true
        }
      },
      {
        $group: {
          _id: {
            type: "$service.mainType", // 🔥 Yeni yapı: service.mainType
            gridLat: { $round: [{ $arrayElemAt: ["$location.coordinates", 1] }, precision] },
            gridLng: { $round: [{ $arrayElemAt: ["$location.coordinates", 0] }, precision] }
          },
          doc: { $first: "$$ROOT" } 
        }
      },
      { $replaceRoot: { newRoot: "$doc" } },
      { $sort: { distance: 1 } }
    ]).exec();
  }

  // --- 3. READ: DENGELİ LİSTE (Mixed Feed) ---
  async findDiverseList(lat: number, lng: number, limitPerType: number = 5) {
    return this.providerModel.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          key: 'location',
          distanceField: 'distance',
          maxDistance: 500000,
          spherical: true
        }
      },
      { $sort: { distance: 1 } },
      {
        $group: {
          _id: "$service.mainType", // 🔥 Yeni yapı
          drivers: { $push: "$$ROOT" } 
        }
      },
      { $project: { drivers: { $slice: ["$drivers", limitPerType] } } },
      { $unwind: "$drivers" },
      { $replaceRoot: { newRoot: "$drivers" } },
      { $sort: { distance: 1 } }
    ]).exec();
  }

  // --- 4. READ: STANDART ARAMA (Nearby) ---
  async findNearby(lat: number, lng: number, rawType?: string) {
    const query: any = {};
    
    if (rawType) {
        // Gelen 'kurtarici' isteğini 'KURTARICI' enumuna çeviriyoruz
        const mainType = this.mapToEnum(rawType);
        // Hem ana tip hem alt tip içinde arama yapıyoruz (Esneklik için)
        query.$or = [
            { 'service.mainType': mainType },
            { 'service.subType': rawType }
        ];
    }

    return this.providerModel.find({
      ...query,
      location: { 
        $near: { 
            $geometry: { type: 'Point', coordinates: [lng, lat] }, 
            $maxDistance: 5000000 
        } 
      }
    }).limit(100).lean().exec(); 
  }

  // --- 5. READ: FİLTRELİ LİSTE (Admin/Dashboard) ---
  async findFiltered(city?: string, type?: string) {
    const query: any = {};
    if (city && city !== 'Tümü') query['address.city'] = city; // 🔥 Yeni yapı
    if (type && type !== 'Tümü') query['service.mainType'] = this.mapToEnum(type); // 🔥 Yeni yapı

    return this.providerModel.find(query).sort({ createdAt: -1 }).limit(100).lean().exec();
  }

  // --- 6. UPDATE ---
  async updateOne(id: string, data: any) {
    // İç içe update yaparken veriyi kaybetmemek için dikkatli ol
    return this.providerModel.findByIdAndUpdate(id, data, { new: true });
  }

  // --- 7. DELETE (KULLANICIYI VE PROFİLİ SİL) ---
  async deleteOne(id: string) {
    const provider = await this.providerModel.findById(id);
    if (provider) {
        // Bağlı User'ı da sil
        await this.userModel.findByIdAndDelete(provider.user);
        // Provider'ı sil
        return this.providerModel.findByIdAndDelete(id);
    }
    return null;
  }

  // --- YARDIMCI: ENUM MAPPER ---
  private mapToEnum(type: string): string {
    if (!type) return 'KURTARICI';
    const t = type.toLowerCase();
    if (t.includes('nakli') || t.includes('kamyon') || t.includes('tir') || t.includes('evden')) return 'NAKLIYE';
    if (t.includes('sarj') || t.includes('şarj')) return 'SARJ';
    return 'KURTARICI'; // Default
  }
}