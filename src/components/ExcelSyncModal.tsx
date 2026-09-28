import React, { useState } from 'react';
import { ExcelSyncConfig, Transaction, ProductItem } from '../types';
import {
  exportToExcelFile,
  parseExcelFile,
  syncTransactionToExcelWebhook,
  GOOGLE_APPS_SCRIPT_TEMPLATE,
} from '../utils/excel';
import {
  FileSpreadsheet,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Upload,
  RefreshCw,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface ExcelSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncConfig: ExcelSyncConfig;
  onUpdateConfig: (cfg: Partial<ExcelSyncConfig>) => void;
  transactions: Transaction[];
  products: ProductItem[];
  onImportProducts: (newProds: ProductItem[]) => void;
  onShowToast: (msg: string) => void;
}

export const ExcelSyncModal: React.FC<ExcelSyncModalProps> = ({
  isOpen,
  onClose,
  syncConfig,
  onUpdateConfig,
  transactions,
  products,
  onImportProducts,
  onShowToast,
}) => {
  const [webhookInput, setWebhookInput] = useState(syncConfig.webhookUrl || '');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  if (!isOpen) return null;

  const handleSaveWebhook = () => {
    onUpdateConfig({ webhookUrl: webhookInput.trim() });
    onShowToast('Pengaturan URL Webhook Excel disimpan');
  };

  const handleTestConnection = async () => {
    if (!webhookInput || !webhookInput.startsWith('http')) {
      onShowToast('Masukkan URL Webhook Google Sheets / Excel terlebih dahulu');
      return;
    }
    setTestingConnection(true);
    setConnectionStatus('idle');

    try {
      // Create a test ping transaction
      const dummyTrx: Transaction = {
        id: 'test_ping',
        noNota: 'TEST-CONNECTION',
        date: new Date().toISOString(),
        dateStr: new Date().toLocaleDateString('id-ID'),
        tanggalDisplay: 'Tes Koneksi',
        jam: new Date().toLocaleTimeString('id-ID'),
        pelanggan: 'Tes Webhook Real-time',
        hp: '-',
        kasir: 'Sistem',
        items: [],
        subtotal: 0,
        diskonPercent: 0,
        diskonRp: 0,
        grandTotal: 0,
        paymentMethod: 'tunai',
        bayar: 0,
        kembalian: 0,
      };

      const res = await syncTransactionToExcelWebhook(dummyTrx, webhookInput.trim());
      if (res.success) {
        setConnectionStatus('success');
        onUpdateConfig({ webhookUrl: webhookInput.trim(), lastSyncedAt: new Date().toLocaleTimeString('id-ID') });
        onShowToast('Koneksi ke Google Sheets / Excel Webhook BERHASIL!');
      } else {
        setConnectionStatus('failed');
        onShowToast(`Koneksi Gagal: ${res.error}`);
      }
    } catch {
      setConnectionStatus('failed');
      onShowToast('Koneksi Gagal: Periksa URL Webhook');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
      setCopiedCode(true);
      onShowToast('Kode Apps Script berhasil disalin ke clipboard!');
      setTimeout(() => setCopiedCode(false), 3000);
    } catch {
      onShowToast('Gagal menyalin kode secara otomatis');
    }
  };

  const handleExportExcel = () => {
    exportToExcelFile(transactions, `Wigata_POS_Database_${new Date().toISOString().slice(0, 10)}.xlsx`);
    onShowToast('File Excel (.xlsx) 4-Sheet berhasil diunduh!');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onShowToast('Membaca file Excel...');
    const result = await parseExcelFile(file);
    if (result.success && result.products && result.products.length > 0) {
      onImportProducts(result.products);
      onShowToast(`Berhasil mengimpor ${result.products.length} produk dari Excel!`);
    } else {
      onShowToast(result.error || 'Gagal mengimpor produk dari file Excel');
    }
    e.target.value = '';
  };

  const handleSyncAllTransactions = async () => {
    if (!syncConfig.webhookUrl) {
      onShowToast('Masukkan URL Webhook Excel terlebih dahulu');
      return;
    }
    if (transactions.length === 0) {
      onShowToast('Belum ada transaksi untuk disinkronkan');
      return;
    }

    setIsSyncingAll(true);
    let successCount = 0;
    for (const trx of transactions) {
      const res = await syncTransactionToExcelWebhook(trx, syncConfig.webhookUrl);
      if (res.success) successCount++;
      await new Promise((r) => setTimeout(r, 200));
    }
    setIsSyncingAll(false);
    onShowToast(`Sinkronisasi selesai: ${successCount} dari ${transactions.length} transaksi terkirim ke Excel`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-[620px] w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-black/10">
        {/* Header */}
        <div className="bg-[#0B1E3A] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow">
              <FileSpreadsheet className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-lg tracking-tight leading-tight">Koneksi Database Excel Real-Time</h3>
              <p className="text-xs text-white/70">Google Sheets / Excel Cloud Webhook & Ekspor File .xlsx</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Status Bar */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              syncConfig.webhookUrl
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Cloud className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold text-sm">
                  {syncConfig.webhookUrl ? 'Koneksi Cloud Excel Aktif' : 'Koneksi Belum Dikonfigurasi'}
                </div>
                <div className="text-xs opacity-80">
                  {syncConfig.webhookUrl
                    ? `Sinkronisasi otomatis: ${syncConfig.autoSyncOnSave ? 'Aktif' : 'Manual'} • ${transactions.length} transaksi tersimpan`
                    : 'Sambungkan ke Google Sheets/Excel agar data tersimpan aman secara online'}
                </div>
              </div>
            </div>
            {syncConfig.webhookUrl && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-200/80 text-emerald-900 font-extrabold text-[11px]">
                ONLINE
              </span>
            )}
          </div>

          {/* Webhook URL Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-black/60">
              URL Webhook Google Sheets / Excel Web App
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={webhookInput}
                onChange={(e) => setWebhookInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="flex-1 bg-[#F6F7FB] border border-black/10 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-[#0B1E3A]"
              />
              <button
                onClick={handleSaveWebhook}
                className="bg-[#0B1E3A] hover:bg-black text-white font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                Simpan
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="bg-[#F1F3F8] hover:bg-black/10 text-[#0B1E3A] font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {testingConnection ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-amber-500" />}
                  Uji Koneksi Real-time
                </button>
                {connectionStatus === 'success' && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Terhubung
                  </span>
                )}
                {connectionStatus === 'failed' && (
                  <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Gagal
                  </span>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0B1E3A]">
                <input
                  type="checkbox"
                  checked={syncConfig.autoSyncOnSave}
                  onChange={(e) => onUpdateConfig({ autoSyncOnSave: e.target.checked })}
                  className="w-4 h-4 accent-[#0B1E3A]"
                />
                Auto-sync saat simpan nota
              </label>
            </div>
          </div>

          {/* 3 Step Tutorial with 1-Click Code Copy */}
          <div className="bg-[#F8FAFC] border border-blue-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Cara Hubungkan ke Excel / Google Sheets (1 Menit):
              </div>
              <button
                onClick={handleCopyCode}
                className="bg-[#FFD23F] hover:brightness-95 text-[#0B1E3A] px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1 shadow-sm transition"
              >
                {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Tersalin!' : 'Salin Script Google Sheets'}
              </button>
            </div>
            <ol className="text-xs text-black/70 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>
                Buka <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold inline-flex items-center gap-0.5">Google Sheets <ExternalLink className="w-2.5 h-2.5" /></a> dan buat Spreadsheet baru dengan nama <strong>"Database Wigata POS"</strong>.
              </li>
              <li>
                Di menu atas Google Sheets, klik <strong>Ekstensi &gt; Apps Script</strong>. Hapus isi lama, lalu <strong>tempel script</strong> yang baru saja disalin.
              </li>
              <li>
                Klik <strong>Terapkan (Deploy) &gt; Penerapan Baru</strong>, pilih <strong>Aplikasi Web</strong>, pilih Akses: <strong>"Siapa saja (Anyone)"</strong>, lalu salin URL Web App dan tempel pada kolom di atas!
              </li>
            </ol>
            <div className="text-[11px] text-black/50 bg-white p-2 rounded-xl border border-black/5">
              💡 <strong>Keuntungan:</strong> Setiap kali kasir menyimpan transaksi, baris data langsung masuk ke Excel Google Sheets detik itu juga! Bisa dibuka di Excel desktop, dihitung rumus omset, atau dibagikan ke tim keuangan.
            </div>
          </div>

          {/* Manual File Actions: Export .xlsx and Import */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-black/60">Ekspor & Impor File Excel (.xlsx)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Export Full XLSX */}
              <button
                onClick={handleExportExcel}
                className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-950 flex items-center gap-3 transition text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-emerald-950 leading-tight">Download File Excel (.xlsx)</div>
                  <div className="text-[11px] text-emerald-800/80 leading-tight mt-0.5">
                    Berisi 4 Sheet: Transaksi, Detail Barang, Katalog & Ringkasan
                  </div>
                </div>
              </button>

              {/* Import Catalog XLSX */}
              <label className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-950 flex items-center gap-3 transition text-left cursor-pointer group">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleImportFile}
                  className="hidden"
                />
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-blue-950 leading-tight">Impor Katalog dari Excel</div>
                  <div className="text-[11px] text-blue-800/80 leading-tight mt-0.5">
                    Update harga & daftar produk massal via file .xlsx
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Sync All Pending Button */}
          {syncConfig.webhookUrl && (
            <div className="pt-1">
              <button
                onClick={handleSyncAllTransactions}
                disabled={isSyncingAll}
                className="w-full py-2.5 rounded-xl bg-[#0B1E3A] hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isSyncingAll ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Cloud className="w-3.5 h-3.5" />
                )}
                {isSyncingAll
                  ? 'Sedang Mengirim Data ke Excel...'
                  : `Sinkronkan Ulang Seluruh Riwayat (${transactions.length} Transaksi) ke Excel`}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F6F7FB] border-t border-black/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#0B1E3A] text-white font-bold text-sm hover:bg-black transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
