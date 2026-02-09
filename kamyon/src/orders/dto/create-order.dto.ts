import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, ValidateNested, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export enum OrderStatus {
  PENDING = 'PENDING',       // Müşteri oluşturdu, şoför aranıyor
  ACCEPTED = 'ACCEPTED',     // Şoför kabul etti
  IN_PROGRESS = 'IN_PROGRESS', // Şoför yola çıktı / işlem başladı
  COMPLETED = 'COMPLETED',   // İş bitti
  CANCELLED = 'CANCELLED'    // İptal edildi
}

class LocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsOptional()
  @IsString()
  address?: string;
}

export class CreateOrderDto {
  @IsNotEmpty()
  @IsMongoId() // MongoDB ID formatında olmalı
  customerId: string;

  @IsOptional()
  @IsMongoId()
  driverId?: string; // İlk etapta boş olabilir (havuza düşecekse)

  @IsNotEmpty()
  @IsString()
  serviceType: string; // 'kurtarici', 'nakliye'

  // Başlangıç Konumu
  @ValidateNested()
  @Type(() => LocationDto)
  pickupLocation: LocationDto;

  // Bitiş Konumu (Opsiyonel - örn: Sadece akü takviyesi ise bitiş yok)
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  dropoffLocation?: LocationDto;

  @IsOptional()
  @IsNumber()
  price?: number; // Tahmini veya anlaşılan fiyat
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}