import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum ReportStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

export class CreateReportDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsNotEmpty()
  @IsString()
  userPhone: string;

  @IsNotEmpty()
  @IsString()
  reason: string; // Örn: "Şoför gelmedi", "Fazla ücret istedi"

  @IsOptional()
  @IsString()
  details?: string;

  // Gelecekte eklenecek kanıt fotoları vs. için esnek alan
  @IsOptional()
  extraData?: Record<string, any>;
}

export class UpdateReportDto {
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsString()
  adminNote?: string; // Adminin yazdığı çözüm notu
}