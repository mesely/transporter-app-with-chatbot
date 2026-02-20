import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { v2 as cloudinary } from 'cloudinary';

/* ---------------- CLOUDINARY CONFIG ---------------- */

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ Cloudinary ENV eksik');
} else {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

/* ---------------- CONTROLLER ---------------- */

@Controller('upload')
export class UploadController {
  @Post('vehicle-photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: memoryStorage(),
      limits: {
        fileSize: 8 * 1024 * 1024, // 8MB
      },
      fileFilter: (_, file, cb) => {
        if (!file?.mimetype?.startsWith('image/')) {
          return cb(
            new BadRequestException('Yalnızca görsel dosyaları yüklenebilir.'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadVehiclePhoto(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string; publicId: string }> {
    if (!cloudName || !apiKey || !apiSecret) {
      throw new BadRequestException(
        'Cloudinary yapılandırması eksik (.env kontrol edin)',
      );
    }

    if (!file) {
      throw new BadRequestException('Dosya bulunamadı');
    }

    try {
      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'transport245/vehicles',
            resource_type: 'image',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [
              { quality: 'auto', fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          },
        );

        stream.end(file.buffer);
      });

      if (!result?.secure_url || !result?.public_id) {
        throw new BadRequestException('Cloudinary dönüşü eksik');
      }

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error: any) {
      throw new BadRequestException(
        'Fotoğraf yüklenemedi: ' + (error?.message || 'Bilinmeyen hata'),
      );
    }
  }
}