import { Controller, Post, Get, Body, HttpCode, Logger } from '@nestjs/common';
import { DataService } from './data.service';

@Controller('data')
export class DataController {
  private readonly logger = new Logger(DataController.name);

  constructor(private readonly dataService: DataService) {}

  // 1. Manuel veya Toplu Veri Kaydı (Akıllı Ayrıştırıcıdan Geçer)
  // Bu endpoint'e gönderdiğin veriler "Mobil Şarj" düzeltmesinden geçer.
  @Post('save-provider')
  @HttpCode(201)
  async saveProvider(@Body() data: any) {
    // Eğer array gelirse döngüye sok
    if (Array.isArray(data)) {
      let count = 0;
      for (const item of data) {
        await this.dataService.processAndSave(item);
        count++;
      }
      return { status: 'SUCCESS', message: `${count} kurum akıllı analizden geçirilip eklendi.` };
    }
    // Tekil kayıt
    return this.dataService.processAndSave(data);
  }

  // 2. Tüm Türkiye Google Taraması (Tetikleyici)
  @Post('populate-turkey')
  @HttpCode(201)
  async populateTurkey() {
    this.logger.log('🇹🇷 Büyük Türkiye Taraması Başlatılıyor...');
    // Arka planda çalışsın diye await beklemeden response dönebiliriz 
    // veya sonucunu görmek için bekleyebiliriz. Şimdilik bekliyoruz.
    return this.dataService.populateTurkeyData();
  }

  // 3. İstatistikler (Hangi kategoride kaç veri var?)
  @Get('stats')
  async getStats() {
    return this.dataService.getDbStats();
  }

  @Post('fix-categories')
  @HttpCode(200)
  async fixCategories() {
    return this.dataService.fixExistingCategories();
  }
}