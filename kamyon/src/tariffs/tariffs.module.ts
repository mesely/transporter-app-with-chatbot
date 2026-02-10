import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TariffsController } from './tariffs.controller';
import { TariffsService } from './tariffs.service';
import { Tariff, TariffSchema } from './tariff.schema';

@Module({
  imports: [
    // 🔥 ŞEMAYI BURAYA TANITIYORUZ Kİ SERVİS KULLANABİLSİN
    MongooseModule.forFeature([{ name: Tariff.name, schema: TariffSchema }]),
  ],
  controllers: [TariffsController],
  providers: [TariffsService],
  exports: [TariffsService], // Diğer modüller fiyat hesaplamak isterse diye export ettik
})
export class TariffsModule {}