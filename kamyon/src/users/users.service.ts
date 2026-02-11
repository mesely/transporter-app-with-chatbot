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
         // Gelen veriye göre MainType'ı belirle
         const t = data.serviceType.toUpperCase();
         if (['NAKLIYE', 'SARJ', 'KURTARICI'].includes(t)) mainType = t;
         // Alt tiplerden ana tip çıkarma
         else if (['TIR', 'KAMYON', 'KAMYONET', 'YURT_DISI'].includes(t)) mainType = 'NAKLIYE';
         else if (['OTO_KURTARMA', 'VINC'].includes(t)) mainType = 'KURTARICI';
         else if (['ISTASYON', 'SEYYAR_SARJ', 'MOBIL_UNIT'].includes(t)) mainType = 'SARJ';
      }

      // DB'ye 'seyyar_sarj' olarak kaydediyoruz (Frontend ile uyumlu olsun diye)
      // Eğer DB'de MOBIL_UNIT kullanıyorsan burayı değiştirebilirsin.
      const subTypeToSave = data.serviceType === 'MOBIL_UNIT' ? 'seyyar_sarj' : (data.serviceType || 'genel');

      return this.providerModel.findOneAndUpdate(
        { user: user._id },
        {
          user: user._id,
          businessName: cleanName || 'İsimsiz İşletme',
          phoneNumber: rawPhone,
          address: { fullText: data.address || '', city: data.city || 'Bilinmiyor', district: data.district || 'Merkez' },
          service: {
            mainType: mainType,
            subType: subTypeToSave, 
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
        // Eğer kullanıcı sadece 'nakliye' butonuna bastıysa, tüm nakliye araçlarını getir.
        if (type === 'nakliye') query['service.mainType'] = 'NAKLIYE';
        else if (type === 'kurtarici') query['service.mainType'] = 'KURTARICI';
        else if (type === 'sarj') query['service.mainType'] = 'SARJ';

        // B) ÖZEL MAPPING (Frontend'deki isim DB'den farklıysa veya özel durumlar)
        else if (type === 'sarj_istasyonu') query['service.subType'] = 'istasyon';
        else if (type === 'seyyar_sarj') {
             // Hem 'seyyar_sarj' hem de eski veri kalıntısı varsa 'MOBIL_UNIT' ara
             query['service.subType'] = { $in: ['seyyar_sarj', 'MOBIL_UNIT'] };
        }
        else if (type === 'yurt_disi') query['service.subType'] = 'yurt_disi_nakliye';

        // C) DİREKT EŞLEŞENLER (Tır, Kamyon, Vinç vb.)
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

  // --- 3. DİĞER FONKSİYONLAR (HATA VERENLER BURADA EKLENDİ) ---

  // Listeleme için (Zoom yoksa varsayılan yakınlık)
  async findDiverseList(lat: number, lng: number) {
      return this.findNearby(lat, lng, '', 13);
  }

  // Yönetim Paneli Filtreleme
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

  // 🔥 EKSİK OLAN 1: UPDATE ONE
  async updateOne(id: string, data: any) { 
      return this.providerModel.findByIdAndUpdate(id, data, { new: true }).exec(); 
  }
  
  // 🔥 EKSİK OLAN 2: DELETE ONE
  async deleteOne(id: string) { 
      return this.providerModel.findByIdAndDelete(id).exec(); 
  }

  // 🔥 EKSİK OLAN 3: GET SERVICE TYPES (İstatistik/Debug için)
  async getServiceTypes() {
    return this.providerModel.aggregate([{
        $group: { _id: "$service.mainType", count: { $sum: 1 } }
    }]).exec();
  }
}