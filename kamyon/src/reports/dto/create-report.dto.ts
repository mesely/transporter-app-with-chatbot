export enum ReportStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export class CreateReportDto {
  orderId?: string;
  reportedDriverId?: string;
  reporterPhone?: string;
  userPhone?: string;
  reportCategory?: string;
  reasons?: string[];
  description?: string;
  details?: string;
  reason?: string;
  userId?: string;
}

export class UpdateReportDto {
  status?: ReportStatus;
  adminNote?: string;
  extraData?: any;
}
