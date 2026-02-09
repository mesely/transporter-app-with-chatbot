import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReportDocument, ReportItem } from './reports.schema';
import { CreateReportDto, UpdateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(ReportItem.name) private reportModel: Model<ReportDocument>
  ) {}

  // CREATE
  async create(data: CreateReportDto): Promise<ReportDocument> {
    const newReport = new this.reportModel(data);
    return newReport.save(); 
  }

  // FIND ALL
  async findAll(): Promise<ReportDocument[]> {
    return this.reportModel.find().sort({ createdAt: -1 }).exec();
  }

  // FIND ONE
  async findOne(id: string): Promise<ReportDocument | null> {
    return this.reportModel.findById(id).exec();
  }

  // UPDATE (Admin statü değiştirirken kullanılır)
  async update(id: string, data: UpdateReportDto): Promise<ReportDocument | null> {
    return this.reportModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  // DELETE
  async delete(id: string): Promise<ReportDocument | null> {
    return this.reportModel.findByIdAndDelete(id).exec();
  }
}