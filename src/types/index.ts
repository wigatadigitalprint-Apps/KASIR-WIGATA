export type ProductCategory = 'Meteran' | 'A3+' | 'Nota Rim' | 'Stempel' | 'Cutting';

export type PaymentMethod = 'tunai' | 'qris' | 'transfer';

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: ProductCategory;
  popular?: boolean;
  description?: string;
}

export interface FinishingOptions {
  // Meteran
  mataAyam: boolean;
  mataAyamCount: number;
  kelim: boolean;
  laminasiDoffM: boolean;
  laminasiGlossyM: boolean;
  
  // A3+
  ciscut: boolean;
  potong: boolean;
  laminasiDoffA3: boolean;
  laminasiGlossyA3: boolean;
  bolakBalik: boolean;
  laminasiDingin: boolean;
  laminasiPanas: boolean;
  laminatingF4: boolean;

  // Cutting
  warna2x: boolean;

  // Nota
  tambahanNomor: boolean;
}

export interface CartItem {
  cartId: string;
  product: ProductItem;
  panjang: number; // in meter (Meteran) or cm (Cutting)
  lebar: number;   // in meter (Meteran) or cm (Cutting)
  luas: number;    // per unit
  totalLuas: number; // total = luas * qty
  qty: number;
  finishing: FinishingOptions;
  desainFee: number;
  basePrice: number;
  finishingCost: number;
  total: number;
  catatan?: string;
}

export interface Transaction {
  id: string;
  noNota: string;
  date: string; // ISO string
  dateStr: string;
  tanggalDisplay: string;
  jam: string;
  pelanggan: string;
  hp: string;
  kasir: string;
  items: CartItem[];
  subtotal: number;
  diskonPercent: number;
  diskonRp: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  bayar: number;
  kembalian: number;
  statusSyncExcel?: 'synced' | 'pending' | 'failed' | 'local_only';
  syncError?: string;
}

export interface PrinterConfig {
  type: 'windows_spooler' | 'webusb' | 'bluetooth' | 'serial' | 'system';
  paperWidth: 58 | 80;
  connected: boolean;
  deviceName?: string;
  autoCut: boolean;
  openDrawer: boolean;
  printDensity: 'normal' | 'dark';
}

export interface ExcelSyncConfig {
  webhookUrl: string;
  autoSyncOnSave: boolean;
  syncIntervalMinutes: number;
  lastSyncedAt?: string;
  spreadsheetName?: string;
}
