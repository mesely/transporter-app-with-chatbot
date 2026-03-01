import { Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('healthz')
  healthz() {
    return { ok: true, ts: Date.now() };
  }

  @Post('client-events')
  ingestClientEvent(@Body() body: any) {
    const kind = String(body?.kind || 'unknown');
    const message = String(body?.message || '').slice(0, 400);
    const href = String(body?.href || '').slice(0, 240);
    this.logger.warn(`[client-event] kind=${kind} href=${href} msg=${message}`);
    return { ok: true };
  }
}
