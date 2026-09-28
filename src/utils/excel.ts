import * as XLSX from 'xlsx';
import { Transaction, ProductItem, CartItem, ExcelSyncConfig } from '../types';
import { CATALOG_PRODUCTS } from './defaultData';

export const DEFAULT_EXCEL_SYNC_CONFIG: ExcelSyncConfig = {
  webhookUrl: '',
  autoSyncOnSave: true,
  syncIntervalMinutes: 5,
  spreadsheetName: 'Database_Wigata_POS.xlsx',
};

// Generate multi-sheet .xlsx workbook
export function generateExcelWorkbook(
  transactions: Transaction[],
  products: ProductItem[] = CATALOG_PRODUCTS
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // 1. Sheet Transaksi
  const trxRows = transactions.map((t, idx) => ({
    'No': idx + 1,
    'No Nota': t.noNota,
    'Tanggal': t.dateStr,
    'Jam': t.jam,
    'Nama Pelanggan': t.pelanggan || 'Umum',
    'No HP / WA': t.hp || '-',
    'Kasir': t.kasir || 'Admin',
    'Metode Pembayaran': t.paymentMethod.toUpperCase(),
    'Subtotal (Rp)': t.subtotal,
    'Diskon (%)': t.diskonPercent,
    'Diskon (Rp)': t.diskonRp,
    'Grand Total (Rp)': t.grandTotal,
    'Jumlah Bayar (Rp)': t.bayar,
    'Kembalian (Rp)': t.kembalian,
    'Jumlah Item': t.items.length,
    'Status Sync': t.statusSyncExcel || 'local',
  }));

  const wsTrx = XLSX.utils.json_to_sheet(trxRows.length > 0 ? trxRows : [{ 'Pesan': 'Belum ada transaksi' }]);
  XLSX.utils.book_append_sheet(wb, wsTrx, 'Transaksi');

  // 2. Sheet Detail Barang
  const itemRows: Array<Record<string, unknown>> = [];
  let itemCounter = 1;
  transactions.forEach((t) => {
    t.items.forEach((item: CartItem) => {
      const finishings: string[] = [];
      if (item.product.category === 'Meteran') {
        if (item.finishing.mataAyam) finishings.push(`Ring/Mata Ayam (${item.finishing.mataAyamCount} ttk)`);
        if (item.finishing.kelim) finishings.push('Lem Pas');
        if (item.finishing.laminasiDoffM) finishings.push('Lam Doff Mtr');
        if (item.finishing.laminasiGlossyM) finishings.push('Lam Glossy Mtr');
      } else if (item.product.category === 'A3+') {
        if (item.finishing.ciscut) finishings.push('Ciscut');
        if (item.finishing.potong) finishings.push('Potong');
        if (item.finishing.bolakBalik) finishings.push('Bolak Balik (2x)');
        if (item.finishing.laminasiDingin) finishings.push('Lam Dingin A3');
        if (item.finishing.laminasiPanas) finishings.push('Lam Panas A3');
        if (item.finishing.laminatingF4) finishings.push('Laminating F4');
      } else if (item.product.category === 'Cutting') {
        if (item.finishing.warna2x) finishings.push('2 Warna (2x)');
      }

      itemRows.push({
        'No': itemCounter++,
        'No Nota': t.noNota,
        'Tanggal': t.dateStr,
        'Pelanggan': t.pelanggan || 'Umum',
        'Kategori': item.product.category,
        'Nama Produk': item.product.name,
        'Ukuran / Qty':
          item.product.category === 'Meteran'
            ? `${item.panjang}m x ${item.lebar}m`
            : item.product.category === 'Cutting'
            ? `${item.panjang}cm x ${item.lebar}cm`
            : `${item.qty} ${item.product.unit}`,
        'Total Luas (m2/cm)': item.totalLuas || item.qty,
        'Qty': item.qty,
        'Harga Satuan (Rp)': item.product.price,
        'Biaya Cetak Base (Rp)': item.basePrice,
        'Finishing': finishings.join('; ') || 'Polos / Standar',
        'Biaya Finishing (Rp)': item.finishingCost,
        'Biaya Desain (Rp)': item.desainFee,
        'Total Item (Rp)': item.total,
      });
    });
  });

  const wsItems = XLSX.utils.json_to_sheet(itemRows.length > 0 ? itemRows : [{ 'Pesan': 'Belum ada item transaksi' }]);
  XLSX.utils.book_append_sheet(wb, wsItems, 'Detail_Barang');

  // 3. Sheet Katalog Produk
  const prodRows = products.map((p, idx) => ({
    'No': idx + 1,
    'ID Produk': p.id,
    'Nama Produk': p.name,
    'Kategori': p.category,
    'Harga (Rp)': p.price,
    'Satuan': p.unit,
    'Populer': p.popular ? 'YA' : 'TIDAK',
    'Deskripsi': p.description || '',
  }));
  const wsProds = XLSX.utils.json_to_sheet(prodRows);
  XLSX.utils.book_append_sheet(wb, wsProds, 'Katalog_Produk');

  // 4. Sheet Ringkasan Keuangan
  const totalOmset = transactions.reduce((sum, t) => sum + t.grandTotal, 0);
  const tunaiTotal = transactions.filter((t) => t.paymentMethod === 'tunai').reduce((sum, t) => sum + t.grandTotal, 0);
  const qrisTotal = transactions.filter((t) => t.paymentMethod === 'qris').reduce((sum, t) => sum + t.grandTotal, 0);
  const transferTotal = transactions.filter((t) => t.paymentMethod === 'transfer').reduce((sum, t) => sum + t.grandTotal, 0);

  const summaryRows = [
    { 'Indikator': 'Total Transaksi', 'Nilai': transactions.length, 'Satuan': 'Transaksi' },
    { 'Indikator': 'Total Pendapatan / Omset', 'Nilai': totalOmset, 'Satuan': 'Rupiah' },
    { 'Indikator': 'Pembayaran Tunai', 'Nilai': tunaiTotal, 'Satuan': 'Rupiah' },
    { 'Indikator': 'Pembayaran QRIS', 'Nilai': qrisTotal, 'Satuan': 'Rupiah' },
    { 'Indikator': 'Pembayaran Transfer Bank', 'Nilai': transferTotal, 'Satuan': 'Rupiah' },
    { 'Indikator': 'Rata-rata Nilai Transaksi', 'Nilai': transactions.length > 0 ? Math.round(totalOmset / transactions.length) : 0, 'Satuan': 'Rupiah/trx' },
    { 'Indikator': 'Tanggal Laporan Dibuat', 'Nilai': new Date().toLocaleString('id-ID'), 'Satuan': '-' },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan_Laporan');

  return wb;
}

// Download .xlsx file directly
export function exportToExcelFile(transactions: Transaction[], filename: string = 'Database_Wigata_POS.xlsx'): void {
  const wb = generateExcelWorkbook(transactions);
  XLSX.writeFile(wb, filename);
}

// Read and parse imported Excel / CSV file
export async function parseExcelFile(file: File): Promise<{
  success: boolean;
  transactions?: Transaction[];
  products?: ProductItem[];
  error?: string;
}> {
  try {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });

    // Look for Katalog sheet first
    const catalogSheetName = wb.SheetNames.find((name) =>
      name.toLowerCase().includes('katalog') || name.toLowerCase().includes('produk')
    );

    let parsedProducts: ProductItem[] | undefined;
    if (catalogSheetName) {
      const sheet = wb.Sheets[catalogSheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
      parsedProducts = rows
        .map((r, i) => {
          const name = String(r['Nama Produk'] || r['name'] || '').trim();
          const price = Number(r['Harga (Rp)'] || r['price'] || 0);
          const category = (r['Kategori'] || r['category'] || 'Meteran') as ProductItem['category'];
          const unit = String(r['Satuan'] || r['unit'] || '/m²').trim();
          if (!name || isNaN(price)) return null;
          return {
            id: String(r['ID Produk'] || r['id'] || `imp_${i}`),
            name,
            price,
            unit,
            category,
            popular: r['Populer'] === 'YA',
            description: String(r['Deskripsi'] || ''),
          } as ProductItem;
        })
        .filter(Boolean) as ProductItem[];
    }

    return {
      success: true,
      products: parsedProducts && parsedProducts.length > 0 ? parsedProducts : undefined,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Gagal membaca file Excel',
    };
  }
}

