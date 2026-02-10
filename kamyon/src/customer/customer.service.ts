import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {}

  // GİRİŞ / KAYIT (Upsert Mantığı)
  async createOrLogin(data: CreateCustomerDto): Promise<Customer> {
    const { phoneNumber } = data;
    if (!phoneNumber) throw new BadRequestException('Telefon numarası şart!');

    // Varsa güncelle, yoksa oluştur
    const customer = await this.customerModel.findOne({ phoneNumber });

    if (customer) {
      this.logger.log(`Müşteri Girişi: ${phoneNumber}`);
      // Sadece gelen dolu verileri güncelle
      if (data.firstName) customer.firstName = data.firstName;
      if (data.lastName) customer.lastName = data.lastName;
      if (data.email) customer.email = data.email;
      if (data.city) customer.city = data.city;
      if (data.deviceToken) customer.deviceToken = data.deviceToken;
      return customer.save();
    } else {
      this.logger.log(`Yeni Müşteri: ${phoneNumber}`);
      const newCustomer = new this.customerModel(data);
      return newCustomer.save();
    }
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerModel.findById(id);
    if (!customer) throw new NotFoundException('Müşteri bulunamadı');
    return customer;
  }

  async findAll(): Promise<Customer[]> {
    return this.customerModel.find().sort({ createdAt: -1 }).exec();
  }

  async update(id: string, updateData: UpdateCustomerDto): Promise<Customer> {
    return this.customerModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async remove(id: string) {
    return this.customerModel.findByIdAndDelete(id);
  }
}