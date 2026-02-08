import { Controller, Get, Post, Body, Query, UseInterceptors, UploadedFile, Logger, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as XLSX from 'xlsx';
import type { Express } from 'express';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * 🗺️ ANA HARİTA ENDPOINT'İ
   * Zoom out ve filtreleme buradan geçer.
   */
  @Get('nearby')
  async findNearby(
    @Query('lat') lat: string, 
    @Query('lng') lng: string,
    @Query('type') type?: string
  ) {
    if (!lat || !lng) {
      return this.usersService.findNearby(38.4237, 27.1428, type);
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Gelen tipi servise uygun hale getir
    const searchType = this.normalizeServiceType(type);

    // Logu temiz tutmak için çok sık basmayalım
    // this.logger.log(`📍 Arama: ${searchType || 'Tümü'} (${latitude}, ${longitude})`);
    
    return this.usersService.findNearby(latitude, longitude, searchType);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importUsers(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Dosya yüklenmedi!');

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    let count = 0;
    for (const item of data) {
      const lat = parseFloat(item.lat || item.latitude);
      const lng = parseFloat(item.lng || item.longitude);

      if (lat && lng) {
        try {
          await this.usersService.create({
            email: item.email || `provider_${Date.now()}_${Math.floor(Math.random()*1000)}@transporter.app`,
            password: '123',
            role: 'provider',
            firstName: item.firstName || item.isim || 'İsimsiz',
            lastName: item.lastName || item.soyisim || 'Sağlayıcı',
            phoneNumber: item.phoneNumber ? String(item.phoneNumber) : '05555555555',
            serviceType: this.cleanImportType(item.serviceType || item.hizmetTipi),
            address: item.address || '',
            city: item.city || 'Belirsiz',
            rating: item.rating ? parseFloat(item.rating) : 4.5,
            location: { 
              type: 'Point',
              coordinates: [lng, lat] 
            },
            openingFee: item.acilisUcreti,
            pricePerUnit: item.kmUcreti
          });
          count++;
        } catch (e) {
          this.logger.error(`Import Satır Hatası: ${e.message}`);
        }
      }
    }
    return { status: 'SUCCESS', message: `${count} yeni sağlayıcı başarıyla eklendi.` };
  }

  // 🔥 ARAMA İÇİN NORMALİZASYON (Frontend'den gelen isteği düzenler) 🔥
  private normalizeServiceType(type: string): string {
    if (!type) return '';
    const lower = type.toLowerCase().trim();

    // 1. Önce "Yurt Dışı" kontrolü yap (Nakliye kelimesi yüzünden ezilmesin)
    if (lower.includes('yurt') || lower.includes('global') || lower === 'yurt_disi_nakliye') {
        return 'yurt_disi';
    }

    // 2. Şarj
    if (lower.includes('şarj') || lower.includes('sarj')) return 'sarj';
    
    // 3. Vinç ve Kurtarıcı
    if (lower.includes('vinc') || lower.includes('vinç')) return 'vinc';
    if (lower.includes('kurtar')) return 'kurtarici';

    // 4. Nakliye Grubu
    // Spesifik ise spesifik kalsın
    if (lower === 'kamyon') return 'kamyon';
    if (lower === 'kamyonet') return 'kamyonet';
    if (lower === 'tir' || lower === 'tır') return 'tir';
    
    // Genel nakliye veya ticari
    if (lower.includes('nakli')) return 'nakliye';
    if (lower.includes('ticari')) return 'ticari';

    // Hiçbiri değilse (örn: 'seyyar_sarj') olduğu gibi gönder
    return lower; 
  }

  // IMPORT İÇİN TEMİZLİK (Excel'den geleni düzeltir)
  private cleanImportType(type: string): string {
    if (!type) return 'nakliye';
    const lower = type.toLowerCase();
    
    // Import sırasında yurt dışı tespiti (basit kontrol)
    if (lower.includes('uluslar') || lower.includes('yurt') || lower.includes('global')) return 'yurt_disi_nakliye';

    if (lower.includes('seyyar')) return 'seyyar_sarj';
    if (lower.includes('istasyon')) return 'sarj_istasyonu';
    if (lower.includes('kamyonet')) return 'kamyonet';
    if (lower.includes('kamyon')) return 'kamyon';
    if (lower.includes('tır') || lower.includes('tir')) return 'tir';
    if (lower.includes('vinc')) return 'vinc';
    if (lower.includes('kurtar')) return 'kurtarici';
    return 'nakliye';
  }
}