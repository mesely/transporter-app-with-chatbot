import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomersService } from './customer.service';
import { CustomersController } from './customer.controller';
import { Customer, CustomerSchema } from './schemas/customer.schema';

@Module({
  imports: [
    // Şemayı veritabanına tanıtıyoruz
    MongooseModule.forFeature([{ name: Customer.name, schema: CustomerSchema }]),
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService], // Başka modüller (örn: Orders) müşteri bilgisi çekebilsin diye dışa açtık
})
export class CustomersModule {}