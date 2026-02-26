import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatHistoryDocument = ChatHistory & Document;

@Schema({ _id: false })
class ChatHistoryMessage {
  @Prop({ required: true, enum: ['user', 'assistant'] })
  role: 'user' | 'assistant';

  @Prop({ required: true })
  content: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Object, default: null })
  dataPacket?: any;
}

@Schema({ timestamps: true, collection: 'chat_histories' })
export class ChatHistory {
  @Prop({ required: true, index: true, unique: true })
  customerId: string;

  @Prop({ type: [ChatHistoryMessage], default: [] })
  messages: ChatHistoryMessage[];
}

export const ChatHistorySchema = SchemaFactory.createForClass(ChatHistory);
