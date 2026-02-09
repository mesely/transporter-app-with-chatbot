import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type TariffDocument = Tariff & Document;

@Schema({ timestamps: true })
export class Tariff {
  @Prop({ required: true, unique: true, index: true })
  serviceType: string; // 'nakliye', 'kurtarici'

  @Prop({ required: true })
  openingFee: number; // Açılış

  @Prop({ required: true })
  pricePerUnit: number; // Km başı ücret

  @Prop({ required: true }) 
  unit: string; // 'km', 'kwh'

  @Prop({ default: 'TL' })
  currency: string;

  // --- YENİ EKLENEN SAĞLAMLAŞTIRMA KOLONLARI ---

  @Prop({ default: 0 })
  minPrice: number; // Minimum ödenecek tutar (İndi-bindi)

  @Prop({ default: 1.0 })
  nightMultiplier: number; // Gece tarifesi çarpanı (örn: 1.5)

  // ESNEK KOLON: Bekleme ücreti, trafik çarpanı vb. buraya atılır.
  // DB'yi bozmadan yeni kural eklemeni sağlar.
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  extraSettings: any; 
}

export const TariffSchema = SchemaFactory.createForClass(Tariff);