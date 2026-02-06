import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ServiceDefinitionDocument = ServiceDefinition & Document;

@Schema({ timestamps: true })
export class ServiceDefinition {
  @Prop({ required: true, unique: true, index: true })
  slug: string; 

  @Prop({ required: true })
  name: string; 

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;

  // ESNEK KOLON: Frontend ikonları, renk kodları vb. buraya gelir.
  @Prop({ type: MongooseSchema.Types.Mixed })
  uiConfig?: any; 
}

export const ServiceDefinitionSchema = SchemaFactory.createForClass(ServiceDefinition);