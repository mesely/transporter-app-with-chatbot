import { Controller, Get, Post, Body, Query, UseInterceptors, UploadedFile, Logger, BadRequestException, Delete, Param, Put } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import * as XLSX from 'xlsx';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  // --- 1. OLUŞTURMA (YENİ PROVIDER) ---
  @Post()
  create(@Body() body: any) {
    return this.usersService.create(body);
  }

  // --- 2. ANA ARAMA ENDPOINT'İ (ACTION PANEL & MAP) ---
  @Get('nearby')
  async findNearby(
    @Query('lat') lat: string, 
    @Query('lng') lng: string, 
    @Query('type') type: string,
    @Query('zoom') zoom: string
  ) {
    // Koordinatları güvenli parse et (Default İzmir)
    const latitude = parseFloat(lat) || 38.4237;
    const longitude = parseFloat(lng) || 27.1428;
    // 🔥 FIX: Liste kısıtlamasını aşmak ve geniş alan taramak için varsayılan zoom 9 yapıldı
    const zoomLevel = parseInt(zoom) || 9; 

    // Gezici Şarj / Mobil Şarj için servis içinde 'all' mantığı çalıştırılır
    return this.usersService.findNearby(latitude, longitude, type, zoomLevel);
  }

  // --- 3. YÖNETİM PANELİ & FİLTRELEME ---
  @Get('all')
  async findAllFiltered(@Query('city') city?: string, @Query('type') type?: string) {
    // 🔥 FIX: Mobil Şarj ise şehir filtresini tamamen devre dışı bırakıp tümünü getir
    if (type === 'seyyar_sarj') {
      return this.usersService.findFiltered(undefined, type);
    }
    return this.usersService.findFiltered(city, type);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    // 🔥 FIX: Frontend 'website' gönderirse veritabanındaki 'link' sütununa eşle
    if (data.website) {
      data.link = data.website;
    }
    return this.usersService.updateOne(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.deleteOne(id);
  }

  // --- 4. EXCEL IMPORT (TOPLU VERİ YÜKLEME) ---
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importUsers(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Lütfen bir Excel dosyası yükleyin.');
    
    // Buffer'dan Excel oku
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    let count = 0;
    this.logger.log(`Import Başladı: ${data.length} satır işlenecek.`);

    for (const item of data) {
      const lat = parseFloat(item.lat || item.latitude);
      const lng = parseFloat(item.lng || item.longitude);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        try {
          // create fonksiyonu veriyi otomatik düzenleyip kaydedecek
          await this.usersService.create({
            businessName: item.firstName || item.isletmeAdi || item.businessName || 'Bilinmiyor',
            phoneNumber: item.phoneNumber || item.telefon,
            email: item.email,
            password: item.password || '123456',
            
            address: item.address || item.adres,
            city: item.city || item.sehir,
            district: item.district || item.ilce,
            
            // Backend'de mapping var, o yüzden raw veriyi gönderiyoruz
            serviceType: item.serviceType || item.hizmetTipi || 'KURTARICI',
            filterTags: item.filters ? String(item.filters).split(',') : [],
            link: item.link || item.website, // 🟢 LİNK BURADA EKLİ
            
            lat: lat,
            lng: lng,
            openingFee: item.openingFee,
            pricePerUnit: item.pricePerUnit
          });
          count++;
        } catch (e) { 
          this.logger.error(`Satır Hatası (${item.businessName}): ${e.message}`); 
        }
      }
    }
    
    this.logger.log(`Import Tamamlandı. ${count} kayıt eklendi.`);
    return { status: 'SUCCESS', message: `${count} adet kayıt başarıyla içeri aktarıldı.` };
  }

  // --- 5. TİP ANALİZİ (DEBUG İÇİN) ---
  @Get('types')
  async getTypes() {
    return this.usersService.getServiceTypes();
  }
}