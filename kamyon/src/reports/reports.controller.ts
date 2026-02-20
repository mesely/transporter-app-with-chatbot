import { Controller, Post, Body, Get, Param, Patch, Delete, Query } from '@nestjs/common';
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

  // GET /reports/count?providerId=X (must be before :id route)
  @Get('count')
  async getCount(@Query('providerId') providerId?: string) {
    if (providerId) {
      const count = await this.reportsService.countByProvider(providerId);
      return { count };
    }
    return { count: 0 };
  }

  // GET /reports?providerId=X for provider complaints, or all reports
  @Get()
  async getAllReports(@Query('providerId') providerId?: string) {
    if (providerId) {
      return this.reportsService.findByProvider(providerId);
    }
    return this.reportsService.findAll();
  }

  @Get(':id')
  async getReport(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Patch(':id')
  async updateReport(@Param('id') id: string, @Body() updateReportDto: UpdateReportDto) {
    return this.reportsService.update(id, updateReportDto);
  }

  @Delete(':id')
  async deleteReport(@Param('id') id: string) {
    return this.reportsService.delete(id);
  }
}
