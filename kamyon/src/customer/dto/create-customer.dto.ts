// src/customers/dto/create-customer.dto.ts

export class CreateCustomerDto {
  phoneNumber: string; // Zorunlu (Kimlik yerine geçer)
  firstName?: string;
  lastName?: string;
  email?: string;
  city?: string;
  deviceToken?: string; // Bildirimler için
}

export class UpdateCustomerDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  city?: string;
  deviceToken?: string;
  isBanned?: boolean;   // Admin banlayabilir
}