// src/reports/dto/create-report.dto.ts

export enum ReportStatus {
  OPEN = 'OPEN',           // Açık
  IN_PROGRESS = 'IN_PROGRESS', // İnceleniyor
  RESOLVED = 'RESOLVED',   // Çözüldü
  CLOSED = 'CLOSED',       // Kapatıldı
}

export class CreateReportDto {
  orderId: string;   // Hangi sipariş?
  userId?: string;   // Şikayet eden User ID (Opsiyonel ama önerilir)
  userPhone: string; // İletişim no
  reason: string;    // Konu başlığı
  details?: string;  // Detaylı açıklama
}

export class UpdateReportDto {
  status?: ReportStatus;
  adminNote?: string;
  extraData?: any;
}