import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type TariffDocument = Tariff & Document;

@Schema({ timestamps: true })
export class Tariff {
  @Prop({ required: true, unique: true, index: true })
  serviceType: string; // 'nakliye', 'kurtarici', 'sarj'

  @Prop({ required: true })
  openingFee: number; // Açılış Ücreti

  @Prop({ required: true })
  pricePerUnit: number; // Km başı ücret

  @Prop({ required: true }) 
  unit: string; // 'km', 'kwh'

  @Prop({ default: 'TL' })
  currency: string;

  // --- GELİŞMİŞ AYARLAR ---

  @Prop({ default: 0 })
  minPrice: number; // Minimum ödenecek tutar (İndi-bindi)

  @Prop({ default: 1.0 })
  nightMultiplier: number; // Gece tarifesi çarpanı (örn: 1.5)

  // Esnek Kolon (Bekleme ücreti, trafik çarpanı vb.)
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  extraSettings: any; 
}

export const TariffSchema = SchemaFactory.createForClass(Tariff);