import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { OrderStatus } from './dto/create-order.dto';
import { User } from '../users//user.schema'; // User şemasını import et

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  // Müşteri Bağlantısı
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  customer: User;

  // Şoför Bağlantısı (Başta boş olabilir)
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  driver: User;

  @Prop({ required: true })
  serviceType: string;

  // Konumlar (Obje olarak tutuyoruz)
  @Prop({ type: Object, required: true })
  pickupLocation: {
    lat: number;
    lng: number;
    address?: string;
  };

  @Prop({ type: Object })
  dropoffLocation?: {
    lat: number;
    lng: number;
    address?: string;
  };

  @Prop({ enum: OrderStatus, default: OrderStatus.PENDING })
  status: string;

  @Prop()
  price?: number;

  @Prop({ default: 'TL' })
  currency: string;

  // Şoförün o anki notu veya iletişim yöntemi
  @Prop()
  note?: string;
  
  // ESNEK ALAN: Mesafe, süre vb.
  @Prop({ type: MongooseSchema.Types.Mixed })
  metaData?: any;
}

export const OrderSchema = SchemaFactory.createForClass(Order);