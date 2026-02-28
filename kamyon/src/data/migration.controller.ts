import { Body, Controller, Post, Res, HttpStatus } from '@nestjs/common';
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

  @Post('import-lastik-google')
  async importLastikGoogle(@Body() body: any, @Res() res) {
    try {
      const result = await this.dataService.importLastikFromGoogle({
        start: body?.start,
        end: body?.end,
        perDistrictLimit: body?.perDistrictLimit,
        dryRun: body?.dryRun,
      });
      return res.status(HttpStatus.OK).json({
        message: 'Google üzerinden lastikçi import işlemi tamamlandı.',
        data: result,
      });
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: error?.message || 'Lastik import işlemi başarısız.',
      });
    }
  }

  @Post('import-yolcu-static')
  async importYolcuStatic(@Res() res) {
    const result = await this.dataService.importStaticYolcuFirms();
    return res.status(HttpStatus.OK).json({
      message: 'Yolcu taşıma firmaları seed işlemi tamamlandı.',
      data: result,
    });
  }
}
