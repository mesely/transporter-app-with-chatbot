import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { v2 as cloudinary } from 'cloudinary';

let cloudinaryConfigError = '';
let isCloudinaryConfigured = false;

function configureCloudinary() {
  try {
    const rawUrl = process.env.CLOUDINARY_URL?.trim();
    if (rawUrl) {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== 'cloudinary:') {
        throw new Error('CLOUDINARY_URL protocol must be cloudinary://');
      }
      const cloudName = parsed.hostname;
      const apiKey = decodeURIComponent(parsed.username);
      const apiSecret = decodeURIComponent(parsed.password);
      if (!cloudName || !apiKey || !apiSecret) {
        throw new Error('CLOUDINARY_URL is missing cloud_name/api_key/api_secret');
      }
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
      isCloudinaryConfigured = true;
      cloudinaryConfigError = '';
      return;
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary config missing. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET');
    }
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    isCloudinaryConfigured = true;
    cloudinaryConfigError = '';
  } catch (error) {
    isCloudinaryConfigured = false;
    cloudinaryConfigError = error instanceof Error ? error.message : 'Cloudinary configuration failed';
  }
}

configureCloudinary();

@Controller('upload')
export class UploadController {

  @Post('vehicle-photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
      fileFilter: (_, file, cb) => {
        if (!file?.mimetype?.startsWith('image/')) {
          cb(new BadRequestException('Yalnızca görsel dosyaları yüklenebilir.'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadVehiclePhoto(@UploadedFile() file: Express.Multer.File) {
    try {
      if (!isCloudinaryConfigured) {
        throw new BadRequestException(`Cloudinary yapılandırması eksik/hatalı: ${cloudinaryConfigError}`);
      }
      if (!file) throw new BadRequestException('Dosya bulunamadı');

      return await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'transport245/vehicles',
            resource_type: 'image',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          },
          (error, result) => {
            if (error) {
              reject(new BadRequestException('Fotoğraf yüklenemedi: ' + error.message));
              return;
            }
            if (!result?.secure_url) {
              reject(new BadRequestException('Fotoğraf URL bilgisi alınamadı.'));
              return;
            }
            resolve({ url: result.secure_url, publicId: result.public_id });
          }
        );
        uploadStream.end(file.buffer);
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Fotoğraf yüklenemedi. Lütfen tekrar deneyin.');
    }
  }
}
