import React, { useRef, useState } from 'react';
import { Transaction, PrinterConfig } from '../types';
import { STORE_INFO, formatRupiah, formatNumber } from '../utils/defaultData';
import {
  Printer,
  FileText,
  Settings,
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

  // Cetak Struk: Rata Tengah, Panjang Pas Menyesuaikan Isi Nota, dan Format Tabel Spasi Rapi
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
    // 46mm adalah lebar aman print head thermal 58mm agar teks tepi kiri/kanan tidak terpotong
    const innerContentWidthMm = paperWidth === 80 ? '70mm' : '46mm';

    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Struk ${transaction.noNota}</title>
  <style>
    @page {
      size: auto;
      margin: 0mm !important;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: 'Courier New', Courier, monospace !important;
      font-size: 9.5px !important;
      line-height: 1.3 !important;
      height: auto !important;
      min-height: 0 !important;
      display: block !important;
      text-align: center !important;
    }
    .print-wrapper {
      display: block !important;
      width: ${innerContentWidthMm} !important;
      max-width: ${innerContentWidthMm} !important;
      margin: 0 auto !important; /* POSISI DI TENGAH KANAN-KIRI */
      padding: 0mm 0.5mm 3mm 0.5mm !important; /* NOL PADDING ATAS AGAR LANGSUNG KELUAR DI ATAS */
      height: auto !important; /* MENYESUAIKAN PANJANG STRUK */
      background: #ffffff !important;
      color: #000000 !important;
      text-align: left !important;
      overflow: hidden !important;
      word-break: break-word !important;
    }
    .text-center {
      text-align: center !important;
    }
    .text-right {
      text-align: right !important;
    }
    .font-bold {
      font-weight: bold !important;
    }
    .font-black {
      font-weight: 900 !important;
    }
    /* Flex Row Rapi Antara Kiri dan Kanan */
    .row {
      display: flex !important;
      justify-content: space-between !important;
      align-items: flex-start !important;
      width: 100% !important;
      margin: 1.5px 0 !important;
    }
    /* Garis Putus-putus Pemisah */
    .dashed-divider {
      border-top: 1px dashed #000000 !important;
      margin: 4px 0 !important;
      width: 100% !important;
      height: 0 !important;
    }
    .double-divider {
      border-top: 2px dashed #000000 !important;
      margin: 5px 0 !important;
      width: 100% !important;
      height: 0 !important;
    }
    .sub-item {
      font-size: 8.5px !important;
      color: #222222 !important;
      margin: 1px 0 !important;
    }
    .finishing-item {
      font-size: 8.5px !important;
      padding-left: 6px !important;
      color: #333333 !important;
      font-style: italic !important;
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

    onShowToast('Mencetak struk (posisi tengah & panjang pas)...');
  };

  // Download Gambar Struk PNG
  const handleDownloadPNG = async () => {
    const receiptEl = receiptRef.current;
    if (!receiptEl) return;

    setIsGeneratingImage(true);
    onShowToast('Mengunduh gambar struk PNG...');

    try {
      const canvas = await html2canvas(receiptEl, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      canvas.toBlob((blob) => {
        setIsGeneratingImage(false);
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Struk-${transaction.noNota}.png`;
        a.click();
        URL.revokeObjectURL(url);
        onShowToast('Struk berhasil didownload dalam format PNG');
      }, 'image/png');
    } catch {
      setIsGeneratingImage(false);
      onShowToast('Gagal mengunduh gambar struk');
    }
  };

  // Generate Text Version for WhatsApp or TXT
  const generatePlainText = (): string => {
    const maxChars = paperWidth === 80 ? 42 : 32;
    const lineSep = '-'.repeat(maxChars);
    const doubleSep = '='.repeat(maxChars);

    let text = `*${STORE_INFO.name}*\n`;
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
      text += `${idx + 1}. *${item.product.name.toUpperCase()}* (${item.product.category})\n`;
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
      text += `   => *${formatRupiah(item.total)}*\n`;
    });

    text += `${lineSep}\n`;
    text += `Subtotal    : ${formatRupiah(transaction.subtotal)}\n`;
    if (transaction.diskonPercent > 0 || transaction.diskonRp > 0) {
      text += `Diskon (${transaction.diskonPercent}%) : -${formatRupiah(transaction.diskonRp)}\n`;
    }
    text += `*GRAND TOTAL : ${formatRupiah(transaction.grandTotal)}*\n`;
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

  // Kirim / Share ke WhatsApp (Langsung menuju ke WhatsApp & unduh gambar PNG)
  const handleShareWA = async () => {
    const receiptEl = receiptRef.current;
    if (!receiptEl) return;

    setIsGeneratingImage(true);
    onShowToast('Membuka WhatsApp & menyiapkan struk...');

    // 1. Format pesan WhatsApp rapi
    const waText = generatePlainText();

    // 2. Format nomor HP tujuan (hilangkan karakter selain angka, ganti 08xx jadi 628xx)
    let cleanPhone = transaction.hp ? transaction.hp.replace(/\D/g, '') : '';
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }

    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`
      : `https://wa.me/?text=${encodeURIComponent(waText)}`;

    try {
      // 3. Render gambar PNG
      const canvas = await html2canvas(receiptEl, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      canvas.toBlob(async (blob) => {
        setIsGeneratingImage(false);
        if (blob) {
          // Salin gambar ke clipboard jika browser mendukung (agar kasir tinggal Ctrl+V di WA)
          try {
            if (navigator.clipboard && window.ClipboardItem) {
              await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            }
          } catch {
            // Abaikan jika tidak diizinkan clipboard
          }

          // Unduh file gambar otomatis untuk lampiran
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Struk-${transaction.noNota}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }

        // 4. Langsung buka WhatsApp
        window.open(waUrl, '_blank');
        onShowToast('WhatsApp dibuka! Gambar PNG juga tersimpan.');
      }, 'image/png');
    } catch {
      setIsGeneratingImage(false);
      // Jika render gambar gagal, tetap buka WhatsApp dengan teks
      window.open(waUrl, '_blank');
      onShowToast('Membuka WhatsApp...');
    }
  };

  // Download TXT
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
          style={{
            width: paperWidth === 80 ? '340px' : '250px',
            fontFamily: "'Courier New', Courier, monospace",
          }}
          className="bg-white text-black p-3 rounded-xl shadow-md border border-neutral-200 text-[10px] leading-snug space-y-1 select-text mx-auto"
        >
          {/* Header - Centered */}
          <div className="text-center pb-1">
            <div className="font-black text-[13px] tracking-tight text-[#0B1E3A] uppercase">
              {STORE_INFO.name}
            </div>
            <div className="text-[10px] text-black/80 leading-tight mt-0.5">
              {STORE_INFO.address}
              <br />
              {STORE_INFO.locationDetail}
              <br />
              WA: {STORE_INFO.phone}
            </div>
          </div>

          {/* Dashed Separator */}
          <div className="dashed-divider" style={{ borderTop: '1px dashed #000', margin: '5px 0' }}></div>

          {/* Meta Info - Spasi Kiri & Kanan Terpisah Rapi */}
          <div className="text-[10.5px] space-y-0.5">
            <div className="row" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span className="text-black/70">No Nota :</span>
              <span className="font-bold">{transaction.noNota}</span>
            </div>
            <div className="row" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span className="text-black/70">Tanggal :</span>
              <span>{transaction.dateStr}</span>
            </div>
            <div className="row" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span className="text-black/70">Jam :</span>
              <span>{transaction.jam}</span>
            </div>
            <div className="row" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span className="text-black/70">Pelanggan:</span>
              <span className="font-bold">{transaction.pelanggan || 'Umum'}</span>
            </div>
            {transaction.hp && (
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span className="text-black/70">HP :</span>
                <span>{transaction.hp}</span>
              </div>
            )}
            <div className="row" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span className="text-black/70">Kasir :</span>
              <span>{transaction.kasir || 'Admin'}</span>
            </div>
          </div>

          {/* Dashed Separator */}
          <div className="dashed-divider" style={{ borderTop: '1px dashed #000', margin: '5px 0' }}></div>

          {/* Item List */}
          <div className="space-y-2 py-0.5">
            {transaction.items.length === 0 ? (
              <div className="text-center text-black/40 py-2">Keranjang kosong</div>
            ) : (
              transaction.items.map((item, idx) => {
                const fins = getFinishingLabels(item.finishing, item.product.category);
                return (
                  <div key={item.cartId || idx} className="space-y-0.5">
                    {/* Item Name on Left, Item Total on Right */}
                    <div className="row font-bold" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontWeight: 'bold' }}>
                      <span style={{ maxWidth: '65%', wordBreak: 'break-word' }}>
                        {idx + 1}. {item.product.name.toUpperCase()}
                      </span>
                      <span className="text-right" style={{ minWidth: '35%', textAlign: 'right' }}>
                        {formatRupiah(item.total)}
                      </span>
                    </div>

                    {/* Dimensions & Quantity */}
                    <div className="sub-item" style={{ fontSize: '9.5px', color: '#222' }}>
                      {item.product.category === 'Meteran'
                        ? `${item.panjang}m x ${item.lebar}m x ${item.qty} = ${formatNumber(item.totalLuas, 2)}m2`
                        : item.product.category === 'Cutting'
                        ? `Ukuran: ${Math.round(item.panjang)}cm x ${Math.round(item.lebar)}cm = ${Math.round(item.luas)}cm x ${item.qty} pcs`
                        : `${item.qty} ${item.product.unit}`}
                    </div>

                    {/* Unit Price Calculation */}
                    <div className="sub-item" style={{ fontSize: '9.5px', color: '#222' }}>
                      @{formatNumber(item.product.price)} {item.product.unit} {item.product.category === 'A3+' && item.finishing.bolakBalik ? '(x2)' : ''} = {formatRupiah(item.basePrice)}
                    </div>

                    {/* Finishing details */}
                    {fins.length > 0 && (
                      <div className="finishing-item" style={{ fontSize: '9px', fontStyle: 'italic', paddingLeft: '8px', color: '#333' }}>
                        {fins.map((f, i) => (
                          <div key={i}>- {f}</div>
                        ))}
                      </div>
                    )}

                    {/* Design fee */}
                    {item.desainFee > 0 && (
                      <div className="sub-item" style={{ fontSize: '9.5px', paddingLeft: '8px', color: '#333' }}>
                        Desain: {formatRupiah(item.desainFee)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Dashed Separator */}
          <div className="dashed-divider" style={{ borderTop: '1px dashed #000', margin: '5px 0' }}></div>

          {/* Summary / Totals */}
          <div className="space-y-1 text-[11px]">
            {/* Subtotal */}
            <div className="row" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span>Subtotal</span>
              <span className="font-bold">{formatRupiah(transaction.subtotal)}</span>
            </div>

            {/* Diskon */}
            {(transaction.diskonPercent > 0 || transaction.diskonRp > 0) && (
              <div className="row text-red-600 font-bold" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', color: '#dc2626' }}>
                <span>Diskon {transaction.diskonPercent}%</span>
                <span>-{formatRupiah(transaction.diskonRp)}</span>
              </div>
            )}

            {/* Grand Total */}
            <div className="row font-black text-xs pt-1" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontWeight: 900, fontSize: '12px' }}>
              <span>GRAND TOTAL</span>
              <span>{formatRupiah(transaction.grandTotal)}</span>
            </div>

            {/* Bayar */}
            <div className="row" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '10px' }}>
              <span>Bayar ({transaction.paymentMethod.toUpperCase()})</span>
              <span>{formatRupiah(transaction.bayar)}</span>
            </div>

            {/* Kembalian */}
            {transaction.paymentMethod === 'tunai' && (
              <div className="row font-bold" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '10px', fontWeight: 'bold' }}>
                <span>Kembalian</span>
                <span>{formatRupiah(transaction.kembalian > 0 ? transaction.kembalian : 0)}</span>
              </div>
            )}
          </div>

          {/* Dashed Separator */}
          <div className="dashed-divider" style={{ borderTop: '1px dashed #000', margin: '5px 0' }}></div>

          {/* Footer note - Centered */}
          <div className="text-center text-[9.5px] text-black/80 space-y-0.5 pt-1">
            <div className="font-bold text-black">Terima kasih Sudah Order</div>
            <div>{STORE_INFO.note1}</div>
            <div>{STORE_INFO.note2}</div>
            <div className="pt-1 text-[9px] text-black/60">
              Hubungi WA: {STORE_INFO.phone}
              <br />
              Dicetak: {new Date().toLocaleString('id-ID')}
              <br />
              <span className="font-bold text-black">KASIR WIGATA DIGITAL PRINT</span>
              <br />
              <span className="text-[8.5px]">Powered by Wigata POS v2.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Kembali ke Tampilan Semula dengan Tombol Lengkap */}
      <div id="struk-preview" className="space-y-2.5 pt-1">
        {/* Tombol Utama: Cetak Struk (Tinggi Pas, Posisi Tengah, Tampilan Rapi) */}
        <button
          onClick={handlePrintStruk}
          className="w-full bg-[#0B1E3A] hover:bg-black text-white font-black py-3 rounded-xl h-[46px] flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
        >
          <span className="text-[16px]">🖨️</span>
          <span>Cetak Struk</span>
        </button>

        {/* Tombol Dua Kolom: Download PNG & Share WA PNG */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleDownloadPNG}
            disabled={isGeneratingImage}
            className="bg-[#FFD23F] hover:brightness-95 text-[#0B1E3A] font-black py-3 rounded-xl h-[46px] text-sm flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            <span className="text-[15px]">🖼️</span>
            <span>Download PNG</span>
          </button>

          <button
            onClick={handleShareWA}
            disabled={isGeneratingImage}
            className="bg-[#25D366] hover:bg-[#1ebe5a] text-white font-black py-3 rounded-xl h-[46px] text-sm flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            <span className="text-[15px]">💬</span>
            <span>{isGeneratingImage ? 'Membuka WA...' : 'Share WA PNG'}</span>
          </button>
        </div>

        {/* Tombol Cadangan: File TXT & Pengaturan Printer */}
        <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
          <button
            onClick={handleDownloadTxt}
            className="text-black/60 hover:text-black font-semibold flex items-center gap-1 py-1 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Download TXT</span>
          </button>

          <button
            onClick={onOpenPrinterModal}
            className="text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 py-1 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Pengaturan Printer ({printerConfig.paperWidth}mm)</span>
          </button>
        </div>

        {/* Keterangan Singkat */}
        <div className="text-[10px] text-center text-black/40 pt-1 leading-snug">
          Cetak otomatis rapi dengan spasi kiri-kanan terpisah, garis pemisah putus-putus, serta teks rata tengah.
        </div>
      </div>
    </div>
  );
};
