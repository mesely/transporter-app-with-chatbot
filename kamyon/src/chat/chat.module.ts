import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { UsersModule } from '../users/users.module';
import { TariffsModule } from '../tariffs/tariffs.module';

@Module({
  imports: [UsersModule, TariffsModule], 
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}