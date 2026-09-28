import { ProductItem, ProductCategory, FinishingOptions } from '../types';

export const CATALOG_PRODUCTS: ProductItem[] = [
  // Meteran
  { id: 'm1', name: 'Flexy 340', price: 25000, unit: '/m²', category: 'Meteran', popular: true, description: 'Bahan spanduk standar outdoor, kuat dan ekonomis' },
  { id: 'm2', name: 'Flexy 380', price: 35000, unit: '/m²', category: 'Meteran', description: 'Bahan spanduk semi-tebal dengan ketahanan ekstra' },
  { id: 'm3', name: 'Flexy 440', price: 45000, unit: '/m²', category: 'Meteran', popular: true, description: 'Bahan spanduk tebal premium tahan cuaca ekstrem' },
  { id: 'm4', name: 'Flexy Backlite 510', price: 70000, unit: '/m²', category: 'Meteran', description: 'Khusus neon box tembus cahaya, warna tajam' },
  { id: 'm5', name: 'Flexy FO (Frontlite)', price: 17000, unit: '/m²', category: 'Meteran', description: 'Bahan ekonomis promo event jangka pendek' },
  { id: 'm6', name: 'Stiker One Way Vision', price: 110000, unit: '/m²', category: 'Meteran', description: 'Stiker kaca berpori, terlihat dari dalam transparan' },
  { id: 'm7', name: 'Stiker Camel Outdoor', price: 90000, unit: '/m²', category: 'Meteran', description: 'Stiker outdoor daya rekat kuat tahan hujan panas' },
  { id: 'm8', name: 'Stiker Ritrama', price: 100000, unit: '/m²', category: 'Meteran', popular: true, description: 'Stiker premium Jerman warna solid dan tahan lama' },
  { id: 'm9', name: 'Stiker Transparant Meter', price: 120000, unit: '/m²', category: 'Meteran', description: 'Stiker tembus pandang cocok untuk kaca display' },
  { id: 'm10', name: 'Albatros Matte', price: 80000, unit: '/m²', category: 'Meteran', description: 'Bahan halus tanpa serat untuk X-Banner & Roll-up' },
  { id: 'm11', name: 'Photo Paper Glossy', price: 85000, unit: '/m²', category: 'Meteran', description: 'Kertas foto cetak resolusi tinggi untuk poster dalam ruangan' },

  // A3+
  { id: 'a1', name: 'Stiker Chromo A3+', price: 7500, unit: '/lbr', category: 'A3+', popular: true, description: 'Stiker kertas label kemasan ekonomis & kilap' },
  { id: 'a2', name: 'Stiker Vinyl A3+', price: 15000, unit: '/lbr', category: 'A3+', popular: true, description: 'Stiker plastik anti-air, tidak mudah robek' },
  { id: 'a3', name: 'Stiker Transparant A3+', price: 15000, unit: '/lbr', category: 'A3+', description: 'Stiker bening tahan air untuk botol & toples' },
  { id: 'a4', name: 'Ivory 230 A3+', price: 5000, unit: '/lbr', category: 'A3+', description: 'Kertas tebal satu sisi putih halus untuk brosur & packaging' },
  { id: 'a5', name: 'Ivory 260 A3+', price: 6000, unit: '/lbr', category: 'A3+', popular: true, description: 'Kertas tebal standar cover, sertifikat & kartu ucapan' },
  { id: 'a6', name: 'Ivory 310 A3+', price: 7000, unit: '/lbr', category: 'A3+', description: 'Kertas sangat tebal premium untuk kemasan & hangtag' },
  { id: 'a7', name: 'Art Paper 150 A3+', price: 4000, unit: '/lbr', category: 'A3+', description: 'Kertas majalah mengkilap untuk flyer & brosur lipat' },
  { id: 'a8', name: 'HVS A3+ (70-80gr)', price: 3000, unit: '/lbr', category: 'A3+', description: 'Kertas HVS ukuran besar untuk denah & draft' },
  { id: 'a9', name: 'BC Aster A3+', price: 7000, unit: '/lbr', category: 'A3+', popular: true, description: 'Kertas bertekstur elegan untuk sertifikat & piagam' },
  { id: 'a10', name: 'HVS A4 / F4', price: 2000, unit: '/lbr', category: 'A3+', description: 'Print dokumen hitam/warna ukuran F4 / A4' },

  // Nota Rim
  { id: 'n1', name: 'Nota Asli Tanpa Copy (1 Ply)', price: 150000, unit: '/rim', category: 'Nota Rim', description: 'Kertas HVS isi 50 buku ukuran 1/4 folio' },
  { id: 'n2', name: 'Nota Asli + Copy 1 (2 Ply NCR)', price: 250000, unit: '/rim', category: 'Nota Rim', popular: true, description: 'Kertas NCR tembus otomatis, rangkap 2 (Putih-Merah)' },
  { id: 'n3', name: 'Nota Asli + Copy 2 (3 Ply NCR)', price: 350000, unit: '/rim', category: 'Nota Rim', description: 'Rangkap 3 NCR (Putih-Merah-Kuning) untuk arsip' },
  { id: 'n4', name: 'Nota Asli + Copy 3 (4 Ply NCR)', price: 440000, unit: '/rim', category: 'Nota Rim', description: 'Rangkap 4 NCR untuk pembukuan komprehensif' },
  { id: 'n5', name: 'Tambahan Porporasi / Nomor', price: 25000, unit: '/rim', category: 'Nota Rim', description: 'Penomoran numerator otomatis & porporasi sobekan rapi' },

  // Stempel
  { id: 's1', name: 'Stempel Flash 1 Warna', price: 75000, unit: '/pcs', category: 'Stempel', description: 'Stempel otomatis tanpa bantalan tinta, warna tajam' },
  { id: 's2', name: 'Stempel Flash 2 Warna', price: 85000, unit: '/pcs', category: 'Stempel', popular: true, description: 'Stempel otomatis kombinasi 2 warna (misal: Biru-Merah)' },
  { id: 's3', name: 'Stempel Kayu Tradisional', price: 35000, unit: '/pcs', category: 'Stempel', description: 'Stempel karet gagang kayu manual dengan bantalan' },

  // Cutting
  { id: 'c1', name: 'Cutting Oracal 651', price: 35, unit: '/cm', category: 'Cutting', popular: true, description: 'Stiker cutting vinyl Jerman awet di mobil & motor' },
  { id: 'c2', name: 'Cutting Oracal 8500 Translucent', price: 45, unit: '/cm', category: 'Cutting', description: 'Stiker cutting khusus neon box menyala merata' },
  { id: 'c3', name: 'Cutting Fosfor Glow In Dark', price: 40, unit: '/cm', category: 'Cutting', description: 'Menyala dalam gelap saat lampu mati untuk rambu darurat' },
  { id: 'c4', name: 'Cutting Sandblast Es Kaca', price: 20, unit: '/cm', category: 'Cutting', description: 'Stiker efek buram es untuk sekat partisi kantor' },
];

