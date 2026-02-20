import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ReportStatus } from './dto/create-report.dto';

import { Order } from '../orders/order.schema';
import { User } from '../users/user.schema';

export type ReportDocument = ReportItem & Document;

@Schema({ timestamps: true })
export class ReportItem {

  // Sipariş referansı — opsiyonel
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Order' })
  order: Order;

  // Şikayet edilen sürücü/provider — opsiyonel
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'NewProvider' })
  reportedDriver: any;

  // Şikayet eden kullanıcı — opsiyonel
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  reporter: User;

  @Prop()
  userPhone: string;

  @Prop()
  reportCategory: string;

  @Prop({ type: [String], default: [] })
  reasons: string[];

  @Prop()
  reason: string;

  @Prop()
  details: string;

  @Prop({ required: true, enum: ReportStatus, default: ReportStatus.OPEN })
  status: string;

  @Prop()
  adminNote?: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  extraData?: any;
}

export const ReportSchema = SchemaFactory.createForClass(ReportItem);
