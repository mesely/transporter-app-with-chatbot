import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersService } from './users.service';

// 🔥 YENİ ŞEMALARI BURAYA IMPORT ETMELİSİN
import { NewUser, NewUserSchema } from '../data/schemas/new-user.schema';
import { NewProvider, NewProviderSchema } from '../data/schemas/new-provider.schema';
import { UsersController } from './users.controller';

@Module({
  imports: [
    // 🔥 BU KISIM EKSİKTİ: Modelleri Modüle Tanıtıyoruz
    MongooseModule.forFeature([
      { name: NewUser.name, schema: NewUserSchema },
      { name: NewProvider.name, schema: NewProviderSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Başka yerlerde (örn: Auth) kullanılacaksa dışa aç
})
export class UsersModule {}