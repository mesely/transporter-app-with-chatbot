import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateUserDto {
  // --- USER TABLOSU ---
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsEnum(['admin', 'customer', 'provider', 'driver'])
  role?: string;

  // --- PROFILE TABLOSU (Create sırasında kolaylık olsun diye buraya da koyuyoruz) ---
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  address?: string;

  // Konum bilgisi (GeoJSON)
  @IsOptional()
  location?: {
    lat: number;
    lng: number;
  };
  
  @IsOptional()
  serviceType?: string; // Sadece sağlayıcılar için
}