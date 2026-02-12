import { Controller, Post, Res, HttpStatus } from '@nestjs/common';
import { DataService } from './data.service';

@Controller('admin/migration')
export class MigrationController {
  constructor(private readonly dataService: DataService) {}

  @Post('radical')
  async runRadicalMigration(@Res() res) {
    const result = await this.dataService.radicalMigration();
    return res.status(HttpStatus.OK).json({
      message: 'Radikal migrasyon tamamlandı.',
      data: result
    });
  }

  // 🔥 YENİ EKLENEN FIX ENDPOINT'I
  @Post('fix-nakliye')
  async fixNakliye(@Res() res) {
    const result = await this.dataService.fixNakliyeToEvdenEve();
    return res.status(HttpStatus.OK).json({
      message: 'Nakliye -> Evden Eve dönüşümü tamamlandı.',
      data: result
    });
  }
}