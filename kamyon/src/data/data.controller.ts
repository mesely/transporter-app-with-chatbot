import { Controller, Post, Get, HttpCode } from '@nestjs/common';
import { DataService } from './data.service';

@Controller('data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Post('populate-turkey')
  @HttpCode(201)
  async populateTurkey() {
    return this.dataService.populateTurkeyData();
  }

  @Get('stats')
  async getStats() {
    return this.dataService.getDbStats();
  }
}