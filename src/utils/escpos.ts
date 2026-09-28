import { Transaction, CartItem } from '../types';
import { STORE_INFO, formatNumber } from './defaultData';

export class EscPosEncoder {
  private buffer: number[] = [];

  constructor() {
    this.initialize();
  }

  // Basic ESC/POS commands
  initialize() {
    this.buffer.push(0x1B, 0x40); // ESC @
    return this;
  }

  alignLeft() {
    this.buffer.push(0x1B, 0x61, 0x00);
    return this;
  }

  alignCenter() {
    this.buffer.push(0x1B, 0x61, 0x01);
    return this;
  }

  alignRight() {
    this.buffer.push(0x1B, 0x61, 0x02);
    return this;
  }

  bold(enable: boolean = true) {
    this.buffer.push(0x1B, 0x45, enable ? 0x01 : 0x00);
    return this;
  }

  doubleSize(enable: boolean = true) {
    this.buffer.push(0x1D, 0x21, enable ? 0x11 : 0x00); // GS !
    return this;
  }

  doubleHeight(enable: boolean = true) {
    this.buffer.push(0x1D, 0x21, enable ? 0x01 : 0x00);
    return this;
  }

  underline(enable: boolean = true) {
    this.buffer.push(0x1B, 0x2D, enable ? 0x01 : 0x00);
    return this;
  }

