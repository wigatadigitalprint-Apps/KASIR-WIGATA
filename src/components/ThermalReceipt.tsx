import React, { useRef, useState } from 'react';
import { Transaction, PrinterConfig } from '../types';
import { STORE_INFO, formatRupiah, formatNumber } from '../utils/defaultData';
import { printerService } from '../utils/printer';
import {
  Printer,
  Share2,
  FileText,
  FileDown,
  Settings,
  Sparkles,
} from 'lucide-react';
import html2canvas from 'html2canvas';

interface ThermalReceiptProps {
  transaction: Transaction;
  printerConfig: PrinterConfig;
  onOpenPrinterModal: () => void;
  onShowToast: (msg: string) => void;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  transaction,
  printerConfig,
  onOpenPrinterModal,
  onShowToast,
}) => {
  const [paperWidth, setPaperWidth] = useState<58 | 80>(printerConfig.paperWidth || 58);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const getFinishingLabels = (fin: typeof transaction.items[0]['finishing'], cat: string) => {
    const list: string[] = [];
    if (cat === 'Meteran') {
      if (fin.mataAyam) list.push(`Ring/Mata Ayam (${fin.mataAyamCount} ttk)`);
      if (fin.kelim) list.push('Lem Pas / Kelim');
      if (fin.laminasiDoffM) list.push('Lam. Doff Mtr');
      if (fin.laminasiGlossyM) list.push('Lam. Glossy Mtr');
    } else if (cat === 'A3+') {
      if (fin.ciscut) list.push('Ciscut (Kiss Cut)');
      if (fin.potong) list.push('Potong Jadi');
      if (fin.bolakBalik) list.push('Bolak Balik (2x)');
      if (fin.laminasiDingin) list.push('Lam. Dingin A3');
      if (fin.laminasiPanas) list.push('Lam. Panas A3');
      if (fin.laminatingF4) list.push('Laminating F4');
    } else if (cat === 'Cutting') {
      if (fin.warna2x) list.push('2 Warna (2x)');
    }
    return list;
  };

  // Cetak Struk: Menyesuaikan panjang struk nota saja & posisi kanan kiri di tengah
  const handlePrintStruk = () => {
    const receiptEl = receiptRef.current;
    if (!receiptEl) {
      window.print();
      return;
    }

    // Buat iframe terisolasi agar tinggi kertas pas mengikuti isi struk dan posisi di tengah
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const receiptHtml = receiptEl.innerHTML;
    const printWidthMm = paperWidth;
    const innerContentWidthMm = paperWidth === 80 ? '72mm' : '52mm';

    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Struk ${transaction.noNota}</title>
  <style>
    @page {
      size: ${printWidthMm}mm auto;
      margin: 0mm !important;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    html, body {
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: 'Courier New', Courier, monospace !important;
      font-size: 11px !important;
      line-height: 1.25 !important;
      height: auto !important;
      min-height: 0 !important;
      display: flex !important;
      justify-content: center !important; /* POSISI KANAN KIRI DI TENGAH */
      align-items: flex-start !important;
    }
    .print-wrapper {
      width: ${innerContentWidthMm};
      max-width: ${innerContentWidthMm};
      margin: 0 auto !important; /* POSISI KANAN KIRI DI TENGAH */
      padding: 1.5mm 1mm 3mm 1mm;
      height: auto !important; /* MENYESUAIKAN PANJANG STRUK */
    }
    div, p, span {
      margin-top: 0;
      margin-bottom: 0;
    }
  </style>
</head>
<body>
  <div class="print-wrapper">
    ${receiptHtml}
  </div>
</body>
</html>`);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch {
          // ignore
        }
      }, 1500);
    }, 200);

    onShowToast('Membuka cetak struk (panjang pas & di tengah)...');
  };

  // Download PDF
  const handleDownloadPDF = () => {
    handlePrintStruk();
  };

  // Share WA PNG (capture receipt as PNG image)
  const handleShareWAPNG = async () => {
    const receiptEl = receiptRef.current;
    if (!receiptEl) return;

    setIsGeneratingImage(true);
    onShowToast('Menyiapkan gambar struk PNG...');

    try {
      const canvas = await html2canvas(receiptEl, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      canvas.toBlob(async (blob) => {
        setIsGeneratingImage(false);
        if (!blob) return;

        const file = new File([blob], `Struk-${transaction.noNota}.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `Struk ${transaction.noNota}`,
              text: `Struk Nota ${transaction.noNota} - Wigata Digital Print`,
            });
            onShowToast('Struk PNG berhasil dibagikan');
            return;
          } catch {
            // fallback
          }
        }

        // Direct Download if share not supported
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Struk-${transaction.noNota}.png`;
        a.click();
        URL.revokeObjectURL(url);
        onShowToast('Gambar struk PNG berhasil diunduh');
      }, 'image/png');
    } catch {
      setIsGeneratingImage(false);
      onShowToast('Gagal memproses gambar struk');
    }
  };

  // Download TXT
  const handleDownloadTxt = () => {
    const maxChars = paperWidth === 80 ? 42 : 32;
    const lineSep = '-'.repeat(maxChars);
    const doubleSep = '='.repeat(maxChars);

    let text = `${STORE_INFO.name}\n`;
    text += `${STORE_INFO.address}\n`;
    text += `${STORE_INFO.locationDetail}\n`;
    text += `WA: ${STORE_INFO.phone}\n`;
    text += `${lineSep}\n`;
    text += `No Nota : ${transaction.noNota}\n`;
    text += `Tanggal : ${transaction.dateStr} ${transaction.jam}\n`;
    text += `Pelanggan: ${transaction.pelanggan || 'Umum'}\n`;
    if (transaction.hp) text += `No HP   : ${transaction.hp}\n`;
    text += `Kasir   : ${transaction.kasir || 'Admin'}\n`;
    text += `${lineSep}\n`;

    transaction.items.forEach((item, idx) => {
      text += `${idx + 1}. ${item.product.name.toUpperCase()} (${item.product.category})\n`;
      if (item.product.category === 'Meteran') {
        text += `   ${item.panjang}x${item.lebar}m x ${item.qty} = ${formatNumber(item.totalLuas, 2)}m2 @${formatNumber(item.product.price)}\n`;
      } else if (item.product.category === 'Cutting') {
        text += `   ${Math.round(item.panjang)}x${Math.round(item.lebar)}cm = ${Math.round(item.totalLuas)}cm @${formatNumber(item.product.price)}\n`;
      } else {
        text += `   ${item.qty} ${item.product.unit} @${formatNumber(item.product.price)}\n`;
      }

      const fins = getFinishingLabels(item.finishing, item.product.category);
      if (fins.length > 0) {
        text += `   - Fin: ${fins.join(', ')}\n`;
      }
      if (item.desainFee > 0) {
        text += `   - Desain: ${formatRupiah(item.desainFee)}\n`;
      }
      text += `   => ${formatRupiah(item.total)}\n`;
    });

    text += `${lineSep}\n`;
    text += `Subtotal    : ${formatRupiah(transaction.subtotal)}\n`;
    if (transaction.diskonPercent > 0 || transaction.diskonRp > 0) {
      text += `Diskon (${transaction.diskonPercent}%) : -${formatRupiah(transaction.diskonRp)}\n`;
    }
    text += `GRAND TOTAL : ${formatRupiah(transaction.grandTotal)}\n`;
    text += `Bayar (${transaction.paymentMethod.toUpperCase()}) : ${formatRupiah(transaction.bayar)}\n`;
    if (transaction.paymentMethod === 'tunai') {
      text += `Kembalian   : ${formatRupiah(transaction.kembalian)}\n`;
    }
    text += `${doubleSep}\n`;
    text += `Terima Kasih Atas Kunjungan Anda!\n`;
    text += `${STORE_INFO.note1}\n`;
    text += `${STORE_INFO.note2}\n`;
    text += `WA: ${STORE_INFO.phone}\n`;
    text += `Wigata POS Digital Print\n`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Struk-${transaction.noNota}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Struk TXT berhasil diunduh');
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-black/5 space-y-4">
      {/* Header & Width Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-black text-sm uppercase tracking-wide text-[#0B1E3A] flex items-center gap-1.5">
            <Printer className="w-4 h-4 text-[#FFD23F]" />
            STRUK
          </h3>
          <p className="text-[11px] text-black/50">Tampilan struk mini POS presisi</p>
        </div>

        <div className="flex items-center gap-1 bg-[#F1F3F8] p-1 rounded-xl">
          <button
            onClick={() => setPaperWidth(58)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              paperWidth === 58 ? 'bg-[#0B1E3A] text-white shadow-sm' : 'text-black/60 hover:text-black'
            }`}
          >
            58mm
          </button>
          <button
            onClick={() => setPaperWidth(80)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              paperWidth === 80 ? 'bg-[#0B1E3A] text-white shadow-sm' : 'text-black/60 hover:text-black'
            }`}
          >
            80mm
          </button>
        </div>
      </div>

      {/* Visual Paper Preview Container - Centered */}
      <div className="bg-[#EBEFF5] p-4 rounded-2xl flex justify-center overflow-x-auto shadow-inner">
        <div
          id="thermal-printable-receipt"
          ref={receiptRef}
          style={{ width: paperWidth === 80 ? '360px' : '280px' }}
          className="bg-white text-black p-4 rounded-xl shadow-md border border-neutral-200 font-mono text-[11px] leading-snug space-y-2 select-text mx-auto"
        >
          {/* Header */}
          <div className="text-center space-y-0.5 pb-1 border-b border-dashed border-black/40">
            <div className="font-black text-[13px] tracking-tight text-[#0B1E3A]">
              {STORE_INFO.name}
            </div>
            <div className="text-[10px] text-black/70 leading-tight">
              {STORE_INFO.address}
              <br />
              {STORE_INFO.locationDetail}
              <br />
              WA: {STORE_INFO.phone}
            </div>
          </div>

          {/* Meta Info */}
          <div className="text-[10px] space-y-0.5 border-b border-dashed border-black/40 pb-1.5">
            <div className="flex justify-between">
              <span className="text-black/60">No Nota :</span>
              <span className="font-bold">{transaction.noNota}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/60">Tanggal :</span>
              <span>{transaction.dateStr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/60">Jam :</span>
              <span>{transaction.jam}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/60">Pelanggan:</span>
              <span className="font-bold">{transaction.pelanggan || 'Umum'}</span>
            </div>
            {transaction.hp && (
              <div className="flex justify-between">
                <span className="text-black/60">HP :</span>
                <span>{transaction.hp}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-black/60">Kasir :</span>
              <span>{transaction.kasir || 'Admin'}</span>
            </div>
          </div>

          {/* Item List */}
          <div className="space-y-2 py-1 border-b border-dashed border-black/40">
            {transaction.items.length === 0 ? (
              <div className="text-center text-black/40 py-2">Keranjang kosong</div>
            ) : (
              transaction.items.map((item, idx) => {
                const fins = getFinishingLabels(item.finishing, item.product.category);
                return (
                  <div key={item.cartId || idx} className="space-y-0.5">
                    <div className="font-bold flex justify-between">
                      <span>{idx + 1}. {item.product.name.toUpperCase()}</span>
                      <span>{formatRupiah(item.total)}</span>
                    </div>
                    <div className="text-[10px] text-black/70">
                      {item.product.category === 'Meteran'
                        ? `${item.panjang}m x ${item.lebar}m x ${item.qty} = ${formatNumber(item.totalLuas, 2)}m2`
                        : item.product.category === 'Cutting'
                        ? `Ukuran: ${Math.round(item.panjang)}cm x ${Math.round(item.lebar)}cm = ${Math.round(item.luas)}cm x ${item.qty} pcs`
                        : `${item.qty} ${item.product.unit}`}
                    </div>
                    <div className="text-[10px] text-black/70">
                      @{formatNumber(item.product.price)} {item.product.unit} {item.product.category === 'A3+' && item.finishing.bolakBalik ? '(x2)' : ''} = {formatRupiah(item.basePrice)}
                    </div>
                    {fins.length > 0 && (
                      <div className="text-[9.5px] text-black/60 italic pl-2">
                        {fins.map((f, i) => (
                          <div key={i}>- {f}</div>
                        ))}
                      </div>
                    )}
                    {item.desainFee > 0 && (
                      <div className="text-[9.5px] text-black/60 pl-2">
                        Desain: {formatRupiah(item.desainFee)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Summary / Totals */}
          <div className="space-y-1 text-[11px] pt-1 border-b border-dashed border-black/40 pb-1.5">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatRupiah(transaction.subtotal)}</span>
            </div>
            {(transaction.diskonPercent > 0 || transaction.diskonRp > 0) && (
              <div className="flex justify-between text-red-600 font-bold">
                <span>Diskon {transaction.diskonPercent}%</span>
                <span>-{formatRupiah(transaction.diskonRp)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-black text-[#0B1E3A] pt-1 border-t border-black/20">
              <span>GRAND TOTAL</span>
              <span>{formatRupiah(transaction.grandTotal)}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Bayar ({transaction.paymentMethod.toUpperCase()})</span>
              <span>{formatRupiah(transaction.bayar)}</span>
            </div>
            {transaction.paymentMethod === 'tunai' && (
              <div className="flex justify-between text-[10px] font-bold">
                <span>Kembalian</span>
                <span>{formatRupiah(transaction.kembalian > 0 ? transaction.kembalian : 0)}</span>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="text-center text-[9.5px] text-black/70 space-y-0.5 pt-1">
            <div className="font-bold text-black">Terima kasih Sudah Order</div>
            <div>{STORE_INFO.note1}</div>
            <div>{STORE_INFO.note2}</div>
            <div className="pt-1 text-[9px] text-black/50">
              Hubungi WA 082323403108
              <br />
              Dicetak: {new Date().toLocaleString('id-ID')}
              <br />
              <span className="font-bold">KASIR WIGATA DIGITAL PRINT</span>
              <br />
              <span className="text-[8.5px]">Powered by Wigata POS v2.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Kembali ke Tampilan Semula dengan Tombol Lengkap */}
      <div id="struk-preview" className="space-y-2.5 pt-1">
        {/* Tombol Utama: Cetak Struk (Tinggi Pas & Posisi Tengah) */}
        <button
          onClick={handlePrintStruk}
          className="w-full bg-[#0B1E3A] hover:bg-black text-white font-black py-3 rounded-xl h-[46px] flex items-center justify-center gap-2 shadow-sm transition"
        >
          <span className="text-[16px]">🖨️</span>
          <span>Cetak Struk</span>
        </button>

        {/* Tombol Dua Kolom: Download PDF & Share WA PNG */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleDownloadPDF}
            className="bg-[#FFD23F] hover:brightness-95 text-[#0B1E3A] font-black py-3 rounded-xl h-[46px] text-sm flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <span>📄</span>
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleShareWAPNG}
            disabled={isGeneratingImage}
            className="bg-[#25D366] hover:bg-[#1ebe5a] text-white font-black py-3 rounded-xl h-[46px] text-sm flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-50"
          >
            <span>💬</span>
            <span>{isGeneratingImage ? 'Memproses...' : 'Share WA PNG'}</span>
          </button>
        </div>

        {/* Tombol Cadangan: File TXT & Pengaturan Printer */}
        <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
          <button
            onClick={handleDownloadTxt}
            className="text-black/60 hover:text-black font-semibold flex items-center gap-1 py-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Download TXT</span>
          </button>

          <button
            onClick={onOpenPrinterModal}
            className="text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 py-1"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Pengaturan Printer ({printerConfig.paperWidth}mm)</span>
          </button>
        </div>

        {/* Keterangan Singkat */}
        <div className="text-[10px] text-center text-black/40 pt-1 leading-snug">
          Cetak otomatis menyesuaikan panjang isi nota & posisi rata tengah pada kertas thermal.
        </div>
      </div>
    </div>
  );
};
