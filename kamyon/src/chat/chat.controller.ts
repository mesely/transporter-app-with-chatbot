import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async sendMessage(
    @Body()
    body: {
      message: string;
      history: any[];
      location?: { lat: number; lng: number };
      customerId?: string;
    }
  ) {
    return this.chatService.chat(body.message, body.history, body.location, body.customerId);
  }

  @Get('history')
  async history(@Query('customerId') customerId: string) {
    return this.chatService.getHistory(customerId);
  }

  @Post('history/clear')
  async clearHistory(@Body() body: { customerId?: string }) {
    return this.chatService.clearHistory(body.customerId);
  }
}
