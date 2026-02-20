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
      customer: createOrderDto.customerId,
      driver: createOrderDto.driverId, // Bu ID artık NewProvider ID'si olacak
      contactMethod: createOrderDto.contactMethod || 'call',
      customerOutcome: createOrderDto.customerOutcome || 'PENDING',
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
      // 🔥 Müşteri hala eski User olabilir veya NewUser. 
      // Eğer müşteri tarafını değiştirmediysek burası kalabilir ama 'email' eklemek iyi olur.
      .populate('customer', 'firstName lastName phoneNumber email') 
      
      // 🔥 KRİTİK DEĞİŞİKLİK: Sürücü artık NewProvider!
      // 'firstName lastName' YERİNE 'businessName' çekiyoruz.
      // Ayrıca 'service' objesini de çekiyoruz ki 'kurtarici' mı 'vinc' mi görelim.
      .populate('driver', 'businessName phoneNumber rating service pricing location reportCount ratingCount isVerified photoUrl vehicleInfo vehiclePhotos') 
      .exec();
  }

  // 3. FIND ONE
  async findOne(id: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id)
      .populate('customer', 'firstName lastName phoneNumber email')
      // 🔥 AYNI DEĞİŞİKLİK BURADA DA GEÇERLİ
      .populate('driver', 'businessName phoneNumber rating service pricing reportCount ratingCount isVerified photoUrl vehicleInfo vehiclePhotos')
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
