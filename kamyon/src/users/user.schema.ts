import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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

  // YENİ: Puanlama Sistemi
  @Prop({ default: 0, min: 0, max: 5 })
  rating: number;

  @Prop({ default: 0 })
  totalRatings: number;

  
}

export const UserSchema = SchemaFactory.createForClass(User);