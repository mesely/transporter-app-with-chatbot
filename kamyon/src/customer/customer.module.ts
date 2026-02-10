import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomersController } from './customer.controller';
import { CustomersService } from './customer.service';
import { Customer, CustomerSchema } from './schemas/customer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Customer.name, schema: CustomerSchema }]),
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService], // OrdersModule bunu kullanacak
})
export class CustomersModule {}