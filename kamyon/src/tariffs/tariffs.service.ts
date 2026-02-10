import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tariff, TariffDocument } from './tariff.schema';
import { CreateTariffDto } from './dto/create-tariff.dto';

@Injectable()
export class TariffsService {
  constructor(@InjectModel(Tariff.name) private tariffModel: Model<TariffDocument>) {}

  // Create/Update (Upsert Mantığı)
  async create(data: CreateTariffDto): Promise<TariffDocument> {
    // serviceType (örn: 'nakliye') varsa güncelle, yoksa yeni oluştur.
    return this.tariffModel.findOneAndUpdate(
      { serviceType: data.serviceType }, 
      data, 
      { upsert: true, new: true, setDefaultsOnInsert: true } 
    );
  }

  async findAll(): Promise<TariffDocument[]> {
    return this.tariffModel.find().exec();
  }

  async findByType(serviceType: string): Promise<TariffDocument | null> {
    return this.tariffModel.findOne({ serviceType }).exec();
  }

  async findOne(id: string): Promise<TariffDocument | null> {
    return this.tariffModel.findById(id).exec();
  }

  async update(id: string, data: any): Promise<TariffDocument | null> {
    return this.tariffModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<TariffDocument | null> {
    return this.tariffModel.findByIdAndDelete(id).exec();
  }
}