export const CATEGORIES: ProductCategory[] = ['Meteran', 'A3+', 'Nota Rim', 'Stempel', 'Cutting'];

// Finishing rates
export const FINISHING_RATES = {
  // Meteran
  mataAyamPerTitik: 500,
  kelimPerMeter: 1000, // Rumus: (Panjang + Lebar) * Qty * 1000
  laminasiDoffMeteran: 25000, // per m2
  laminasiGlossyMeteran: 25000, // per m2

  // A3+
  ciscutPerLembar: 4500,
  potongPerLembar: 2000,
  laminasiDinginA3: 5000,
  laminasiPanasA3: 2000,
  laminatingF4: 4000,
  laminasiDoffA3: 3500,
  laminasiGlossyA3: 3500,

  // Cutting
  multiplier2Warna: 2,

  // A3+ Bolak Balik
  multiplierBolakBalik: 2,
};

export const INITIAL_FINISHING: FinishingOptions = {
  mataAyam: false,
  mataAyamCount: 4,
  kelim: false,
  laminasiDoffM: false,
  laminasiGlossyM: false,
  ciscut: false,
  potong: false,
  laminasiDoffA3: false,
  laminasiGlossyA3: false,
  bolakBalik: false,
  laminasiDingin: false,
  laminasiPanas: false,
  laminatingF4: false,
  warna2x: false,
  tambahanNomor: false,
};

export const STORE_INFO = {
  name: 'WIGATA DIGITAL PRINT',
  tagline: 'Percetakan & Digital Printing Berkualitas',
  address: 'Jl. Pekaja, Dusun II Sokaraja Tengah, 53181',
  locationDetail: '(Selatan PMI Sokaraja)',
  phone: '0823-2340-3108',
  waNumber: '6282323403108',
  note1: 'Desain Setelah ACC',
  note2: 'Jika ada Kesalahan Bukan Tanggung Jawab Kami!',
};

export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const generateNoNota = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `WGT-${year}${month}${day}-${random}`;
};
