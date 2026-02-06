// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🔥 CORS Ayarları - Frontend'in bağlanabilmesi için
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'capacitor://localhost',      // iOS Capacitor
      'ionic://localhost',           // iOS alternatif
      'http://localhost',            // Android
      'https://transporter-app-with-chatbot.onrender.com',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Port ayarı
  const port = process.env.PORT || 3005;
  
  await app.listen(port, '0.0.0.0'); // 0.0.0.0 - harici erişim için
  
  console.log(`🚀 Backend çalışıyor: http://localhost:${port}`);
  console.log(`📱 API URL: https://transporter-app-with-chatbot.onrender.com`);
  console.log(`✅ CORS aktif - Mobil uygulama bağlanabilir`);
}

bootstrap();