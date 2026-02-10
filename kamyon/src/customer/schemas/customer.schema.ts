import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CustomerDocument = Customer & Document;

@Schema({ timestamps: true })
export class Customer {
  // Telefon numarası BENZERSİZ (Unique) anahtarımızdır.
  @Prop({ required: true, unique: true, index: true })
  phoneNumber: string;

  @Prop({ default: 'Misafir' })
  firstName: string;

  @Prop()
  lastName: string;

  @Prop({ unique: true, sparse: true }) // Email varsa unique olsun, yoksa sorun değil
  email: string;

  @Prop()
  city: string;

  @Prop({ default: true })
  termsAccepted: boolean;

  // Bildirim Tokeni (OneSignal / Firebase)
  @Prop()
  deviceToken: string;

  // İstatistikler
  @Prop({ default: 0 })
  orderCount: number;

  @Prop({ default: false })
  isBanned: boolean;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);