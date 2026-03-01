import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NewProviderDocument = NewProvider & Document;

class Pricing {
  @Prop({ default: 0 })
  openingFee: number;

  @Prop({ default: 40 })
  pricePerUnit: number;
}

class ServiceDetails {
  @Prop({ required: true, enum: ['KURTARICI', 'NAKLIYE', 'SARJ', 'YOLCU', 'YURT_DISI'] })
  mainType: string;

  @Prop()
  subType: string;

  @Prop({ type: [String], default: [] })
  tags: string[];
}

class AddressInfo {
  @Prop()
  fullText: string;

  @Prop({ index: true })
  city: string;

  @Prop({ index: true })
  district: string;
}

class VehicleItem {
  @Prop()
  name: string;

  @Prop({ type: [String], default: [] })
  photoUrls: string[];
}

@Schema({ timestamps: true, collection: 'new_providers' })
export class NewProvider {
  @Prop({ type: Types.ObjectId, ref: 'NewUser', required: true })
  user: Types.ObjectId;

  @Prop({ required: true, index: 'text' })
  businessName: string;

  @Prop()
  phoneNumber: string;

  @Prop({ type: AddressInfo })
  address: AddressInfo;

  @Prop({ type: ServiceDetails })
  service: ServiceDetails;

  @Prop({ type: Pricing })
  pricing: Pricing;

  @Prop({
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' }
  })
  location: { type: string; coordinates: [number, number] };

  @Prop()
  website?: string;

  @Prop()
  link?: string;

  @Prop({ default: 5.0 })
  rating: number;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: 0 })
  ratingCount: number;

  @Prop({ default: 0 })
  reportCount: number;

  @Prop()
  photoUrl?: string;

  @Prop()
  vehicleInfo?: string;

  @Prop({ type: [String], default: [] })
  vehiclePhotos?: string[];

  @Prop({ type: [VehicleItem], default: [] })
  vehicleItems?: VehicleItem[];

  @Prop()
  taxNumber?: string;

  @Prop({ type: [Object], default: [] })
  ratings: Array<{
    rating: number;
    comment?: string;
    tags?: string[];
    orderId?: string;
    createdAt?: Date;
  }>;
}

export const NewProviderSchema = SchemaFactory.createForClass(NewProvider);
NewProviderSchema.index({ location: '2dsphere' });
NewProviderSchema.index({ 'service.mainType': 1, location: '2dsphere' });
NewProviderSchema.index({ 'service.subType': 1, location: '2dsphere' });
NewProviderSchema.index({ 'address.city': 1, 'service.mainType': 1 });
