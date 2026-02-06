import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 🔥 2026 STANDARTLARINDA FULL CORS
  // Her yerden gelen isteğe izin veriyoruz (Mobil + Web + Chatbot)
  app.enableCors({
    origin: true, 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  });

  // Render portu otomatik verir, biz 3005'i fallback yapıyoruz
  const port = process.env.PORT || 3005;
  
  // 0.0.0.0 Render için zorunludur
  await app.listen(port, '0.0.0.0'); 
  
  logger.log(`🚀 Kamyon Yola Çıktı: Port ${port}`);
  logger.log(`📱 Canlı API URL: https://transporter-app-with-chatbot.onrender.com`);
  logger.log(`✅ CORS: Tüm cihazlar (iOS/Android/Web) için tam erişim aktif.`);
}

bootstrap();