import React, { useState, useEffect } from 'react';
import { printerService } from '../utils/printer';
import { PrinterConfig } from '../types';
import {
  Printer,
  Bluetooth,
  Cable,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Zap,
  Monitor,
  Usb,
  Sparkles,
} from 'lucide-react';

interface PrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const PrinterModal: React.FC<PrinterModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const [config, setConfig] = useState<PrinterConfig>(printerService.config);
  const [isConnecting, setIsConnecting] = useState(false);
  const [testPrinting, setTestPrinting] = useState(false);

  useEffect(() => {
    return printerService.subscribe((newConfig) => {
      setConfig(newConfig);
    });
  }, []);

  if (!isOpen) return null;

  // METHOD A: Set Windows Printer Mode (USB Virtual Printer)
  const handleSelectWindowsPrinter = () => {
    printerService.setWindowsPrinterMode(config.paperWidth);
    onShowToast('Mode Windows Printer (Driver EPPOS 58 / USB Virtual) dipilih');
  };

  // METHOD B: Direct WebUSB
  const handleConnectWebUSB = async () => {
    setIsConnecting(true);
    const result = await printerService.connectWebUSB();
    setIsConnecting(false);
    if (result.success) {
      onShowToast(`Direct WebUSB Terhubung: ${result.deviceName}`);
    } else {
      onShowToast(result.error || 'Gagal menyambungkan WebUSB');
    }
  };

  // METHOD C: Bluetooth (Mobile/Android)
  const handleConnectBluetooth = async () => {
    setIsConnecting(true);
    const result = await printerService.connectBluetooth();
    setIsConnecting(false);
    if (result.success) {
      onShowToast(`Bluetooth Terhubung: ${result.deviceName}`);
    } else {
      onShowToast(result.error || 'Gagal menghubungkan Bluetooth');
    }
  };

  const handleDisconnect = async () => {
    await printerService.disconnect();
    onShowToast('Printer terputus');
  };

  const handleTestPrint = async () => {
    setTestPrinting(true);
    const res = await printerService.printTest();
    setTestPrinting(false);
    if (res.success) {
      onShowToast('Perintah cetak test berhasil dikirim!');
    } else {
      onShowToast(`Gagal: ${res.error}`);
    }
  };

  const handlePaperWidthChange = (width: 58 | 80) => {
    printerService.saveConfig({ paperWidth: width });
    onShowToast(`Lebar kertas diset ke ${width}mm`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-[620px] w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-black/10">
        {/* Header */}
        <div className="bg-[#0B1E3A] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFD23F] text-[#0B1E3A] flex items-center justify-center shadow">
              <Printer className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-lg tracking-tight leading-tight">Pengaturan Printer Thermal EPPOS 58</h3>
              <p className="text-xs text-white/70">Mendukung Driver USB Virtual Windows & Direct WebUSB</p>
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
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Active Status Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              config.connected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <div className="font-black text-sm">
                  {config.type === 'windows_spooler'
                    ? 'Mode Windows Printer Aktif (Sangat Direkomendasikan)'
                    : config.connected
                    ? `Terhubung: ${config.deviceName || 'Thermal Printer'}`
                    : 'Pilih Metode Sambungan di Bawah'}
                </div>
                <div className="text-[11px] text-black/60 mt-0.5">
                  {config.type === 'windows_spooler'
                    ? 'Mencetak via driver EPPOS 58 / USB Virtual Printer Windows tanpa perlu COM Port'
                    : `Metode: ${config.type.toUpperCase()} • Lebar: ${config.paperWidth}mm`}
                </div>
              </div>
            </div>

            {config.connected && config.type !== 'windows_spooler' && (
              <button
                onClick={handleDisconnect}
                className="px-3 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold transition"
              >
                Putuskan
              </button>
            )}
          </div>

          {/* METODE A: Windows Printer (Driver EPPOS 58 USB Virtual) */}
          <div
            className={`border-2 rounded-2xl p-4 transition ${
              config.type === 'windows_spooler'
                ? 'border-[#0B1E3A] bg-[#0B1E3A]/[0.03]'
                : 'border-black/10 hover:border-black/20 bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-[#0B1E3A]">
                      Metode A: Windows Printer (USB Virtual Port)
                    </span>
                    <span className="bg-[#FFD23F] text-[#0B1E3A] text-[9px] px-2 py-0.5 rounded-full font-black">
                      TERBAIK UNTUK EPPOS 58
                    </span>
                  </div>
                  <p className="text-black/60 text-[11px] mt-1 leading-relaxed">
                    Printer EPPOS 58mm saat dicolokkan ke Windows menggunakan <strong>USB Virtual Printer Port</strong> (bukan Serial/COM). Dengan mode ini, kasir mencetak langsung melalui driver Windows tanpa hambatan port!
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-black/10 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] text-black/50">
                Langkah: Pastikan driver EPPOS 58 sudah terinstall di Windows &gt; pilih mode ini &gt; cetak langsung bekerja.
              </div>
              <button
                onClick={handleSelectWindowsPrinter}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                  config.type === 'windows_spooler'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-[#0B1E3A] hover:bg-black text-white'
                }`}
              >
                {config.type === 'windows_spooler' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mode Aktif (Digunakan)
                  </>
                ) : (
                  'Gunakan Mode Windows Printer'
                )}
              </button>
            </div>
          </div>

          {/* METODE B: Direct WebUSB (Raw USB Printer Port Class 07) */}
          <div
            className={`border-2 rounded-2xl p-4 transition ${
              config.type === 'webusb' && config.connected
                ? 'border-[#0B1E3A] bg-[#0B1E3A]/[0.03]'
                : 'border-black/10 hover:border-black/20 bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                  <Usb className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-[#0B1E3A]">
                      Metode B: Direct WebUSB (Kirim ESC/POS Langsung)
                    </span>
                  </div>
                  <p className="text-black/60 text-[11px] mt-1 leading-relaxed">
                    Browser Google Chrome menghubungkan koneksi USB Printer Class 07 secara langsung. Perintah ESC/POS dipompa langsung ke lubang USB printer EPPOS tanpa perantara driver.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-black/10 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] text-black/50">
                Klik tombol di bawah, jendela Chrome akan menampilkan daftar perangkat USB. Pilih printer EPPOS Anda.
              </div>
              <button
                onClick={handleConnectWebUSB}
                disabled={isConnecting}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
              >
                {isConnecting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Usb className="w-3.5 h-3.5" />
                )}
                Sambungkan via WebUSB
              </button>
            </div>
          </div>

          {/* METODE C: Bluetooth (Khusus HP / Tablet Android) */}
          <div className="border border-black/10 rounded-2xl p-4 bg-white hover:border-black/20 transition">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                  <Bluetooth className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#0B1E3A]">
                    Metode C: Bluetooth Nirkabel (Khusus HP Android / Tablet)
                  </div>
                  <p className="text-black/60 text-[11px] mt-0.5 leading-relaxed">
                    Jika kasir mengoperasikan sistem dari smartphone Android atau tablet, aktifkan Bluetooth HP &gt; pairing EPPOS &gt; klik sambungkan.
                  </p>
                </div>
              </div>
              <button
                onClick={handleConnectBluetooth}
                disabled={isConnecting}
                className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1 transition shadow-sm shrink-0"
              >
                <Bluetooth className="w-3.5 h-3.5" />
                Scan Bluetooth
              </button>
            </div>
          </div>

          {/* Paper Size Setting */}
          <div className="bg-[#F6F7FB] rounded-2xl p-4 border border-black/5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#0B1E3A]">Lebar Gulungan Kertas Kasir</div>
              <div className="text-[11px] text-black/50">EPPOS EP58M menggunakan kertas thermal ukuran 58mm</div>
            </div>
            <div className="flex bg-white rounded-xl p-1 border border-black/10">
              <button
                onClick={() => handlePaperWidthChange(58)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  config.paperWidth === 58
                    ? 'bg-[#0B1E3A] text-white shadow-sm'
                    : 'text-black/60 hover:text-black'
                }`}
              >
                58 mm (EPPOS)
              </button>
              <button
                onClick={() => handlePaperWidthChange(80)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  config.paperWidth === 80
                    ? 'bg-[#0B1E3A] text-white shadow-sm'
                    : 'text-black/60 hover:text-black'
                }`}
              >
                80 mm
              </button>
            </div>
          </div>

          {/* Test Print Action */}
          <div>
            <button
              onClick={handleTestPrint}
              disabled={testPrinting}
              className="w-full py-3.5 rounded-2xl bg-[#FFD23F] hover:brightness-95 text-[#0B1E3A] font-black text-sm flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Zap className="w-4 h-4 fill-current" />
              {testPrinting ? 'Mengirim Test Cetak...' : 'Uji Cetak (Test Print Struk Sekarang)'}
            </button>
            <div className="text-[10px] text-center text-black/50 mt-1.5">
              Tombol ini akan mengirim test print struk kasir Wigata Digital Print ke printer Anda
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F6F7FB] border-t border-black/10 flex justify-between items-center">
          <span className="text-[11px] text-black/50">
            Wigata POS Pro • Kompatibel dengan EPPOS EP58M USB & Bluetooth
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#0B1E3A] text-white font-bold text-sm hover:bg-black transition"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
