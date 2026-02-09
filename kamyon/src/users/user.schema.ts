import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ unique: true, sparse: true })
  email: string;

  @Prop()
  password?: string;

  @Prop({ default: 'customer' })
  role: string;

  @Prop()
  deviceId?: string;

  @Prop({ default: true })
  isActive: boolean;

  // Puanlama Sistemi
  @Prop({ default: 0, min: 0, max: 5 })
  rating: number;

  @Prop({ default: 0 })
  totalRatings: number;

  // Filtreleme Vektörü (Örn: ["tenteli", "uzun_sase"])
  @Prop({ type: [String], default: [] })
  filterTags: string[];

  // Esnek Veri Sütunu
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  metadata: any;

  // 🛠 YENİ: Link Sütunu (Boş bırakılabilir)
  @Prop()
  link?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);