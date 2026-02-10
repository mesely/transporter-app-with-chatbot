import { Controller, Get, Post, Body, Query, UseInterceptors, UploadedFile, Logger, BadRequestException, Delete, Param, Put } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import * as XLSX from 'xlsx';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  // --- 1. OLUŞTURMA ---
  @Post()
  create(@Body() body: any) {
    return this.usersService.create(body);
  }

  // --- 2. AKILLI HARİTA & LİSTELEME ---
  @Get('nearby')
  async findNearby(
    @Query('lat') lat: string, 
    @Query('lng') lng: string, 
    @Query('type') type: string,
    @Query('zoom') zoom: string,
    @Query('mode') mode: string 
  ) {
    const latitude = parseFloat(lat || '38.4237');
    const longitude = parseFloat(lng || '27.1428');
    const zoomLevel = zoom ? parseInt(zoom) : 15;

    // A) LİSTE MODU (Karışık Feed)
    if (mode === 'list') {
      return this.usersService.findDiverseList(latitude, longitude, 5);
    }

    // B) AKILLI HARİTA (Uzak Zoom)
    if (zoom && zoomLevel < 13) {
      return this.usersService.findSmartMapData(latitude, longitude, zoomLevel);
    }

    // C) YAKIN ARAMA
    return this.usersService.findNearby(latitude, longitude, type);
  }

  // --- 3. FİLTRELEME & YÖNETİM ---
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

  // --- 4. EXCEL IMPORT (YENİ YAPIYA UYGUN) ---
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
            businessName: item.firstName || item.isletmeAdi || item.businessName, // İsim mapping
            phoneNumber: item.phoneNumber || item.telefon,
            email: item.email,
            address: item.address || item.adres,
            city: item.city || item.sehir,
            district: item.district || item.ilce,
            serviceType: item.serviceType || item.hizmetTipi, // create metodunda ENUM'a çevrilecek
            filterTags: item.filters ? item.filters.split(',') : [],
            link: item.link || item.website,
            lat: lat,
            lng: lng,
            openingFee: item.openingFee,
            pricePerUnit: item.pricePerUnit
          });
          count++;
        } catch (e) { this.logger.error(`Import Hatası: ${e.message}`); }
      }
    }
    return { status: 'SUCCESS', count };
  }
}