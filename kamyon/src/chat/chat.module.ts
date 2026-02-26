import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from './chat.controller';

import { UsersModule } from '../users/users.module';
import { TariffsModule } from '../tariffs/tariffs.module';
import { ChatService } from './chat.service';
import { ChatHistory, ChatHistorySchema } from './schemas/chat-history.schema';

@Module({
  imports: [
    UsersModule,
    TariffsModule,
    MongooseModule.forFeature([{ name: ChatHistory.name, schema: ChatHistorySchema }]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
