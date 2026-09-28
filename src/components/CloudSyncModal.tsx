import React, { useState } from 'react';
import {
  Cloud,
  CheckCircle2,
  RefreshCw,
  Server,
  Database,
  ExternalLink,
  Laptop,
  X,
  Mail,
  Save,
} from 'lucide-react';
import { Transaction, ProductItem } from '../types';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  products: ProductItem[];
  userEmail: string;
  onUpdateUserEmail: (email: string) => void;
  onManualSyncAll: () => Promise<void>;
  onShowToast: (msg: string) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  transactions,
  products,
  userEmail,
  onUpdateUserEmail,
  onManualSyncAll,
  onShowToast,
}) => {
  const [emailInput, setEmailInput] = useState(userEmail || 'wigatadigitalprint@gmail.com');
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  const handleSaveEmail = () => {
    onUpdateUserEmail(emailInput);
    onShowToast(`Akun Wigata disimpan: ${emailInput}`);
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      await onManualSyncAll();
      onShowToast('Semua data berhasil disinkronkan ke Cloud!');
    } catch {
      onShowToast('Sinkronisasi cloud gagal');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0B1E3A] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base flex items-center gap-1.5">
                <span>Sinkronisasi Multi-Komputer (Cloud)</span>
                <span className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                  Aktif
                </span>
              </h3>
              <p className="text-[11px] text-white/70">
                Database Cloud Firestore Real-time Wigata POS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm">
          {/* Status Box */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-black text-emerald-950 text-sm">
                Cloud Database Terhubung Otomatis
              </div>
              <div className="text-xs text-emerald-800 leading-relaxed">
                Anda <strong>tidak perlu lagi login popup</strong> yang diblokir domain. Setiap kali Anda membuat nota baru atau mengubah harga di kasirwigata.netlify.app, data otomatis tersimpan di Cloud dan langsung muncul di komputer lain dalam hitungan detik.
              </div>
            </div>
          </div>

          {/* Email / ID Toko Wigata */}
          <div className="space-y-1.5">
            <label className="font-bold text-xs text-[#0B1E3A] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>Email Akun Google / Pemilik Toko:</span>
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="wigatadigitalprint@gmail.com"
                className="flex-1 px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:border-blue-600 bg-neutral-50"
              />
              <button
                onClick={handleSaveEmail}
                className="bg-[#0B1E3A] hover:bg-black text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan</span>
              </button>
            </div>
            <p className="text-[10.5px] text-neutral-500">
              Email ini digunakan sebagai tanda tangan pengubah nota pada log riwayat transaksi.
            </p>
          </div>

          {/* Cloud Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3 text-center">
              <div className="text-xl font-black text-[#0B1E3A]">{transactions.length}</div>
              <div className="text-[11px] text-neutral-500 font-semibold flex items-center justify-center gap-1 mt-0.5">
                <Database className="w-3 h-3 text-amber-500" />
                <span>Nota di Cloud</span>
              </div>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3 text-center">
              <div className="text-xl font-black text-[#0B1E3A]">{products.length}</div>
              <div className="text-[11px] text-neutral-500 font-semibold flex items-center justify-center gap-1 mt-0.5">
                <Server className="w-3 h-3 text-blue-500" />
                <span>Produk Sinkron</span>
              </div>
            </div>
          </div>

          {/* Cara Pakai di Komputer Lain */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-2">
            <div className="font-bold text-xs text-blue-950 flex items-center gap-1.5">
              <Laptop className="w-4 h-4 text-blue-600" />
              <span>Cara Membuka di Komputer / Laptop Lain:</span>
            </div>
            <ol className="text-xs text-blue-900 space-y-1 list-decimal list-inside leading-relaxed pl-1">
              <li>Buka browser (Chrome / Edge) di komputer lain.</li>
              <li>Ketik alamat: <span className="font-mono bg-blue-100 px-1 py-0.5 rounded text-blue-900 font-bold">https://kasirwigata.netlify.app</span></li>
              <li>Aplikasi akan langsung membaca seluruh riwayat nota dan produk dari cloud secara otomatis!</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neutral-50 border-t border-neutral-200 p-4 flex items-center justify-between">
          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#FFD23F] hover:brightness-95 text-[#0B1E3A] flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Upload & Sinkron Ulang Semua'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-neutral-200 hover:bg-neutral-300 text-neutral-800 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
