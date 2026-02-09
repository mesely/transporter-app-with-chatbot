import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NewProviderDocument = NewProvider & Document;

class Pricing {
  @Prop({ default: 350 })
  openingFee: number; // Açılış Ücreti

  @Prop({ default: 40 })
  pricePerUnit: number; // Km/Birim Başı Ücret
}

class ServiceDetails {
  @Prop({ required: true, enum: ['KURTARICI', 'NAKLIYE', 'SARJ'] })
  mainType: string; // Ana Kategori (Senin istediğin genel tipler)

  @Prop()
  subType: string; // Alt tür (Örn: 12 Teker, Vinç, Kayar Kasa)

  @Prop({ type: [String], default: [] })
  tags: string[]; // Etiketler
}

class AddressInfo {
  @Prop()
  fullText: string;

  @Prop({ index: true })
  city: string; // İl

  @Prop({ index: true })
  district: string; // İlçe
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
}

export const NewProviderSchema = SchemaFactory.createForClass(NewProvider);