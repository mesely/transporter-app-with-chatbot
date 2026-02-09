export class CreateTariffDto {
  serviceType: string; // Burası eskiden serviceSlug'dı, serviceType yaptık.
  openingFee: number;
  unitPrice: number;
  unit: 'km' | 'kwh' | 'fixed';
  currency?: string;
  nightMultiplier?: number;
  minPrice?: number;
  extraSettings?: Record<string, any>;
}