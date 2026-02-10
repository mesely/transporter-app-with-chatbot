import { Controller, Post, Body, Get, Param, Patch, Delete } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto, UpdateReportDto } from './dto/create-report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async createReport(@Body() createReportDto: CreateReportDto) {
    const savedReport = await this.reportsService.create(createReportDto);
    return { message: 'Şikayet başarıyla alındı', reportId: savedReport._id };
  }

  @Get()
  async getAllReports() {
    return this.reportsService.findAll();
  }

  @Get(':id')
  async getReport(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  // Admin şikayeti güncellerken (Örn: Status -> RESOLVED)
  @Patch(':id')
  async updateReport(@Param('id') id: string, @Body() updateReportDto: UpdateReportDto) {
    return this.reportsService.update(id, updateReportDto);
  }

  @Delete(':id')
  async deleteReport(@Param('id') id: string) {
    return this.reportsService.delete(id);
  }
}