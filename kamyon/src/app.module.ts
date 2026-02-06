import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { ChatModule } from './chat/chat.module';
import { ReportsModule } from './reports/reports.module';
import { DatabaseModule } from './database/database.module';
import { TariffsModule } from './tariffs/tariffs.module';
import { DataModule } from './data/data.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.DATABASE_URI || 'mongodb+srv://slmnylmz2002:kamyon1234@nakliyecluster.owcbf.mongodb.net/transporter_db?retryWrites=true&w=majority'),
    
    // --- STATIC DOSYA AYARLARI (FRONTEND) ---
    ServeStaticModule.forRoot({
      // Frontend dosyalarının (HTML, CSS) olduğu yer
      rootPath: join(__dirname, '..', '..', 'my-app', 'out'),
      
      // API rotalarına karışma (DÜZELTİLEN KISIM BURASI)
      exclude: ['/api/{*path}'], 
      
      // /admin yazınca admin.html dosyasını bulmasını sağlayan ayar
      serveStaticOptions: {
        extensions: ['html'], 
      },
    }),
    // ----------------------------------------

    UsersModule,
    OrdersModule,
    ChatModule,
    ReportsModule,
    DatabaseModule,
    TariffsModule,
    DataModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}