// Real-time sync with Google Sheets / Excel Webhook
export async function syncTransactionToExcelWebhook(
  transaction: Transaction,
  webhookUrl: string
): Promise<{ success: boolean; error?: string }> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return { success: false, error: 'URL Webhook Google Sheets / Excel belum diisi' };
  }

  try {
    const payload = {
      action: 'add_transaction',
      timestamp: new Date().toISOString(),
      noNota: transaction.noNota,
      tanggal: transaction.dateStr,
      jam: transaction.jam,
      pelanggan: transaction.pelanggan || 'Umum',
      noHp: transaction.hp || '-',
      kasir: transaction.kasir || 'Admin',
      metode: transaction.paymentMethod.toUpperCase(),
      subtotal: transaction.subtotal,
      diskonPercent: transaction.diskonPercent,
      diskonRp: transaction.diskonRp,
      grandTotal: transaction.grandTotal,
      bayar: transaction.bayar,
      kembalian: transaction.kembalian,
      items: transaction.items.map((it) => ({
        nama: it.product.name,
        kategori: it.product.category,
        panjang: it.panjang,
        lebar: it.lebar,
        qty: it.qty,
        totalLuas: it.totalLuas,
        hargaSatuan: it.product.price,
        finishing: it.finishing,
        biayaDesain: it.desainFee,
        totalItem: it.total,
      })),
    };

    // Google Apps Script requires mode: 'no-cors' or handled response
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Prevents CORS preflight in Google Apps Script
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok && response.type !== 'opaque') {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Koneksi ke Webhook Excel gagal',
    };
  }
}

