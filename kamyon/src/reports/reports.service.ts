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
      ...(data.orderId ? { order: data.orderId } : {}),
      ...(data.reportedDriverId ? { reportedDriver: data.reportedDriverId } : {}),
      ...(data.userId ? { reporter: data.userId } : {}),
      userPhone: data.reporterPhone || data.userPhone || '',
      reportCategory: data.reportCategory || 'driver',
      reasons: data.reasons || [],
      reason: data.reason || (data.reasons && data.reasons.length > 0 ? data.reasons[0] : ''),
      details: data.description || data.details || '',
    });
    return newReport.save();
  }

  // 2. FIND ALL
  async findAll(): Promise<ReportDocument[]> {
    return this.reportModel.find()
      .sort({ createdAt: -1 })
      .populate('reporter', 'firstName lastName email')
      .populate({
        path: 'order',
        select: 'pickupLocation dropoffLocation price status driver',
        populate: { path: 'driver', select: 'businessName phoneNumber' }
      })
      .exec();
  }

  // 3. FIND BY PROVIDER
  async findByProvider(providerId: string): Promise<ReportDocument[]> {
    return this.reportModel.find({ reportedDriver: providerId, status: 'RESOLVED' })
      .sort({ createdAt: -1 })
      .select('reportCategory reasons reason details userPhone createdAt status')
      .exec();
  }

  async findByReporter(phone: string): Promise<ReportDocument[]> {
    const normalizedPhone = String(phone || '').replace(/\D/g, '');
    if (!normalizedPhone) return [];
    const rows = await this.reportModel.find()
      .sort({ createdAt: -1 })
      .select('reportCategory reasons reason details userPhone createdAt status')
      .exec();
    return rows.filter((row: any) => String(row?.userPhone || '').replace(/\D/g, '') === normalizedPhone);
  }

  // 4. COUNT BY PROVIDER
  async countByProvider(providerId: string): Promise<number> {
    return this.reportModel.countDocuments({ reportedDriver: providerId, status: 'RESOLVED' }).exec();
  }

  // 5. FIND ONE
  async findOne(id: string): Promise<ReportDocument | null> {
    return this.reportModel.findById(id)
      .populate('reporter', 'firstName lastName phoneNumber')
      .populate({
        path: 'order',
        populate: { path: 'driver', select: 'businessName phoneNumber' }
      })
      .exec();
  }

  // 6. UPDATE
  async update(id: string, data: UpdateReportDto): Promise<ReportDocument | null> {
    const updated = await this.reportModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (updated?.reportedDriver) {
      await this.syncProviderReportCount(String(updated.reportedDriver));
    }
    return updated;
  }

  // 7. DELETE
  async delete(id: string): Promise<ReportDocument | null> {
    const deleted = await this.reportModel.findByIdAndDelete(id).exec();
    if (deleted?.reportedDriver) {
      await this.syncProviderReportCount(String(deleted.reportedDriver));
    }
    return deleted;
  }

  private async syncProviderReportCount(providerId: string) {
    try {
      const mongoose = require('mongoose');
      const count = await this.reportModel.countDocuments({
        reportedDriver: providerId,
        status: 'RESOLVED',
      });
      await mongoose.connection.collection('new_providers').updateOne(
        { _id: new mongoose.Types.ObjectId(providerId) },
        { $set: { reportCount: count } }
      );
    } catch {
      // cosmetic sync only
    }
  }
}
