import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ReportStatus } from './dto/create-report.dto';

// İlişki kuracağımız diğer şemaları import edelim
import { Order } from '../orders/order.schema';
import { User } from '../users/user.schema';

export type ReportDocument = ReportItem & Document;

@Schema({ timestamps: true })
export class ReportItem {
  
  // 🔥 DÜZELTME: Düz string yerine Sipariş Tablosuna Referans
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Order', required: true })
  order: Order;

  // Şikayet eden kullanıcı (Opsiyonel olabilir, misafir ise)
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  reporter: User;

  @Prop({ required: true })
  userPhone: string;

  @Prop({ required: true })
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