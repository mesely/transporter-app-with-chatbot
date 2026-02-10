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

  // 1. CREATE
  async create(data: CreateReportDto): Promise<ReportDocument> {
    const newReport = new this.reportModel({
      order: data.orderId,      // DTO'dan gelen ID'yi şemadaki 'order' alanına eşle
      reporter: data.userId,    // Varsa user ID'yi eşle
      userPhone: data.userPhone,
      reason: data.reason,
      details: data.details
    });
    return newReport.save(); 
  }

  // 2. FIND ALL (ZENGİNLEŞTİRİLMİŞ)
  async findAll(): Promise<ReportDocument[]> {
    return this.reportModel.find()
      .sort({ createdAt: -1 })
      // Şikayet eden kullanıcının bilgilerini getir
      .populate('reporter', 'firstName lastName email')
      // Siparişi ve o siparişin içindeki Şoförü getir (Nested Populate)
      .populate({
        path: 'order',
        select: 'pickupLocation dropoffLocation price status driver', // Sadece lazım olanlar
        populate: { path: 'driver', select: 'businessName phoneNumber' } // Şoförün adı ve telefonu
      })
      .exec();
  }

  // 3. FIND ONE
  async findOne(id: string): Promise<ReportDocument | null> {
    return this.reportModel.findById(id)
      .populate('reporter', 'firstName lastName phoneNumber')
      .populate({
        path: 'order',
        populate: { path: 'driver', select: 'businessName phoneNumber' }
      })
      .exec();
  }

  // 4. UPDATE
  async update(id: string, data: UpdateReportDto): Promise<ReportDocument | null> {
    return this.reportModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  // 5. DELETE
  async delete(id: string): Promise<ReportDocument | null> {
    return this.reportModel.findByIdAndDelete(id).exec();
  }
}