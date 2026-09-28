import React, { useState, useMemo } from 'react';
import { Transaction, PrinterConfig } from '../types';
import { formatRupiah } from '../utils/defaultData';
import { ThermalReceipt } from './ThermalReceipt';
import {
  Receipt,
  Search,
  Calendar,
  Eye,
  Trash2,
  CloudCheck,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Printer,
  X,
  Filter,
} from 'lucide-react';

interface RiwayatTabProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  printerConfig: PrinterConfig;
  onOpenPrinterModal: () => void;
  onShowToast: (msg: string) => void;
}

export const RiwayatTab: React.FC<RiwayatTabProps> = ({
  transactions,
  onDeleteTransaction,
  printerConfig,
  onOpenPrinterModal,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'semua' | 'hariIni' | 'mingguIni' | 'bulanIni'>('semua');
  const [selectedTrx, setSelectedTrx] = useState<Transaction | null>(null);

  // Filter logic
  const filteredList = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return transactions.filter((trx) => {
      const trxDate = new Date(trx.date);
      trxDate.setHours(0, 0, 0, 0);

      // Period filter
      if (filterPeriod === 'hariIni') {
        if (trxDate.getTime() !== today.getTime()) return false;
      } else if (filterPeriod === 'mingguIni') {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        if (trxDate < weekAgo || trxDate > today) return false;
      } else if (filterPeriod === 'bulanIni') {
        if (
          trxDate.getMonth() !== today.getMonth() ||
          trxDate.getFullYear() !== today.getFullYear()
        ) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesNota = trx.noNota.toLowerCase().includes(query);
        const matchesName = (trx.pelanggan || '').toLowerCase().includes(query);
        const matchesHp = (trx.hp || '').toLowerCase().includes(query);
        const matchesItem = trx.items.some((it) => it.product.name.toLowerCase().includes(query));
        return matchesNota || matchesName || matchesHp || matchesItem;
      }

      return true;
    });
  }, [transactions, filterPeriod, searchQuery]);

  return (
    <div className="max-w-[1440px] mx-auto p-3 sm:p-4 space-y-4">
      {/* Search and Period Filter Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-black/5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-lg text-[#0B1E3A] flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#FFD23F]" />
              Riwayat Transaksi Penjualan
            </h3>
            <p className="text-xs text-black/50">
              Semua transaksi tersimpan di database lokal & otomatis disinkronkan ke Excel
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#F1F3F8] p-1 rounded-2xl">
            {[
              { id: 'semua', label: 'Semua' },
              { id: 'hariIni', label: 'Hari Ini' },
              { id: 'mingguIni', label: '7 Hari' },
              { id: 'bulanIni', label: 'Bulan Ini' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setFilterPeriod(p.id as typeof filterPeriod)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filterPeriod === p.id
                    ? 'bg-[#0B1E3A] text-white shadow-sm'
                    : 'text-black/60 hover:text-black'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan No Nota, Nama Pelanggan, Nomor HP, atau Nama Produk..."
            className="w-full bg-[#F6F7FB] border border-black/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold outline-none focus:border-[#0B1E3A]"
          />
          <Search className="w-4 h-4 text-black/40 absolute left-3.5 top-3" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-2.5 text-black/40 hover:text-black text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-black/5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-bold text-black/60">
            Ditemukan {filteredList.length} dari {transactions.length} transaksi
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="text-center py-12 bg-[#F6F7FB] rounded-2xl border border-dashed border-black/10 space-y-2">
            <Receipt className="w-8 h-8 text-black/20 mx-auto" />
            <div className="text-sm font-bold text-black/50">Belum ada transaksi pada filter ini</div>
            <div className="text-xs text-black/40">
              Transaksi baru yang disimpan di Kasir akan otomatis muncul di sini.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-black/10">
            <table className="w-full text-xs">
              <thead className="bg-[#0B1E3A] text-white uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-3 text-left">No</th>
                  <th className="p-3 text-left">No Nota</th>
                  <th className="p-3 text-left">Tanggal & Jam</th>
                  <th className="p-3 text-left">Pelanggan</th>
                  <th className="p-3 text-left">Kasir</th>
                  <th className="p-3 text-center">Metode</th>
                  <th className="p-3 text-right">Grand Total</th>
                  <th className="p-3 text-center">Status Excel</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filteredList.map((trx, idx) => (
                  <tr key={trx.id} className="hover:bg-[#F6F7FB]/70 transition">
                    <td className="p-3 text-black/50 font-bold">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-[#0B1E3A]">{trx.noNota}</td>
                    <td className="p-3">
                      <div className="font-semibold">{trx.dateStr}</div>
                      <div className="text-[10px] text-black/40">{trx.jam}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-[#0B1E3A]">{trx.pelanggan || 'Umum'}</div>
                      <div className="text-[10px] text-black/50">{trx.items.length} item • {trx.hp || '-'}</div>
                    </td>
                    <td className="p-3 text-black/70 font-medium">{trx.kasir}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase ${
                          trx.paymentMethod === 'tunai'
                            ? 'bg-emerald-100 text-emerald-800'
                            : trx.paymentMethod === 'qris'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {trx.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3 text-right font-black text-sm text-[#0B1E3A]">
                      {formatRupiah(trx.grandTotal)}
                    </td>
                    <td className="p-3 text-center">
                      {trx.statusSyncExcel === 'synced' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Synced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-black/50 bg-black/5 px-2 py-0.5 rounded-full">
                          Lokal
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedTrx(trx)}
                          className="px-2.5 py-1 rounded-xl bg-[#0B1E3A] hover:bg-black text-white font-bold text-xs flex items-center gap-1 transition"
                          title="Lihat Struk & Cetak Thermal"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Detail</span>
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus nota ${trx.noNota}?`)) {
                              onDeleteTransaction(trx.id);
                              onShowToast(`Nota ${trx.noNota} dihapus`);
                            }
                          }}
                          className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition"
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail / Re-Print Modal */}
      {selectedTrx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-[480px] w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-black/10">
            <div className="bg-[#0B1E3A] text-white p-4 flex items-center justify-between">
              <div>
                <h4 className="font-black text-base">Detail Nota {selectedTrx.noNota}</h4>
                <p className="text-xs text-white/70">{selectedTrx.dateStr} • {selectedTrx.jam}</p>
              </div>
              <button
                onClick={() => setSelectedTrx(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <ThermalReceipt
                transaction={selectedTrx}
                printerConfig={printerConfig}
                onOpenPrinterModal={onOpenPrinterModal}
                onShowToast={onShowToast}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
