import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument } from './schemas/customer.schema';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {}

  /**
   * MÜŞTERİ KAYDI / GİRİŞİ (Temel Fonksiyon)
   * Telefon numarası varsa giriş yapar (bilgileri günceller), yoksa yeni oluşturur.
   */
  async createOrLogin(data: any): Promise<Customer> {
    const { phoneNumber } = data;

    if (!phoneNumber) {
      throw new BadRequestException('Telefon numarası zorunludur.');
    }

    // 1. Bu numara ile kayıtlı müşteri var mı?
    const existingCustomer = await this.customerModel.findOne({ phoneNumber });

    if (existingCustomer) {
      // VARSA: Bilgileri güncelle (Cihaz değişmiş olabilir, isim düzeltilmiş olabilir)
      this.logger.log(`Müşteri Girişi: ${phoneNumber}`);
      
      // Sadece dolu gelen alanları güncelle
      if (data.firstName) existingCustomer.firstName = data.firstName;
      if (data.email) existingCustomer.email = data.email;
      if (data.city) existingCustomer.city = data.city;
      if (data.deviceToken) existingCustomer.deviceToken = data.deviceToken;
      
      return existingCustomer.save();
    } 
    else {
      // YOKSA: Yeni kayıt oluştur
      this.logger.log(`Yeni Müşteri Kaydı: ${phoneNumber}`);
      const newCustomer = new this.customerModel(data);
      return newCustomer.save();
    }
  }

  // ID ile Müşteri Bul
  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerModel.findById(id);
    if (!customer) throw new NotFoundException('Müşteri bulunamadı.');
    return customer;
  }

  // Tüm Müşterileri Listele (Admin Paneli İçin)
  async findAll(): Promise<Customer[]> {
    return this.customerModel.find().sort({ createdAt: -1 }).exec();
  }

  // Müşteri Bilgilerini Güncelle (Profil Düzenleme)
  async update(id: string, updateData: any): Promise<Customer> {
    const updated = await this.customerModel
      .findByIdAndUpdate(id, updateData, { new: true }) // new: true -> güncel halini döner
      .exec();
    
    if (!updated) throw new NotFoundException('Müşteri bulunamadı.');
    return updated;
  }

  // Hesabı Sil (KVKK / GDPR Gereği)
  async remove(id: string): Promise<any> {
    const deleted = await this.customerModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Müşteri bulunamadı.');
    return { message: 'Hesap başarıyla silindi.' };
  }
}