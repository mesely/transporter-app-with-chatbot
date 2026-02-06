import { Controller, Get, Post, Body, Query, UseInterceptors, UploadedFile, Logger } from '@nestjs/common';
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
   * 🗺️ ANA HARİTA VE LİSTE ENDPOINT'İ
   * Frontend: fetchAllData buradan beslenir.
   */
  @Get('nearby')
  async findNearby(
    @Query('lat') lat: string, 
    @Query('lng') lng: string,
    @Query('type') type?: string // Opsiyonel filtre (kurtarici, nakliye vs.)
  ) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Eğer bir kategori tipi seçilmişse ona göre ara, yoksa genel yakındakileri getir.
    if (type) {
      this.logger.log(`🔎 Filtreli Arama: ${type} (Konum: ${latitude}, ${longitude})`);
      return this.usersService.findProvidersByType(type, latitude, longitude);
    }

    this.logger.log(`📍 Genel Arama: (Konum: ${latitude}, ${longitude})`);
    return this.usersService.findNearby(latitude, longitude);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  /**
   * 📊 EXCEL IMPORT MOTORU (Düzeltilmiş ve Güvenli Versiyon)
   */
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importUsers(@UploadedFile() file: Express.Multer.File) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as any[];

    let count = 0;
    for (const item of data) {
      if (item.lat && item.lng && item.firstName) {
        try {
          await this.usersService.create({
            email: item.email || `provider_${Math.floor(Math.random()*100000)}@transporter.app`,
            password: '123',
            role: 'provider',
            firstName: item.firstName,
            lastName: item.lastName || 'Lojistik',
            phoneNumber: item.phoneNumber ? String(item.phoneNumber) : '05555555555',
            serviceType: item.serviceType || 'nakliye',
            address: item.address || '',
            city: item.city || 'Belirsiz',
            routes: item.routes || '',
            rating: item.rating ? parseFloat(item.rating) : 4.5,
            location: { 
              type: 'Point',
              coordinates: [parseFloat(item.lng), parseFloat(item.lat)] // [Boylam, Enlem]
            }
          });
          count++;
        } catch (e) {
          this.logger.error(`Import hatası: ${e.message}`);
        }
      }
    }
    return { status: 'SUCCESS', message: `${count} yeni sağlayıcı sisteme eklendi.` };
  }
}