export class CreateTariffDto {
  serviceType: string;    // 'nakliye', 'kurtarici', 'sarj'
  openingFee: number;     // Açılış ücreti
  pricePerUnit: number;   // Birim başı (km) ücret
  unit: string;           // 'km' veya 'kwh'
  
  // Opsiyonel Alanlar (?)
  currency?: string;      // 'TL'
  minPrice?: number;      // İndi-bindi
  nightMultiplier?: number; // Gece tarifesi (1.5 vb.)
  extraSettings?: any;    // Esnek ayarlar
}