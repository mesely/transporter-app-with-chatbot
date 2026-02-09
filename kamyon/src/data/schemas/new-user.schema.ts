import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NewUserDocument = NewUser & Document;

@Schema({ timestamps: true, collection: 'new_users' }) // Yeni Collection İsmi
export class NewUser {
  @Prop({ unique: true, required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'provider' })
  role: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const NewUserSchema = SchemaFactory.createForClass(NewUser);