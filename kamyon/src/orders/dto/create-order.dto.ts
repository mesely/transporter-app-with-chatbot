// src/orders/dto/create-order.dto.ts

export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  ON_THE_WAY = 'ON_THE_WAY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ContactMethod {
  CALL = 'call',
  MESSAGE = 'message',
}

export enum CustomerOutcome {
  PENDING = 'PENDING',
  AGREED = 'AGREED',
  NOT_AGREED = 'NOT_AGREED',
}

export class CreateOrderDto {
  customerId: string;
  driverId?: string; // Bu ID artık NewProvider._id olacak
  serviceType: string;
  contactMethod?: ContactMethod;
  pickupLocation: { lat: number; lng: number; address?: string };
  dropoffLocation?: { lat: number; lng: number; address?: string };
  price?: number;
  note?: string;
  customerOutcome?: CustomerOutcome;
}

export class UpdateOrderStatusDto {
  status: OrderStatus;
}