  text(str: string) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }
    return this;
  }

  line(str: string = '') {
    this.text(str + '\n');
    return this;
  }

  separator(char: string = '-', width: number = 32) {
    this.line(char.repeat(width));
    return this;
  }

  twoColumns(left: string, right: string, width: number = 32) {
    const spaceCount = width - (left.length + right.length);
    if (spaceCount < 1) {
      this.line(left);
      this.alignRight().line(right).alignLeft();
    } else {
      this.line(left + ' '.repeat(spaceCount) + right);
    }
    return this;
  }

  feed(lines: number = 3) {
    this.buffer.push(0x1B, 0x64, lines);
    return this;
  }

  cut(partial: boolean = true) {
    this.buffer.push(0x1D, 0x56, partial ? 0x01 : 0x00); // GS V
    return this;
  }

  openCashDrawer() {
    this.buffer.push(0x1B, 0x70, 0x00, 0x19, 0xFA); // ESC p
    return this;
  }

  encode(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

export function generateEscPosReceipt(
  transaction: Transaction,
  paperWidth: 58 | 80 = 58,
  options?: { cut?: boolean; openDrawer?: boolean }
): Uint8Array {
  const encoder = new EscPosEncoder();
  const maxChars = paperWidth === 80 ? 42 : 32;

  if (options?.openDrawer) {
    encoder.openCashDrawer();
  }

  // Header
  encoder.alignCenter();
  encoder.bold(true).doubleHeight(true).line(STORE_INFO.name);
  encoder.bold(false).doubleHeight(false);
  encoder.line(STORE_INFO.address);
  encoder.line(STORE_INFO.locationDetail);
  encoder.line(`WA: ${STORE_INFO.phone}`);
  encoder.separator('-', maxChars);

  // Meta Info
  encoder.alignLeft();
  encoder.twoColumns('No Nota:', transaction.noNota, maxChars);
  encoder.twoColumns('Tanggal:', `${transaction.dateStr} ${transaction.jam}`, maxChars);
  encoder.twoColumns('Pelanggan:', transaction.pelanggan || 'Umum', maxChars);
  if (transaction.hp) {
    encoder.twoColumns('No HP/WA:', transaction.hp, maxChars);
  }
  encoder.twoColumns('Kasir:', transaction.kasir || 'Admin', maxChars);
  encoder.separator('-', maxChars);

  // Items
  transaction.items.forEach((item: CartItem, idx: number) => {
    encoder.bold(true).line(`${idx + 1}. ${item.product.name.toUpperCase()}`);
    encoder.bold(false);

    let desc = '';
    if (item.product.category === 'Meteran') {
      desc = `${item.panjang}x${item.lebar}m x ${item.qty} = ${formatNumber(item.totalLuas, 2)}m2`;
    } else if (item.product.category === 'Cutting') {
      desc = `${Math.round(item.panjang)}x${Math.round(item.lebar)}cm = ${Math.round(item.totalLuas)}cm`;
    } else {
      desc = `${item.qty} ${item.product.unit}`;
    }

    const priceText = `Rp ${formatNumber(item.total)}`;
    encoder.twoColumns(`  ${desc}`, priceText, maxChars);

    // Finishing list
    const finishings: string[] = [];
    if (item.product.category === 'Meteran') {
      if (item.finishing.mataAyam) finishings.push(`Ring/Mata Ayam (${item.finishing.mataAyamCount} ttk)`);
      if (item.finishing.kelim) finishings.push('Lem Pas / Kelim');
      if (item.finishing.laminasiDoffM) finishings.push('Lam. Doff Mtr');
      if (item.finishing.laminasiGlossyM) finishings.push('Lam. Glossy Mtr');
    } else if (item.product.category === 'A3+') {
      if (item.finishing.ciscut) finishings.push('Ciscut (Kiss Cut)');
      if (item.finishing.potong) finishings.push('Potong Jadi');
      if (item.finishing.bolakBalik) finishings.push('Cetak Bolak-Balik');
      if (item.finishing.laminasiDingin) finishings.push('Lam. Dingin A3');
      if (item.finishing.laminasiPanas) finishings.push('Lam. Panas A3');
      if (item.finishing.laminatingF4) finishings.push('Laminating F4');
    } else if (item.product.category === 'Cutting') {
      if (item.finishing.warna2x) finishings.push('Cetak 2 Warna');
    }

    if (finishings.length > 0) {
      encoder.line(`  - ${finishings.join(', ')}`);
    }

    if (item.desainFee > 0) {
      encoder.twoColumns('  - Biaya Desain:', `Rp ${formatNumber(item.desainFee)}`, maxChars);
    }
  });

  encoder.separator('-', maxChars);

  // Totals
  encoder.twoColumns('Subtotal:', `Rp ${formatNumber(transaction.subtotal)}`, maxChars);
  if (transaction.diskonPercent > 0 || transaction.diskonRp > 0) {
    encoder.twoColumns(`Diskon (${transaction.diskonPercent}%):`, `-Rp ${formatNumber(transaction.diskonRp)}`, maxChars);
  }

  encoder.bold(true);
  encoder.twoColumns('GRAND TOTAL:', `Rp ${formatNumber(transaction.grandTotal)}`, maxChars);
  encoder.bold(false);

  const bayarLabel = `Bayar (${transaction.paymentMethod.toUpperCase()}):`;
  encoder.twoColumns(bayarLabel, `Rp ${formatNumber(transaction.bayar)}`, maxChars);

  if (transaction.paymentMethod === 'tunai') {
    encoder.twoColumns('Kembalian:', `Rp ${formatNumber(transaction.kembalian)}`, maxChars);
  }

  encoder.separator('=', maxChars);

  // Footer notes
  encoder.alignCenter();
  encoder.bold(true).line('Terima Kasih Atas Kunjungan Anda!');
  encoder.bold(false);
  encoder.line(STORE_INFO.note1);
  encoder.line(STORE_INFO.note2);
  encoder.line(`Layanan Pelanggan: WA ${STORE_INFO.phone}`);
  encoder.separator('-', maxChars);
  encoder.line('Wigata POS v2.5 - Cloud & Thermal');
  
  // Feed & Cut
  encoder.feed(paperWidth === 80 ? 4 : 3);
  if (options?.cut !== false) {
    encoder.cut(true);
  }

  return encoder.encode();
}

export function generateTestReceipt(paperWidth: 58 | 80 = 58): Uint8Array {
  const encoder = new EscPosEncoder();
  const maxChars = paperWidth === 80 ? 42 : 32;

  encoder.alignCenter();
  encoder.bold(true).doubleHeight(true).line('TEST PRINT THERMAL');
  encoder.bold(false).doubleHeight(false);
  encoder.line(STORE_INFO.name);
  encoder.line(`Mode: ${paperWidth}mm (${maxChars} Kolom)`);
  encoder.separator('=', maxChars);
  
  encoder.alignLeft();
  encoder.twoColumns('Status:', 'TERHUBUNG (OK)', maxChars);
  encoder.twoColumns('Waktu:', new Date().toLocaleTimeString('id-ID'), maxChars);
  encoder.twoColumns('Koneksi:', 'Bluetooth / USB Kabel', maxChars);
  encoder.separator('-', maxChars);
  
  encoder.alignCenter();
  encoder.line('Printer Siap Mencetak Struk!');
  encoder.line('1234567890!@#$%^&*()_+');
  encoder.separator('=', maxChars);
  encoder.feed(3);
  encoder.cut(true);

  return encoder.encode();
}