// Google Apps Script Template code for 1-click copy
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * GOOGLE APPS SCRIPT - DATABASE REAL-TIME WIGATA POS DIGITAL PRINT
 * 
 * CARA MEMASANG (HANYA 1 MENIT):
 * 1. Buka https://sheets.google.com -> Buat Spreadsheet Baru. Beri nama "Database Wigata POS".
 * 2. Klik menu "Ekstensi" -> "Apps Script".
 * 3. Hapus semua kode default, lalu tempel SELURUH KODE di bawah ini.
 * 4. Klik tombol "Terapkan" (Deploy) di kanan atas -> "Kelola Penerapan Baru" (New Deployment).
 * 5. Pilih Jenis: "Aplikasi Web" (Web app).
 * 6. Set "Jalankan sebagai": "Saya" (Me).
 * 7. Set "Siapa yang memiliki akses": "Siapa saja" (Anyone) -> Ini WAJIB agar POS bisa kirim data tanpa login akun Google!
 * 8. Klik "Terapkan" (Deploy) & Izinkan Akses.
 * 9. Salin "URL Aplikasi Web" (contoh: https://script.google.com/macros/s/.../exec)
 * 10. Buka Wigata POS -> Klik tombol "Koneksi Excel" -> Tempel URL ke kolom Webhook!
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    
    // 1. Pastikan Sheet Transaksi ada
    var trxSheet = sheet.getSheetByName("Transaksi");
    if (!trxSheet) {
      trxSheet = sheet.insertSheet("Transaksi");
      trxSheet.appendRow([
        "Waktu Masuk", "No Nota", "Tanggal", "Jam", "Pelanggan", "No HP", 
        "Kasir", "Metode", "Subtotal", "Diskon %", "Diskon Rp", 
        "Grand Total", "Bayar", "Kembalian", "Jumlah Item"
      ]);
      trxSheet.getRange(1, 1, 1, 15).setBackground("#0B1E3A").setFontColor("#FFFFFF").setFontWeight("bold");
    }
    
    // 2. Pastikan Sheet Detail Barang ada
    var itemSheet = sheet.getSheetByName("Detail_Barang");
    if (!itemSheet) {
      itemSheet = sheet.insertSheet("Detail_Barang");
      itemSheet.appendRow([
        "Waktu Masuk", "No Nota", "Tanggal", "Pelanggan", "Nama Produk", 
        "Kategori", "Ukuran/Dimensi", "Qty", "Harga Satuan", 
        "Biaya Desain", "Total Item (Rp)"
      ]);
      itemSheet.getRange(1, 1, 1, 11).setBackground("#FFD23F").setFontColor("#0B1E3A").setFontWeight("bold");
    }
    
    // Simpan baris transaksi
    var now = new Date();
    trxSheet.appendRow([
      now, data.noNota, data.tanggal, data.jam, data.pelanggan, data.noHp,
      data.kasir, data.metode, data.subtotal, data.diskonPercent, data.diskonRp,
      data.grandTotal, data.bayar, data.kembalian, data.items.length
    ]);
    
    // Simpan rincian item
    if (data.items && data.items.length > 0) {
      for (var i = 0; i < data.items.length; i++) {
        var item = data.items[i];
        var dimensi = (item.panjang && item.lebar) ? item.panjang + " x " + item.lebar : "-";
        itemSheet.appendRow([
          now, data.noNota, data.tanggal, data.pelanggan, item.nama,
          item.kategori, dimensi, item.qty, item.hargaSatuan,
          item.biayaDesain, item.totalItem
        ]);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Transaksi tersimpan ke Excel / Google Sheets" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: "ok", message: "Webhook Wigata POS Aktif & Siap Menerima Data" }))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
