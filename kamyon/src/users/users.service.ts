import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { NewUser, NewUserDocument } from '../data/schemas/new-user.schema';
import { NewProvider, NewProviderDocument } from '../data/schemas/new-provider.schema';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);
  private readonly STOP_WORDS = new Set([
    've', 'veya', 'ile', 'icin', 'için', 'gibi', 'olan', 'olanlar', 'en', 'yakın', 'yakin',
    'var', 'mi', 'mı', 'mu', 'mü', 'km', 'kac', 'kaç', 'bana', 'bir', 'bu', 'su', 'şu',
    'oto', 'arac', 'araç', 'cekici', 'çekici', 'fiyat', 'hesapla'
  ]);

  constructor(
    @InjectModel(NewUser.name) private userModel: Model<NewUserDocument>,
    @InjectModel(NewProvider.name) private providerModel: Model<NewProviderDocument>,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 Transporter V12 (Full Service): Sistem Hazır.');
    try {
      await this.providerModel.collection.createIndex({ location: '2dsphere' });
      this.logger.log('✅ Konum indeksi doğrulandı.');
    } catch (e) {
      this.logger.error('Index hatası (zaten varsa sorun yok):', e);
    }
  }

  private buildServiceFilter(rawType: string) {
    const filterQuery: any = {};
    if (!rawType) return filterQuery;

    const type = rawType.toLowerCase().trim();
    if (!type) return filterQuery;

    if (type === 'nakliye') filterQuery['service.mainType'] = 'NAKLIYE';
    else if (type === 'kurtarici') filterQuery['service.mainType'] = 'KURTARICI';
    else if (type === 'sarj') filterQuery['service.mainType'] = 'SARJ';
    else if (type === 'yolcu') filterQuery['service.mainType'] = 'YOLCU';
    else if (type === 'sarj_istasyonu') filterQuery['service.subType'] = 'istasyon';
    else if (type === 'seyyar_sarj') filterQuery['service.subType'] = { $in: ['seyyar_sarj', 'MOBIL_UNIT'] };
    else filterQuery['service.subType'] = type;

    return filterQuery;
  }

  private distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const earth = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earth * c;
  }

  private normalize(value: string): string {
    return (value || '')
      .toLocaleLowerCase('tr')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // --- 1. CREATE VEYA UPDATE ---
  async create(data: any) {
    try {
      const cleanName = (data.firstName || data.businessName || '').trim();
      const rawPhone = data.phoneNumber ? String(data.phoneNumber).replace(/\D/g, '') : '';
      const email = data.email || `provider_${rawPhone.slice(-10)}@transporter.app`;

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
        await this.userModel.updateOne(
          { _id: user._id },
          { $set: { link: data.website || data.link } }
        );
      }

      let coords: [number, number] = [35.6667, 39.1667];
      if (data.lng && data.lat) {
        coords = [parseFloat(data.lng), parseFloat(data.lat)];
      } else if (data.location?.coordinates && Array.isArray(data.location.coordinates) && data.location.coordinates.length === 2) {
        coords = [parseFloat(data.location.coordinates[0]), parseFloat(data.location.coordinates[1])];
      }

      let mainType = 'KURTARICI';
      if (data.serviceType || data.service?.subType) {
        const t = (data.service?.subType || data.serviceType).toUpperCase();
        if (['NAKLIYE', 'SARJ', 'KURTARICI', 'YOLCU'].includes(t)) mainType = t;
        else if (['TIR', 'KAMYON', 'KAMYONET', 'YURT_DISI_NAKLIYE', 'EVDEN_EVE'].includes(t)) mainType = 'NAKLIYE';
        else if (['OTO_KURTARMA', 'VINC'].includes(t)) mainType = 'KURTARICI';
        else if (['ISTASYON', 'SEYYAR_SARJ', 'MOBIL_UNIT'].includes(t)) mainType = 'SARJ';
        else if (['YOLCU_TASIMA', 'MINIBUS', 'OTOBUS', 'MIDIBUS', 'VIP_TASIMA'].includes(t)) mainType = 'YOLCU';
      }

      const subTypeToSave = data.serviceType === 'MOBIL_UNIT' ? 'seyyar_sarj' : (data.serviceType || data.service?.subType || 'genel');
      const fullTextAddress = typeof data.address === 'string' ? data.address : (data.address?.fullText || '');

      const updatePayload: any = {
        user: user._id,
        businessName: cleanName || 'İsimsiz İşletme',
        phoneNumber: rawPhone,
        address: {
          fullText: fullTextAddress,
          city: data.city || data.address?.city || 'Bilinmiyor',
          district: data.district || data.address?.district || 'Merkez'
        },
        service: {
          mainType,
          subType: subTypeToSave,
          tags: data.filterTags || data.service?.tags || []
        },
        pricing: {
          openingFee: 0,
          pricePerUnit: Number(data.pricePerUnit || data.pricing?.pricePerUnit) || 40
        },
        location: {
          type: 'Point',
          coordinates: coords
        },
        link: data.website || data.link || '',
        website: data.website || data.link || '',
        rating: 5.0,
        isVerified: Boolean(data.isVerified),
        vehicleInfo: (data.vehicleInfo || '').trim(),
        vehiclePhotos: Array.isArray(data.vehiclePhotos) ? data.vehiclePhotos : [],
        vehicleItems: Array.isArray(data.vehicleItems) ? data.vehicleItems : [],
        taxNumber: (data.taxNumber || '').trim(),
      };

      if (data.photoUrl) {
        updatePayload.photoUrl = data.photoUrl;
        if (!updatePayload.vehiclePhotos.length) {
          updatePayload.vehiclePhotos = [data.photoUrl];
        }
      }

      return this.providerModel.findOneAndUpdate(
        { user: user._id },
        updatePayload,
        { upsert: true, new: true }
      );
    } catch (e) {
      this.logger.error("Kullanıcı oluşturulurken hata:", e);
      return null;
    }
  }

  // --- 2. FIND NEARBY ---
  async findNearby(
    lat: number,
    lng: number,
    rawType: string,
    zoom: number,
    viewport?: { minLat: number; minLng: number; maxLat: number; maxLng: number },
    requestedLimit?: number
  ) {
    const safeZoom = zoom ? Number(zoom) : 15;
    let maxDist = 500000;
    let limit = 200;

    if (safeZoom < 8) { maxDist = 20000000; limit = 1800; }
    else if (safeZoom < 11) { maxDist = 2000000; limit = 800; }
    else { maxDist = 150000; limit = 300; }

    if (typeof requestedLimit === 'number' && Number.isFinite(requestedLimit)) {
      const normalizedLimit = Math.max(20, Math.min(2000, Math.floor(requestedLimit)));
      limit = Math.min(limit, normalizedLimit);
    }

    const filterQuery: any = this.buildServiceFilter(rawType);
    if (
      viewport &&
      Number.isFinite(viewport.minLat) &&
      Number.isFinite(viewport.minLng) &&
      Number.isFinite(viewport.maxLat) &&
      Number.isFinite(viewport.maxLng)
    ) {
      const minLat = Math.min(viewport.minLat, viewport.maxLat);
      const maxLat = Math.max(viewport.minLat, viewport.maxLat);
      const minLng = Math.min(viewport.minLng, viewport.maxLng);
      const maxLng = Math.max(viewport.minLng, viewport.maxLng);

      filterQuery.location = {
        $geoWithin: {
          $box: [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
        },
      };

      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      const cornerDistance = this.distanceMeters(centerLat, centerLng, maxLat, maxLng);
      maxDist = Math.max(8000, Math.min(Math.ceil(cornerDistance * 1.2), 20000000));
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
          ratingCount: 1,
          reportCount: 1,
          isVerified: 1,
          updatedAt: 1,
          photoUrl: 1,
          vehiclePhotos: 1,
          vehicleInfo: 1,
          vehicleItems: 1,
          taxNumber: 1,
          distance: 1,
          link: 1,
          website: 1
        }
      }
    ]).exec();
  }

  // --- 3. ADD RATING ---
  async addRating(providerId: string, data: { rating: number; comment?: string; tags?: string[]; orderId?: string }) {
    const ratingEntry = {
      rating: data.rating,
      comment: data.comment || '',
      tags: data.tags || [],
      orderId: data.orderId,
      createdAt: new Date(),
    };

    const provider = await this.providerModel.findByIdAndUpdate(
      providerId,
      {
        $push: { ratings: { $each: [ratingEntry], $slice: -50 } },
        $inc: { ratingCount: 1 }
      },
      { new: true }
    ).exec();

    if (provider && (provider as any).ratings && (provider as any).ratings.length > 0) {
      const arr: any[] = (provider as any).ratings;
      const avg = arr.reduce((sum: number, r: any) => sum + r.rating, 0) / arr.length;
      await this.providerModel.findByIdAndUpdate(providerId, { rating: parseFloat(avg.toFixed(1)) }).exec();
    }

    return { success: true };
  }

  // --- 4. GET PROVIDER RATINGS ---
  async getProviderRatings(providerId: string) {
    const provider = await this.providerModel.findById(providerId).select('ratings ratingCount rating').exec();
    if (!provider) return { ratings: [], ratingCount: 0, rating: 5.0 };
    return {
      ratings: (provider as any).ratings || [],
      ratingCount: (provider as any).ratingCount || 0,
      rating: (provider as any).rating || 5.0,
    };
  }

  // --- 5. FIND BY PHONE ---
  async findByPhone(phone: string) {
    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
    if (!cleanPhone) return null;
    return this.providerModel.findOne({ phoneNumber: cleanPhone }).exec();
  }

  // --- 6. DELETE SELF (Aracımı Listeden Kaldır) ---
  async deleteSelfProvider(id: string) {
    return this.providerModel.findByIdAndDelete(id).exec();
  }

  // --- 7. OTHER FUNCTIONS ---
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

  async searchByText(
    rawQuery: string,
    rawType: string,
    lat?: number,
    lng?: number,
    requestedLimit?: number
  ) {
    const query = this.normalize(rawQuery);
    const tokens = query
      .split(' ')
      .map((t) => t.trim())
      .filter((t) => t.length >= 3 && !this.STOP_WORDS.has(t))
      .slice(0, 6);

    const serviceFilter = this.buildServiceFilter(rawType);
    const regexes = tokens.map((t) => new RegExp(t, 'i'));

    const textFilter: any = regexes.length > 0
      ? {
          $or: [
            { businessName: { $in: regexes } },
            { 'address.city': { $in: regexes } },
            { 'address.district': { $in: regexes } },
            { 'address.fullText': { $in: regexes } },
            { 'service.subType': { $in: regexes } },
            { 'service.tags': { $in: regexes } },
          ],
        }
      : {};

    const filter = { ...serviceFilter, ...textFilter };
    const limit = Math.max(5, Math.min(Number(requestedLimit || 50), 200));
    const results = await this.providerModel
      .find(filter)
      .sort({ rating: -1, updatedAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return results;
    }

    return results
      .map((provider: any) => {
        const pLat = provider?.location?.coordinates?.[1];
        const pLng = provider?.location?.coordinates?.[0];
        const distance =
          Number.isFinite(pLat) && Number.isFinite(pLng)
            ? this.distanceMeters(lat as number, lng as number, Number(pLat), Number(pLng))
            : Number.MAX_SAFE_INTEGER;
        return { ...provider, distance };
      })
      .sort((a, b) => Number(a.distance || 0) - Number(b.distance || 0));
  }

  async updateOne(id: string, data: any) {
    const existing = await this.providerModel.findById(id).exec();
    if (!existing) return null;

    const rawSubType = (data.serviceType || data.service?.subType || existing.service?.subType || '').toLowerCase().trim();
    let mainType = (data.service?.mainType || data.mainType || existing.service?.mainType || 'KURTARICI').toUpperCase();

    if (['oto_kurtarma', 'vinc'].includes(rawSubType)) mainType = 'KURTARICI';
    else if (['istasyon', 'seyyar_sarj', 'mobil_unit'].includes(rawSubType)) mainType = 'SARJ';
    else if (['yolcu_tasima', 'minibus', 'otobus', 'midibus', 'vip_tasima', 'yolcu'].includes(rawSubType)) mainType = 'YOLCU';
    else if (['yurt_disi_nakliye'].includes(rawSubType)) mainType = 'YURT_DISI';
    else if (['kamyon', 'tir', 'kamyonet', 'evden_eve', 'nakliye'].includes(rawSubType)) mainType = 'NAKLIYE';

    let coordinates = existing.location?.coordinates || [35.6667, 39.1667];
    if (Array.isArray(data.location?.coordinates) && data.location.coordinates.length === 2) {
      coordinates = [Number(data.location.coordinates[0]), Number(data.location.coordinates[1])];
    } else if (data.lng !== undefined && data.lat !== undefined) {
      coordinates = [Number(data.lng), Number(data.lat)];
    }

    const existingAddress = existing.address || ({} as any);
    const fullTextAddress = typeof data.address === 'string'
      ? data.address
      : (data.address?.fullText || existingAddress.fullText || '');
    const address = {
      fullText: fullTextAddress,
      city: data.city || data.address?.city || existingAddress.city || 'Bilinmiyor',
      district: data.district || data.address?.district || existingAddress.district || 'Merkez',
    };

    const cleanVehicleItems = Array.isArray(data.vehicleItems)
      ? data.vehicleItems
          .map((v: any) => ({
            name: String(v?.name || '').trim(),
            photoUrls: Array.isArray(v?.photoUrls) ? v.photoUrls.filter(Boolean) : [],
          }))
          .filter((v: any) => v.name || v.photoUrls.length > 0)
      : (existing.vehicleItems || []);

    const cleanVehiclePhotos = Array.isArray(data.vehiclePhotos)
      ? data.vehiclePhotos.filter(Boolean)
      : (existing.vehiclePhotos || []);

    const updatePayload: any = {
      businessName: (data.firstName || data.businessName || existing.businessName || '').trim(),
      phoneNumber: data.phoneNumber ? String(data.phoneNumber).replace(/\D/g, '') : existing.phoneNumber,
      address,
      service: {
        mainType,
        subType: rawSubType || existing.service?.subType || 'genel',
        tags: data.filterTags || data.service?.tags || existing.service?.tags || [],
      },
      pricing: {
        openingFee: 0,
        pricePerUnit: Number(data.pricePerUnit ?? data.pricing?.pricePerUnit ?? existing.pricing?.pricePerUnit ?? 40),
      },
      location: { type: 'Point', coordinates },
      website: data.website || data.link || existing.website || existing.link || '',
      link: data.website || data.link || existing.link || existing.website || '',
      isVerified: typeof data.isVerified === 'boolean' ? data.isVerified : existing.isVerified,
      taxNumber: typeof data.taxNumber === 'string' ? data.taxNumber.trim() : (existing.taxNumber || ''),
      vehicleItems: cleanVehicleItems,
      vehiclePhotos: cleanVehiclePhotos,
      vehicleInfo: typeof data.vehicleInfo === 'string'
        ? data.vehicleInfo.trim()
        : (cleanVehicleItems.map((v: any) => v.name).filter(Boolean).join(', ') || existing.vehicleInfo || ''),
    };

    const fallbackPhoto = cleanVehiclePhotos[0] || cleanVehicleItems.find((v: any) => v.photoUrls?.length > 0)?.photoUrls?.[0] || '';
    updatePayload.photoUrl = data.photoUrl || existing.photoUrl || fallbackPhoto;

    return this.providerModel.findByIdAndUpdate(id, updatePayload, { new: true }).exec();
  }

  async deleteOne(id: string) {
    return this.providerModel.findByIdAndDelete(id).exec();
  }

  async getServiceTypes() {
    return this.providerModel.aggregate([{ $group: { _id: "$service.mainType", count: { $sum: 1 } } }]).exec();
  }
}
