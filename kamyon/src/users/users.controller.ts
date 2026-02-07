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
   */
  @Get('nearby')
  async findNearby(
    @Query('lat') lat: string, 
    @Query('lng') lng: string,
    @Query('type') type?: string
  ) {
    if (!lat || !lng) {
      // Varsayılan İzmir konumu
      return this.usersService.findNearby(38.4237, 27.1428, type);
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    this.logger.log(`📍 Arama: ${type || 'Tümü'} (${latitude}, ${longitude})`);
    
    return this.usersService.findNearby(latitude, longitude, type);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  /**
   * 🛠️ DATABASE FIX ENDPOINT
   * Artık doğrudan servisi çağırıyor, hata vermez.
   */
  @Get('fix-database')
  async fixDatabase() {
    return this.usersService.migrateIsActiveField();
  }

  /**
   * 📊 EXCEL IMPORT MOTORU
   */
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
      if ((item.lat && item.lng) || (item.latitude && item.longitude)) {
        try {
          await this.usersService.create({
            email: item.email || `provider_${Date.now()}_${Math.floor(Math.random()*1000)}@transporter.app`,
            password: '123',
            role: 'provider',
            firstName: item.firstName || item.isim || 'İsimsiz',
            lastName: item.lastName || item.soyisim || 'Sağlayıcı',
            phoneNumber: item.phoneNumber ? String(item.phoneNumber) : '05555555555',
            serviceType: this.normalizeServiceType(item.serviceType || item.hizmetTipi),
            address: item.address || '',
            city: item.city || 'Belirsiz',
            rating: item.rating ? parseFloat(item.rating) : 4.5,
            location: { 
              type: 'Point',
              coordinates: [
                parseFloat(item.lng || item.longitude), 
                parseFloat(item.lat || item.latitude)
              ] 
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

  private normalizeServiceType(type: string): string {
    if (!type) return 'nakliye';
    const lower = type.toLowerCase();
    if (lower.includes('kurtar')) return 'kurtarici';
    if (lower.includes('vinç') || lower.includes('vinc')) return 'vinc';
    if (lower.includes('şarj') || lower.includes('sarj')) return 'sarj_istasyonu';
    if (lower.includes('kamyon')) return 'kamyon';
    if (lower.includes('tır') || lower.includes('tir')) return 'tir';
    return 'nakliye';
  }
}