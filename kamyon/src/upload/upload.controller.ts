import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { v2 as cloudinary } from 'cloudinary';

// Parse CLOUDINARY_URL: cloudinary://api_key:api_secret@cloud_name
function configureCloudinary() {
  const url = process.env.CLOUDINARY_URL || '';
  if (!url.startsWith('cloudinary://')) return;
  const withoutScheme = url.replace('cloudinary://', '');
  const [credentials, cloudName] = withoutScheme.split('@');
  const [apiKey, apiSecret] = credentials.split(':');
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
}

configureCloudinary();

@Controller('upload')
export class UploadController {

  @Post('vehicle-photo')
  @UseInterceptors(FileInterceptor('photo', { storage: memoryStorage() }))
  async uploadVehiclePhoto(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Dosya bulunamadı');

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'transport245/vehicles', resource_type: 'image' },
        (error, result) => {
          if (error) return reject(new BadRequestException('Fotoğraf yüklenemedi: ' + error.message));
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
      uploadStream.end(file.buffer);
    });
  }
}
