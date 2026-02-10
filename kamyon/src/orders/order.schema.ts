import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { OrderStatus } from './dto/create-order.dto';

// 🔥 Eski User (Müşteri için) ve Yeni Provider (Şoför için) Importları
import { User } from '../users/user.schema'; 
import { NewProvider } from '../data/schemas/new-provider.schema'; // Dosya yolu sende farklıysa düzelt

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  
  // 1. MÜŞTERİ (Hala standart User tablosunda olabilir)
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  customer: User;

  // 2. ŞOFÖR / HİZMET SAĞLAYICI (🔥 ARTIK 'NewProvider' TABLOSUNDA)
  // Bu sayede .populate('driver') dediğinde businessName, serviceType vb. gelir.
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'NewProvider' })
  driver: NewProvider;

  @Prop({ required: true })
  serviceType: string; // 'kurtarici', 'nakliye' vb.

  // Konumlar
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

  @Prop()
  note?: string;
  
  @Prop({ type: MongooseSchema.Types.Mixed })
  metaData?: any;
}

export const OrderSchema = SchemaFactory.createForClass(Order);