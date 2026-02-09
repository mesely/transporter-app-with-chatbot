import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CustomerDocument = Customer & Document;

@Schema({ timestamps: true }) // created_at ve updated_at otomatik oluşur
export class Customer {
  // Telefon numarası benzersiz (Unique) olmalı. Müşteriyi bununla tanıyacağız.
  @Prop({ required: true, unique: true, index: true })
  phoneNumber: string;

  @Prop({ default: 'Misafir' })
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  email: string;

  @Prop()
  city: string;

  @Prop({ default: true })
  termsAccepted: boolean; // Sözleşme onayı

  // Bildirim göndermek için (OneSignal / Firebase Token)
  @Prop()
  deviceToken: string;

  // Müşterinin toplam işlem sayısı (Analiz için)
  @Prop({ default: 0 })
  orderCount: number;

  // Müşterinin kara listede olup olmadığı
  @Prop({ default: false })
  isBanned: boolean;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);