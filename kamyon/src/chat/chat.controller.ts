import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async sendMessage(
    @Body() body: { message: string; history: any[]; location?: { lat: number; lng: number } }
  ) {
    return this.chatService.chat(body.message, body.history, body.location);
  }
}
