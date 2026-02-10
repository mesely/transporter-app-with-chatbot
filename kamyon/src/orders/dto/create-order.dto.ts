// src/orders/dto/create-order.dto.ts

export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  ON_THE_WAY = 'ON_THE_WAY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class CreateOrderDto {
  customerId: string;
  driverId?: string; // Bu ID artık NewProvider._id olacak
  serviceType: string;
  pickupLocation: { lat: number; lng: number; address?: string };
  dropoffLocation?: { lat: number; lng: number; address?: string };
  price?: number;
  note?: string;
}

export class UpdateOrderStatusDto {
  status: OrderStatus;
}