import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { formatRupiah } from '../utils/defaultData';
import { exportToExcelFile } from '../utils/excel';
import {
  BarChart3,
  Calendar,
  Download,
  Share2,
  FileSpreadsheet,
  Wallet,
  TrendingUp,
  Banknote,
  QrCode,
  CreditCard,
  Layers,
} from 'lucide-react';

interface LaporanTabProps {
  transactions: Transaction[];
  onShowToast: (msg: string) => void;
}

export const LaporanTab: React.FC<LaporanTabProps> = ({ transactions, onShowToast }) => {
  const [filterPeriod, setFilterPeriod] = useState<'hariIni' | 'mingguIni' | 'bulanIni' | 'semua'>('semua');

  // Filter transactions
  const filteredList = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return transactions.filter((trx) => {
      const trxDate = new Date(trx.date);
      trxDate.setHours(0, 0, 0, 0);

      if (filterPeriod === 'hariIni') {
        return trxDate.getTime() === today.getTime();
      } else if (filterPeriod === 'mingguIni') {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return trxDate >= weekAgo && trxDate <= today;
      } else if (filterPeriod === 'bulanIni') {
        return (
          trxDate.getMonth() === today.getMonth() &&
          trxDate.getFullYear() === today.getFullYear()
        );
      }
      return true;
    });
  }, [transactions, filterPeriod]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalOmset = filteredList.reduce((sum, t) => sum + t.grandTotal, 0);
    const tunaiTotal = filteredList.filter((t) => t.paymentMethod === 'tunai').reduce((sum, t) => sum + t.grandTotal, 0);
    const qrisTotal = filteredList.filter((t) => t.paymentMethod === 'qris').reduce((sum, t) => sum + t.grandTotal, 0);
    const transferTotal = filteredList.filter((t) => t.paymentMethod === 'transfer').reduce((sum, t) => sum + t.grandTotal, 0);

    const countTunai = filteredList.filter((t) => t.paymentMethod === 'tunai').length;
    const countQris = filteredList.filter((t) => t.paymentMethod === 'qris').length;
    const countTransfer = filteredList.filter((t) => t.paymentMethod === 'transfer').length;

    const pctTunai = totalOmset > 0 ? (tunaiTotal / totalOmset) * 100 : 0;
    const pctQris = totalOmset > 0 ? (qrisTotal / totalOmset) * 100 : 0;
    const pctTransfer = totalOmset > 0 ? (transferTotal / totalOmset) * 100 : 0;

    let totalItemTerjual = 0;
    filteredList.forEach((t) => {
      t.items.forEach((it) => {
        totalItemTerjual += it.qty;
      });
    });

    const rataRata = filteredList.length > 0 ? Math.round(totalOmset / filteredList.length) : 0;

    return {
      totalOmset,
      tunaiTotal,
      qrisTotal,
      transferTotal,
      countTunai,
      countQris,
      countTransfer,
      pctTunai,
      pctQris,
      pctTransfer,
      totalItemTerjual,
      rataRata,
    };
  }, [filteredList]);

  // Export filtered transactions to Excel
  const handleExportFilteredExcel = () => {
    exportToExcelFile(
      filteredList,
      `Laporan_Wigata_${filterPeriod}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    onShowToast(`Laporan Excel (${filterPeriod}) berhasil diunduh`);
  };

  // Share summary via WhatsApp
  const handleShareLaporanWA = async () => {
    const periodLabel =
      filterPeriod === 'hariIni'
        ? 'Hari Ini'
        : filterPeriod === 'mingguIni'
        ? '7 Hari Terakhir'
        : filterPeriod === 'bulanIni'
        ? 'Bulan Ini'
        : 'Semua Periode';

    let msg = `*LAPORAN PENDAPATAN WIGATA DIGITAL PRINT*\n`;
    msg += `Periode: ${periodLabel}\n`;
    msg += `Tanggal: ${new Date().toLocaleString('id-ID')}\n`;
    msg += `--------------------------------\n`;
    msg += `*TOTAL OMSET: ${formatRupiah(stats.totalOmset)}*\n`;
    msg += `Total Transaksi: ${filteredList.length} nota\n`;
    msg += `Total Item Dicetak: ${stats.totalItemTerjual} pcs/lbr/m\n`;
    msg += `Rata-rata / Nota: ${formatRupiah(stats.rataRata)}\n`;
    msg += `--------------------------------\n`;
    msg += `Rincian Pembayaran:\n`;
    msg += `- Tunai    : ${formatRupiah(stats.tunaiTotal)} (${stats.countTunai} trx - ${stats.pctTunai.toFixed(1)}%)\n`;
    msg += `- QRIS     : ${formatRupiah(stats.qrisTotal)} (${stats.countQris} trx - ${stats.pctQris.toFixed(1)}%)\n`;
    msg += `- Transfer : ${formatRupiah(stats.transferTotal)} (${stats.countTransfer} trx - ${stats.pctTransfer.toFixed(1)}%)\n`;
    msg += `--------------------------------\n`;
    msg += `Wigata POS Digital Print Sokaraja`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Laporan Pendapatan Wigata',
          text: msg,
        });
        onShowToast('Laporan berhasil dibagikan');
        return;
      } catch {
        // Fallback
      }
    }

    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    onShowToast('Membuka WhatsApp untuk membagikan laporan...');
  };

  return (
    <div className="max-w-[1440px] mx-auto p-3 sm:p-4 space-y-4">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-black/5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-lg text-[#0B1E3A] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#FFD23F]" />
              Laporan Pendapatan & Omset Penjualan
            </h3>
            <p className="text-xs text-black/50">
              Rekapitulasi otomatis berdasarkan transaksi kasir & sinkronisasi database Excel
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportFilteredExcel}
              className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Download Excel (.xlsx)
            </button>
            <button
              onClick={handleShareLaporanWA}
              className="px-4 py-2 rounded-2xl bg-[#25D366] hover:bg-[#1ebe5a] text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share WA
            </button>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex gap-1.5 bg-[#F1F3F8] p-1 rounded-2xl w-fit">
          {[
            { id: 'hariIni', label: 'Hari Ini' },
            { id: 'mingguIni', label: '7 Hari Terakhir' },
            { id: 'bulanIni', label: 'Bulan Ini' },
            { id: 'semua', label: 'Semua Waktu' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterPeriod(tab.id as typeof filterPeriod)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                filterPeriod === tab.id
                  ? 'bg-[#0B1E3A] text-white shadow-sm'
                  : 'text-black/60 hover:text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Omset */}
        <div className="bg-[#0B1E3A] text-white rounded-3xl p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-black tracking-wider uppercase text-[#FFD23F]">
              Total Pendapatan (Omset)
            </div>
            <div className="text-2xl font-black mt-1 tracking-tight text-white">
              {formatRupiah(stats.totalOmset)}
            </div>
          </div>
          <div className="pt-2 border-t border-white/10 flex justify-between text-xs text-white/70">
            <span>{filteredList.length} Transaksi</span>
            <span>Rata-rata: {formatRupiah(stats.rataRata)}</span>
          </div>
        </div>

        {/* Tunai */}
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-3xl p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-black tracking-wider uppercase text-emerald-700 flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5" /> Pembayaran Tunai
            </div>
            <div className="text-xl font-black mt-1 text-emerald-950">
              {formatRupiah(stats.tunaiTotal)}
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-emerald-800/80 mb-1">
              <span>{stats.countTunai} trx</span>
              <span className="font-bold">{stats.pctTunai.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-emerald-200/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${stats.pctTunai}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* QRIS */}
        <div className="bg-blue-50 border border-blue-200 text-blue-950 rounded-3xl p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-black tracking-wider uppercase text-blue-700 flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5" /> Pembayaran QRIS
            </div>
            <div className="text-xl font-black mt-1 text-blue-950">
              {formatRupiah(stats.qrisTotal)}
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-blue-800/80 mb-1">
              <span>{stats.countQris} trx</span>
              <span className="font-bold">{stats.pctQris.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-blue-200/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${stats.pctQris}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Transfer */}
        <div className="bg-amber-50 border border-amber-200 text-amber-950 rounded-3xl p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-black tracking-wider uppercase text-amber-700 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5" /> Transfer Bank
            </div>
            <div className="text-xl font-black mt-1 text-amber-950">
              {formatRupiah(stats.transferTotal)}
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-amber-800/80 mb-1">
              <span>{stats.countTransfer} trx</span>
              <span className="font-bold">{stats.pctTransfer.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-amber-200/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${stats.pctTransfer}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Proportion Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-black/5 space-y-3">
        <h4 className="font-bold text-sm text-[#0B1E3A]">
          Proporsi Metode Pembayaran
        </h4>
        <div className="w-full h-7 rounded-2xl overflow-hidden flex bg-neutral-100 p-1 gap-1">
          {stats.pctTunai > 0 && (
            <div
              className="h-full bg-emerald-500 rounded-xl flex items-center justify-center text-[10px] font-black text-white transition-all"
              style={{ width: `${stats.pctTunai}%` }}
            >
              {stats.pctTunai > 10 ? `TUNAI ${stats.pctTunai.toFixed(0)}%` : ''}
            </div>
          )}
          {stats.pctQris > 0 && (
            <div
              className="h-full bg-blue-500 rounded-xl flex items-center justify-center text-[10px] font-black text-white transition-all"
              style={{ width: `${stats.pctQris}%` }}
            >
              {stats.pctQris > 10 ? `QRIS ${stats.pctQris.toFixed(0)}%` : ''}
            </div>
          )}
          {stats.pctTransfer > 0 && (
            <div
              className="h-full bg-amber-500 rounded-xl flex items-center justify-center text-[10px] font-black text-white transition-all"
              style={{ width: `${stats.pctTransfer}%` }}
            >
              {stats.pctTransfer > 10 ? `TRF ${stats.pctTransfer.toFixed(0)}%` : ''}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
            <span>Tunai: {formatRupiah(stats.tunaiTotal)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
            <span>QRIS: {formatRupiah(stats.qrisTotal)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
            <span>Transfer: {formatRupiah(stats.transferTotal)}</span>
          </div>
        </div>
      </div>

      {/* Transaction List for this Report */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-black/5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-[#0B1E3A]">
            Rincian Transaksi ({filteredList.length} Nota)
          </h4>
          <span className="text-xs text-black/50">
            Terakhir diupdate: {new Date().toLocaleTimeString('id-ID')}
          </span>
        </div>

        {filteredList.length === 0 ? (
          <div className="text-center py-8 text-xs text-black/40">
            Tidak ada transaksi pada filter periode ini.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-black/10">
            <table className="w-full text-xs">
              <thead className="bg-[#0B1E3A] text-white text-[11px] uppercase">
                <tr>
                  <th className="p-3 text-left">No</th>
                  <th className="p-3 text-left">No Nota</th>
                  <th className="p-3 text-left">Waktu</th>
                  <th className="p-3 text-left">Pelanggan</th>
                  <th className="p-3 text-left">Item Utama</th>
                  <th className="p-3 text-center">Metode</th>
                  <th className="p-3 text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filteredList.map((trx, idx) => (
                  <tr key={trx.id} className="hover:bg-[#F6F7FB]/70">
                    <td className="p-3 text-black/50 font-bold">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-[#0B1E3A]">{trx.noNota}</td>
                    <td className="p-3">{trx.dateStr} {trx.jam}</td>
                    <td className="p-3 font-bold">{trx.pelanggan || 'Umum'}</td>
                    <td className="p-3 text-black/70">
                      {trx.items.map((it) => `${it.product.name} (${it.qty})`).join(', ')}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
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
                    <td className="p-3 text-right font-black text-[#0B1E3A]">
                      {formatRupiah(trx.grandTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
