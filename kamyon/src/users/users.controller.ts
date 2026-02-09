import { Controller, Get, Post, Body, Query, UseInterceptors, UploadedFile, Logger, BadRequestException, Delete, Param, Put } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as XLSX from 'xlsx';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  // --- 1. KULLANICI OLUŞTURMA (TEKİL) ---
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // --- 2. AKILLI HARİTA & LİSTELEME ENDPOINT'İ ---
  @Get('nearby')
  async findNearby(
    @Query('lat') lat: string, 
    @Query('lng') lng: string, 
    @Query('type') type: string,
    @Query('zoom') zoom: string, // Harita uzaklık seviyesi
    @Query('mode') mode: string  // 'list' ise karma liste döner
  ) {
    // Varsayılan Koordinatlar (Veri gelmezse çökmemesi için)
    const latitude = parseFloat(lat || '38.4237');
    const longitude = parseFloat(lng || '27.1428');
    const zoomLevel = zoom ? parseInt(zoom) : 15;

    // A) LİSTE MODU (ActionPanel - Infinite Scroll)
    // Listeyi kaydırırken sadece kamyonlar doluşmasın diye her türden 5'er tane getirir.
    if (mode === 'list') {
      return this.usersService.findDiverseList(latitude, longitude, 5);
    }

    // B) AKILLI HARİTA MODU (Zoom Out yapınca)
    // Zoom seviyesi 14'ten küçükse (uzaksa), haritayı karelere böler ve her kareden 1 temsilci getirir.
    if (zoom && zoomLevel < 14) {
      return this.usersService.findSmartMapData(latitude, longitude, zoomLevel);
    }

    // C) STANDART MOD (Zoom In yapınca veya Filtre seçince)
    // Yakındayken veya özel bir tür (örn: 'vinç') seçiliyken normal arama yapar.
    const searchType = this.normalizeServiceType(type);
    return this.usersService.findNearby(latitude, longitude, searchType);
  }

  // --- 3. DİĞER STANDART ENDPOINTLER (MEVCUT) ---
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

  // --- 4. EXCEL IMPORT (MEVCUT) ---
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

  // --- 5. YARDIMCI FONKSİYONLAR ---
  private normalizeServiceType(type: string): string {
    if (!type) return '';
    const lower = type.toLowerCase().trim();
    if (lower.includes('yurt') || lower === 'yurt_disi_nakliye') return 'nakliye';
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