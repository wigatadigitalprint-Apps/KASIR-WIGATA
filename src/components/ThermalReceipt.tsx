import React, { useRef, useState } from 'react';
import { Transaction, PrinterConfig } from '../types';
import { STORE_INFO, formatRupiah, formatNumber } from '../utils/defaultData';
import { printerService } from '../utils/printer';
import {
  Printer,
  Bluetooth,
  Cable,
  Download,
  Share2,
  FileText,
  FileDown,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

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
  const [isPrintingDirect, setIsPrintingDirect] = useState(false);
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

  // Direct ESC/POS Print to Bluetooth / USB Serial thermal printer
  const handleDirectThermalPrint = async () => {
    if (!printerConfig.connected) {
      onShowToast('Printer belum terhubung! Silakan buka menu Printer untuk koneksi Bluetooth / USB.');
      onOpenPrinterModal();
      return;
    }

    setIsPrintingDirect(true);
    const res = await printerService.printTransaction(transaction);
    setIsPrintingDirect(false);

    if (res.success) {
      onShowToast(`Struk ${transaction.noNota} berhasil dicetak via ${printerConfig.type.toUpperCase()}!`);
    } else {
      onShowToast(`Gagal mencetak: ${res.error}. Anda bisa gunakan Cetak Browser.`);
    }
  };

  // Browser System Print with isolated auto-length iframe
  const handleSystemPrint = () => {
    const receiptEl = receiptRef.current;
    if (!receiptEl) {
      window.print();
      return;
    }

    // Create temporary hidden iframe to isolate the exact height of the receipt
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
    const innerContentWidthMm = paperWidth === 80 ? '72mm' : '48mm';

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
      width: ${printWidthMm}mm;
      max-width: ${printWidthMm}mm;
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      color: #000 !important;
      font-family: 'Courier New', Courier, monospace !important;
      font-size: 11px !important;
      line-height: 1.25 !important;
      height: auto !important;
      min-height: 0 !important;
    }
    .print-wrapper {
      width: ${innerContentWidthMm};
      margin: 0 auto;
      padding: 1.5mm 1mm 3mm 1mm;
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

    onShowToast('Membuka cetak auto-fit panjang struk...');
  };

  // Text version for WhatsApp or TXT
  const generatePlainText = (): string => {
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

    return text;
  };

  const handleDownloadTxt = () => {
    const text = generatePlainText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Struk-${transaction.noNota}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Struk TXT berhasil diunduh');
  };

  const handleShareWhatsApp = async () => {
    const text = generatePlainText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Struk Nota ${transaction.noNota}`,
          text,
        });
        onShowToast('Struk berhasil dibagikan');
        return;
      } catch {
        // Fallback to whatsapp link
      }
    }
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
    onShowToast('Membuka WhatsApp untuk mengirim struk...');
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-black/5 space-y-4">
      {/* Header & Width Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-black text-sm uppercase tracking-wide text-[#0B1E3A] flex items-center gap-1.5">
            <Printer className="w-4 h-4 text-amber-500" />
            Struk Thermal Preview
          </h3>
          <p className="text-[11px] text-black/50">Format kertas roll continuous mini POS</p>
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

      {/* Visual Paper Preview Container */}
      <div className="bg-[#EBEFF5] p-4 rounded-2xl flex justify-center overflow-x-auto shadow-inner">
        <div
          id="thermal-printable-receipt"
          ref={receiptRef}
          style={{ width: paperWidth === 80 ? '360px' : '280px' }}
          className="bg-white text-black p-4 rounded-xl shadow-md border border-neutral-200 font-mono text-[11px] leading-snug space-y-2 select-text"
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
              <span className="text-black/60">No Nota:</span>
              <span className="font-bold">{transaction.noNota}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/60">Waktu:</span>
              <span>{transaction.dateStr} {transaction.jam}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/60">Pelanggan:</span>
              <span className="font-bold">{transaction.pelanggan || 'Umum'}</span>
            </div>
            {transaction.hp && (
              <div className="flex justify-between">
                <span className="text-black/60">No WA/HP:</span>
                <span>{transaction.hp}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-black/60">Kasir:</span>
              <span>{transaction.kasir || 'Admin'}</span>
            </div>
          </div>

          {/* Item List */}
          <div className="space-y-2 py-1 border-b border-dashed border-black/40">
            {transaction.items.length === 0 ? (
              <div className="text-center text-black/40 py-2">Belum ada item di nota</div>
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
                        ? `${item.panjang}x${item.lebar}m x ${item.qty} = ${formatNumber(item.totalLuas, 2)}m2 @${formatNumber(item.product.price)}`
                        : item.product.category === 'Cutting'
                        ? `${Math.round(item.panjang)}x${Math.round(item.lebar)}cm = ${Math.round(item.totalLuas)}cm @${formatNumber(item.product.price)}`
                        : `${item.qty} ${item.product.unit} @${formatNumber(item.product.price)}`}
                    </div>
                    {fins.length > 0 && (
                      <div className="text-[9.5px] text-black/60 italic pl-2">
                        - {fins.join(', ')}
                      </div>
                    )}
                    {item.desainFee > 0 && (
                      <div className="text-[9.5px] text-black/60 pl-2">
                        - Desain: {formatRupiah(item.desainFee)}
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
                <span>Diskon ({transaction.diskonPercent}%)</span>
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
                <span>{formatRupiah(transaction.kembalian)}</span>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="text-center text-[9.5px] text-black/70 space-y-0.5 pt-1">
            <div className="font-bold text-black">Terima Kasih Sudah Order!</div>
            <div>{STORE_INFO.note1}</div>
            <div>{STORE_INFO.note2}</div>
            <div className="pt-1 text-[9px] text-black/50">
              Dicetak: {new Date().toLocaleString('id-ID')}
              <br />
              KASIR WIGATA DIGITAL PRINT
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        {/* Main Smart Print Button */}
        <button
          onClick={async () => {
            if (printerConfig.connected && printerConfig.type !== 'windows_spooler' && printerConfig.type !== 'system') {
              await handleDirectThermalPrint();
            } else {
              handleSystemPrint();
            }
          }}
          disabled={isPrintingDirect}
          className="w-full py-3.5 rounded-2xl bg-[#0B1E3A] hover:bg-black text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition"
          title="Cetak struk ke printer thermal"
        >
          <Printer className="w-4 h-4 text-[#FFD23F]" />
          <span>
            {isPrintingDirect
              ? 'Sedang Mencetak...'
              : printerConfig.type === 'webusb' && printerConfig.connected
              ? 'Cetak Direct WebUSB (EPPOS 58)'
              : printerConfig.type === 'bluetooth' && printerConfig.connected
              ? 'Cetak via Bluetooth (EPPOS 58)'
              : 'Cetak Struk Thermal (EPPOS 58)'}
          </span>
        </button>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-2">
          {/* Change / Configure Printer */}
          <button
            onClick={onOpenPrinterModal}
            className="py-2.5 px-3 rounded-xl border border-black/10 bg-[#F6F7FB] hover:bg-black/10 text-[#0B1E3A] font-bold text-xs flex items-center justify-center gap-1.5 transition"
            title="Buka pengaturan metode printer (Windows Driver / WebUSB / Bluetooth)"
          >
            <Cable className="w-3.5 h-3.5 text-black/50" />
            <span className="truncate">Pengaturan Printer</span>
          </button>

          {/* Share WhatsApp */}
          <button
            onClick={handleShareWhatsApp}
            className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#1ebe5a] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
            title="Bagikan rincian nota langsung ke nomor WhatsApp pelanggan"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share WA</span>
          </button>
        </div>

        {/* Download TXT */}
        <button
          onClick={handleDownloadTxt}
          className="w-full py-2 rounded-xl border border-black/10 bg-white hover:bg-[#F6F7FB] text-black/60 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition"
          title="Download struk teks untuk arsip"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Download Struk (File TXT)</span>
        </button>

        {/* Printer status hint */}
        <div className="text-[11px] bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 text-black/75 space-y-1">
          <div className="font-bold text-[#0B1E3A] flex items-center gap-1.5">
            <span>💡 3 Setelan di Jendela Print Windows agar Kertas Berhenti Pas:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[10.5px] text-black/70">
            <li><strong>Ukuran Kertas (Paper size):</strong> Pilih <code>58 x 210 mm</code> atau <code>Roll Paper 58mm</code> (jangan pilih A4).</li>
            <li><strong>Margin:</strong> Pilih <strong>None</strong> (Nol).</li>
            <li><strong>Opsi (Options):</strong> <em>Hilangkan centang</em> <strong>Headers and footers</strong> agar tidak menarik kertas kosong di bawah.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
