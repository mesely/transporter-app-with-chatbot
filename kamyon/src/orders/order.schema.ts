import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ContactMethod, CustomerOutcome, OrderStatus } from './dto/create-order.dto';

import { NewProvider } from '../data/schemas/new-provider.schema';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {

  // MÜŞTERİ — localStorage deviceId (UUID string)
  @Prop({ required: true })
  customer: string;

  // 2. ŞOFÖR / HİZMET SAĞLAYICI (🔥 ARTIK 'NewProvider' TABLOSUNDA)
  // Bu sayede .populate('driver') dediğinde businessName, serviceType vb. gelir.
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'NewProvider' })
  driver: NewProvider;

  @Prop({ required: true })
  serviceType: string; // 'kurtarici', 'nakliye' vb.

  @Prop({ enum: ContactMethod, default: ContactMethod.CALL })
  contactMethod: string;

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

  @Prop({ enum: CustomerOutcome, default: CustomerOutcome.PENDING })
  customerOutcome: string;
  
  @Prop({ type: MongooseSchema.Types.Mixed })
  metaData?: any;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
