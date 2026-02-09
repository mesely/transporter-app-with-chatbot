import { Controller, Get, Post, Body, Query, UseInterceptors, UploadedFile, Logger, BadRequestException, Delete, Param, Put } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as XLSX from 'xlsx';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  constructor(private readonly usersService: UsersService) {}

  // --- 1. STANDART CRUD İŞLEMLERİ (MEVCUT) ---
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // --- 2. AKILLI HARİTA VE LİSTELEME (GÜNCELLENDİ) ---
  @Get('nearby')
  async findNearby(
    @Query('lat') lat: string, 
    @Query('lng') lng: string, 
    @Query('type') type: string,
    @Query('zoom') zoom: string, // 🔥 YENİ: Harita Zoom Seviyesi
    @Query('mode') mode: string  // 🔥 YENİ: Liste Modu ('list' veya boş)
  ) {
    const latitude = parseFloat(lat || '38.4237');
    const longitude = parseFloat(lng || '27.1428');
    const zoomLevel = zoom ? parseInt(zoom) : 15;

    // A) LİSTE MODU: Sonsuz kaydırma için (ActionPanel)
    // Her türden eşit sayıda (örn: 5) veri getirerek karma bir liste oluşturur.
    if (mode === 'list') {
      return this.usersService.findDiverseList(latitude, longitude, 5);
    }

    // B) AKILLI HARİTA MODU: Zoom seviyesi düşükse (uzaksa)
    // Haritayı ızgaralara böler ve her bölgeden her türden 1 tane getirir.
    if (zoom && zoomLevel < 14) {
      return this.usersService.findSmartMapData(latitude, longitude, zoomLevel);
    }

    // C) STANDART MOD: Yakın zoom veya normal arama (MEVCUT MANTIK)
    const searchType = this.normalizeServiceType(type);
    return this.usersService.findNearby(latitude, longitude, searchType);
  }

  // --- 3. DİĞER ENDPOINTLER (MEVCUT - KORUNDU) ---
  @Get('all')
  async findAllFiltered(@Query('city') city?: string, @Query('type') type?: string) {
    return this.usersService.findFiltered(city, type);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.usersService.updateOne(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.deleteOne(id);
  }

  // --- 4. EXCEL IMPORT (MEVCUT - KORUNDU) ---
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importUsers(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Dosya yok!');
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    let count = 0;
    for (const item of data) {
      const lat = parseFloat(item.lat || item.latitude);
      const lng = parseFloat(item.lng || item.longitude);
      if (lat && lng) {
        try {
          await this.usersService.create({
            ...item,
            serviceType: this.cleanImportType(item.serviceType || item.hizmetTipi),
            filterTags: item.filters ? item.filters.split(',') : [],
            link: item.link || '',
            metadata: item.extra ? JSON.parse(item.extra) : {}
          });
          count++;
        } catch (e) { this.logger.error(`Import Hatası: ${e.message}`); }
      }
    }
    return { status: 'SUCCESS', count };
  }

  // --- 5. YARDIMCI FONKSİYONLAR (MEVCUT - KORUNDU) ---
  private normalizeServiceType(type: string): string {
    if (!type) return '';
    const lower = type.toLowerCase().trim();
    // Frontend'den gelen genel kategorileri Backend'in anlayacağı dile çevirir
    if (lower.includes('yurt') || lower === 'yurt_disi_nakliye') return 'nakliye'; // Servis içinde alt kırılım yapılıyor
    if (lower.includes('şarj') || lower.includes('sarj')) return 'sarj';
    if (lower.includes('vinc') || lower.includes('vinç')) return 'kurtarici';
    if (lower.includes('kurtar')) return 'kurtarici';
    return lower; 
  }

  private cleanImportType(type: string): string {
    if (!type) return 'nakliye';
    const lower = type.toLowerCase();
    if (lower.includes('yurt') || lower.includes('global')) return 'yurt_disi_nakliye';
    if (lower.includes('seyyar')) return 'seyyar_sarj';
    if (lower.includes('istasyon')) return 'sarj_istasyonu';
    if (lower.includes('vinc')) return 'vinc';
    if (lower.includes('kurtar')) return 'kurtarici';
    return 'nakliye';
  }
}