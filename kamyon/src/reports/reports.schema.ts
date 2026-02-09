import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ReportStatus } from './dto/create-report.dto';

export type ReportDocument = ReportItem & Document;

@Schema({ timestamps: true })
export class ReportItem {
  @Prop({ required: true, index: true })
  orderId: string;

  @Prop({ required: true })
  userPhone: string;

  @Prop({ required: true })
  reason: string;

  @Prop()
  details: string;

  // Enum kullanımı veritabanı tutarlılığı sağlar
  @Prop({ required: true, enum: ReportStatus, default: ReportStatus.OPEN })
  status: string;

  // Admin şikayeti çözerken buraya not düşecek
  @Prop()
  adminNote?: string;

  // ESNEK KOLON: İleride resim URL'leri, loglar vs. buraya gelir.
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  extraData?: any;
}

export const ReportSchema = SchemaFactory.createForClass(ReportItem);