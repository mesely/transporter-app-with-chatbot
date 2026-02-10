import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';

import { UsersModule } from '../users/users.module';
import { TariffsModule } from '../tariffs/tariffs.module';
import { UsersService } from 'src/users/users.service';
import { ChatService } from './chat.service';

@Module({
  imports: [UsersModule, TariffsModule], 
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}