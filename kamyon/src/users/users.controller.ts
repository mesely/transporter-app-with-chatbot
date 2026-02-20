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

  // --- 2. ANA ARAMA ENDPOINT'İ ---
  @Get('nearby')
  async findNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('type') type: string,
    @Query('zoom') zoom: string
  ) {
    const latitude = parseFloat(lat) || 38.4237;
    const longitude = parseFloat(lng) || 27.1428;
    const zoomLevel = parseInt(zoom) || 9;
    return this.usersService.findNearby(latitude, longitude, type, zoomLevel);
  }

  // --- 3. TELEFONA GÖRE ARA (by-phone ÖNCE gelmeli, :id endpoint'inden önce) ---
  @Get('by-phone')
  async findByPhone(@Query('phone') phone: string) {
    if (!phone) throw new BadRequestException('phone query parametresi gerekli');
    return this.usersService.findByPhone(phone);
  }

  // --- 4. YÖNETİM PANELİ & FİLTRELEME ---
  @Get('all')
  async findAllFiltered(@Query('city') city?: string, @Query('type') type?: string) {
    if (type === 'seyyar_sarj') {
      return this.usersService.findFiltered(undefined, type);
    }
    return this.usersService.findFiltered(city, type);
  }

  // --- 5. TİP ANALİZİ ---
  @Get('types')
  async getTypes() {
    return this.usersService.getServiceTypes();
  }

  // --- 6. RATING ENDPOINTS ---
  @Post(':id/rate')
  async rateProvider(@Param('id') id: string, @Body() body: any) {
    return this.usersService.addRating(id, body);
  }

  @Get(':id/ratings')
  async getProviderRatings(@Param('id') id: string) {
    return this.usersService.getProviderRatings(id);
  }

  // --- 7. UPDATE ---
  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    if (data.website) {
      data.link = data.website;
    }
    return this.usersService.updateOne(id, data);
  }

  // --- 8. DELETE (Admin) ---
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.deleteOne(id);
  }

  // --- 9. SELF DELETE (Aracımı Listeden Kaldır) ---
  @Delete('self/:id')
  async deleteSelf(@Param('id') id: string) {
    return this.usersService.deleteSelfProvider(id);
  }

  // --- 10. EXCEL IMPORT ---
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importUsers(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Lütfen bir Excel dosyası yükleyin.');

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    let count = 0;
    this.logger.log(`Import Başladı: ${data.length} satır işlenecek.`);

    for (const item of data) {
      const lat = parseFloat(item.lat || item.latitude);
      const lng = parseFloat(item.lng || item.longitude);

      if (!isNaN(lat) && !isNaN(lng)) {
        try {
          await this.usersService.create({
            businessName: item.firstName || item.isletmeAdi || item.businessName || 'Bilinmiyor',
            phoneNumber: item.phoneNumber || item.telefon,
            email: item.email,
            password: item.password || '123456',
            address: item.address || item.adres,
            city: item.city || item.sehir,
            district: item.district || item.ilce,
            serviceType: item.serviceType || item.hizmetTipi || 'KURTARICI',
            filterTags: item.filters ? String(item.filters).split(',') : [],
            link: item.link || item.website,
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
}
