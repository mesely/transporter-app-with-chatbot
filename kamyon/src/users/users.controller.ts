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

    // DÜZELTME: Gelen tipi çok sert değiştirmeden servise iletiyoruz.
    const searchType = this.normalizeServiceType(type);

    this.logger.log(`📍 Arama: ${searchType || 'Tümü'} (${latitude}, ${longitude})`);
    
    return this.usersService.findNearby(latitude, longitude, searchType);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // Güvenlik için migration kodunu buradan kaldırdık (Artık işi bitti)

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
      // Koordinat kontrolü (lat/lng veya latitude/longitude)
      const lat = parseFloat(item.lat || item.latitude);
      const lng = parseFloat(item.lng || item.longitude);

      if (lat && lng) {
        try {
          await this.usersService.create({
            email: item.email || `provider_${Date.now()}_${Ma