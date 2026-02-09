import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Profile extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  phoneNumber: string;

  @Prop()
  address: string;

  @Prop()
  serviceType: string;

  // --- YENİ EKLENENLER ---
  @Prop()
  city: string;   // Şehir Filtresi için (Örn: İzmir)

  @Prop()
  routes: string; // Güzergah Bilgisi için (Örn: İZMİR - İSTANBUL)
  // -----------------------

  @Prop({ type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], index: '2dsphere' } })
  location: { type: string; coordinates: [number, number] };

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: true }) 
isActive: boolean;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
ProfileSchema.index({ location: '2dsphere' });