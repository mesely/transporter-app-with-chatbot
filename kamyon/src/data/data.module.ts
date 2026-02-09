import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DataService } from './data.service';

// 1. Şemaları İmport Et
import { Profile, ProfileSchema } from '../users/schemas/profile.schema'; // Yolu kendi dosya yapına göre düzelt
import { NewUser, NewUserSchema } from './schemas/new-user.schema';
import { NewProvider, NewProviderSchema } from './schemas/new-provider.schema';
import { MigrationController } from './migration.controller';

@Module({
  imports: [
    // 2. MongooseModule.forFeature ile bu modüle modelleri tanıt
    MongooseModule.forFeature([
      { name: Profile.name, schema: ProfileSchema },      // Eski Tablo
      { name: NewUser.name, schema: NewUserSchema },      // Yeni Kullanıcı Tablosu
      { name: NewProvider.name, schema: NewProviderSchema } // Yeni Hizmet Tablosu
    ]),
  ],
  controllers: [MigrationController], // Endpoint için controller
  providers: [DataService],           // Servisimiz
  exports: [DataService]              // Başka yerde kullanacaksan dışa aç
})
export class DataModule {}