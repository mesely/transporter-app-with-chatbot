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
    // GeoSpatial Index oluşturmak çok önemli (Konum araması için)
    try { 
      await this.providerModel.collection.createIndex({ location: '2dsphere' }); 
    } catch (e) {
      this.logger.error('Index hatası (zaten varsa sorun yok):', e);
    }
  }

  // --- 1. CREATE (YENİ SÜRÜCÜ EKLEME) ---
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

      // Koordinat kontrolü (Önce GeoJSON, sonra lat/lng)
      let coords: [number, number] = [35.6667, 39.1667]; // Default Türkiye Ortası
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
          businessName: cleanName || 'İsimsiz İşletme',
          phoneNumber: rawPhone,
          address: { fullText: data.address || '', city: data.city || 'Bilinmiyor', district: data.district || 'Merkez' },
          service: {
            mainType: mainType,
            subType: data.serviceType || 'genel', // Örn: 'tir', 'vinc', 'MOBIL_UNIT'
            tags: data.filterTags || [] // Örn: ['tenteli', 'lowbed']
          },
          pricing: { openingFee: Number(data.openingFee) || 350, pricePerUnit: Number(data.pricePerUnit) || 40 },
          location: { type: 'Point', coordinates: coords },
          rating: 5.0 // Varsayılan puan
        },
        { upsert: true, new: true }
      );
    } catch (e) { return null; }
  }

  // --- 2. FIND NEARBY (ANA ARAMA MOTORU) ---
  // Frontend'den gelen 'type' ve 'zoom' verisine göre akıllı filtreleme yapar.
  async findNearby(lat: number, lng: number, rawType: string, zoom: number) {
    const safeZoom = zoom ? Number(zoom) : 15;
    
    // Zoom seviyesine göre arama yarıçapını ve limiti ayarla
    let maxDist = 500000; // Varsayılan: 500km
    let limit = 200;

    if (safeZoom < 8) {
        // Çok uzak (Tüm Ülke Görünümü): Çok geniş alan, çok veri
        maxDist = 20000000; // 20.000 km (Tüm Dünya/Ülke)
        limit = 3000; 
    } else if (safeZoom < 11) {
        // Şehirler arası görünüm
        maxDist = 2000000; // 2.000 km
        limit = 1000;
    } else {
        // Sokak/Mahalle görünümü
        maxDist = 100000; // 100 km
        limit = 200;
    }

    // Temel Konum Sorgusu ($near)
    const query: any = {
        location: {
            $near: {
                $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
                $maxDistance: maxDist
            }
        }
    };

    // FİLTRELEME MANTIĞI (Frontend actionType -> DB Eşleştirmesi)
    if (rawType && rawType !== '') {
        const type = rawType.toLowerCase().trim();

        // A) ANA KATEGORİLER (Genel Arama)
        if (type === 'nakliye') {
             query['service.mainType'] = 'NAKLIYE';
        }
        else if (type === 'kurtarici') {
             query['service.mainType'] = 'KURTARICI';
        }
        else if (type === 'sarj') {
             query['service.mainType'] = 'SARJ';
        }

        // B) ÖZEL MAPPING (Frontend'deki isim DB'den farklıysa)
        else if (type === 'sarj_istasyonu') {
             query['service.subType'] = 'istasyon';
        }
        else if (type === 'seyyar_sarj') {
             query['service.subType'] = 'MOBIL_UNIT';
        }
        else if (type === 'yurt_disi') {
             query['service.subType'] = 'yurt_disi_nakliye';
        }

        // C) DİREKT EŞLEŞENLER
        // 'tir', 'kamyon', 'kamyonet', 'vinc', 'oto_kurtarma', 'evden_eve'
        else {
             query['service.subType'] = type;
        }
    }

    // Veriyi Çek ve Döndür
    return this.providerModel.find(query)
        .select('businessName location service pricing address phoneNumber rating') // Sadece lazım olanları al
        .limit(limit)
        .lean() // Performans için lean() kullanıyoruz
        .exec();
  }

  // --- 3. DİĞER YARDIMCI FONKSİYONLAR ---

  // Listeleme için (Zoom yoksa varsayılan yakınlık)
  async findDiverseList(lat: number, lng: number) {
      return this.findNearby(lat, lng, '', 13);
  }

  // Yönetim Paneli vb. için Manuel Filtreleme
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
}