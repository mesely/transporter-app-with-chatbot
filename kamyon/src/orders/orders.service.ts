import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './order.schema';
import { CreateOrderDto, OrderStatus } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(@InjectModel(Order.name) private orderModel: Model<OrderDocument>) {}

  // 1. CREATE
  async create(createOrderDto: CreateOrderDto): Promise<OrderDocument> {
    const newOrder = new this.orderModel({
      customer: createOrderDto.customerId, // DTO'dan gelen ID'yi şemadaki ref alanına atıyoruz
      driver: createOrderDto.driverId,
      ...createOrderDto
    });
    return newOrder.save();
  }

  // 2. FIND ALL (Filtreli ve Detaylı)
  async findAll(customerId?: string, driverId?: string): Promise<OrderDocument[]> {
    const query: any = {};
    if (customerId) query.customer = customerId;
    if (driverId) query.driver = driverId;

    return this.orderModel.find(query)
      .sort({ createdAt: -1 })
      .populate('customer', 'firstName lastName phoneNumber') // Müşteri detaylarını getir
      .populate('driver', 'firstName lastName phoneNumber serviceType rating') // Şoför detaylarını getir
      .exec();
  }

  // 3. FIND ONE
  async findOne(id: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id)
      .populate('customer', 'firstName lastName phoneNumber')
      .populate('driver', 'firstName lastName phoneNumber')
      .exec();
      
    if (!order) throw new NotFoundException('Sipariş bulunamadı');
    return order;
  }

  // 4. UPDATE STATUS
  async updateStatus(id: string, status: OrderStatus): Promise<OrderDocument> {
    return this.orderModel.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    ).exec();
  }

  // 5. UPDATE (Genel güncelleme)
  async update(id: string, attrs: Partial<Order>): Promise<OrderDocument> {
    return this.orderModel.findByIdAndUpdate(id, attrs, { new: true }).exec();
  }
  
  // 6. DELETE
  async delete(id: string) {
    return this.orderModel.findByIdAndDelete(id).exec();
  }
}