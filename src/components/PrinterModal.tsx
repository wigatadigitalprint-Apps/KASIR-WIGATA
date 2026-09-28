import React, { useState, useEffect } from 'react';
import { printerService } from '../utils/printer';
import { PrinterConfig } from '../types';
import { Printer, Bluetooth, Cable, CheckCircle2, AlertCircle, RefreshCw, X, Zap } from 'lucide-react';

interface PrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const PrinterModal: React.FC<PrinterModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const [config, setConfig] = useState<PrinterConfig>(printerService.config);
  const [isConnecting, setIsConnecting] = useState(false);
  const [baudRate, setBaudRate] = useState<number>(9600);
  const [testPrinting, setTestPrinting] = useState(false);

  useEffect(() => {
    return printerService.subscribe((newConfig) => {
      setConfig(newConfig);
    });
  }, []);

  if (!isOpen) return null;

  const handleConnectBluetooth = async () => {
    setIsConnecting(true);
    const result = await printerService.connectBluetooth();
    setIsConnecting(false);
    if (result.success) {
      onShowToast(`Terhubung ke Bluetooth: ${result.deviceName}`);
    } else {
      onShowToast(`Bluetooth Gagal: ${result.error || 'Periksa Bluetooth'}`);
    }
  };

  const handleConnectSerial = async () => {
    setIsConnecting(true);
    const result = await printerService.connectSerial(baudRate);
    setIsConnecting(false);
    if (result.success) {
      onShowToast(`Terhubung ke Kabel USB Serial: ${result.deviceName}`);
    } else {
      onShowToast(`USB Gagal: ${result.error || 'Periksa Port USB'}`);
    }
  };

  const handleDisconnect = async () => {
    await printerService.disconnect();
    onShowToast('Printer terputus');
  };

  const handleTestPrint = async () => {
    if (!config.connected) {
      onShowToast('Printer belum terhubung! Silakan hubungkan Bluetooth atau Kabel USB terlebih dahulu.');
      return;
    }
    setTestPrinting(true);
    const res = await printerService.printTest();
    setTestPrinting(false);
    if (res.success) {
      onShowToast('Cetak test berhasil dikirim ke printer!');
    } else {
      onShowToast(`Test print gagal: ${res.error}`);
    }
  };

  const handlePaperWidthChange = (width: 58 | 80) => {
    printerService.saveConfig({ paperWidth: width });
    onShowToast(`Lebar kertas diset ke ${width}mm`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-[540px] w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-black/10">
        {/* Header */}
        <div className="bg-[#0B1E3A] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFD23F] text-[#0B1E3A] flex items-center justify-center shadow">
              <Printer className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-lg tracking-tight leading-tight">Pengaturan Thermal Printer</h3>
              <p className="text-xs text-white/70">Koneksi Bluetooth (Nirkabel) & Kabel USB (Serial)</p>
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
          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              config.connected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-3">
              {config.connected ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
              )}
              <div>
                <div className="font-bold text-sm">
                  {config.connected ? 'Printer Terhubung (Siap Cetak)' : 'Printer Belum Terhubung'}
                </div>
                <div className="text-xs opacity-80">
                  {config.connected
                    ? `${config.deviceName || 'Thermal Printer'} • ${config.type.toUpperCase()}`
                    : 'Pilih koneksi Bluetooth atau Kabel USB di bawah'}
                </div>
              </div>
            </div>
            {config.connected && (
              <button
                onClick={handleDisconnect}
                className="px-3 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold transition"
              >
                Putuskan
              </button>
            )}
          </div>

          {/* Connection Options */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-black/50">Pilih Metode Koneksi</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Bluetooth Button */}
              <div className="border border-black/10 rounded-2xl p-4 flex flex-col justify-between hover:border-black/20 bg-[#FBFBFE]">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Bluetooth className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-black text-sm text-[#0B1E3A]">Bluetooth Thermal</div>
                    <div className="text-[11px] text-black/60 leading-tight">
                      Untuk printer portabel 58mm/80mm (Panda, Xprinter, VSC, Eppos, dll)
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleConnectBluetooth}
                  disabled={isConnecting}
                  className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm disabled:opacity-50"
                >
                  {isConnecting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Bluetooth className="w-3.5 h-3.5" />
                  )}
                  Sambungkan Bluetooth
                </button>
              </div>

              {/* USB Cable Button */}
              <div className="border border-black/10 rounded-2xl p-4 flex flex-col justify-between hover:border-black/20 bg-[#FBFBFE]">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Cable className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-black text-sm text-[#0B1E3A]">Kabel USB (Serial)</div>
                    <div className="text-[11px] text-black/60 leading-tight">
                      Colok langsung ke USB Laptop / PC / OTG HP Android
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex gap-1.5 items-center">
                  <select
                    value={baudRate}
                    onChange={(e) => setBaudRate(Number(e.target.value))}
                    className="bg-white border border-black/10 rounded-xl px-2 py-1 text-[11px] font-bold outline-none"
                    title="Baud Rate"
                  >
                    <option value={9600}>9600 bps</option>
                    <option value={19200}>19200 bps</option>
                    <option value={38400}>38400 bps</option>
                    <option value={115200}>115200 bps</option>
                  </select>
                  <button
                    onClick={handleConnectSerial}
                    disabled={isConnecting}
                    className="flex-1 bg-[#0B1E3A] hover:bg-black text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition shadow-sm disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Cable className="w-3.5 h-3.5" />
                    )}
                    Sambungkan Kabel
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Paper Size & Hardware Settings */}
          <div className="bg-[#F6F7FB] rounded-2xl p-4 border border-black/5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-black/60">Pengaturan Kertas & Hardware</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#0B1E3A]">Lebar Gulungan Kertas</div>
                <div className="text-[11px] text-black/50">58mm (standar mini POS) atau 80mm (printer kasir besar)</div>
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
                  58 mm
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

            <div className="flex items-center justify-between pt-2 border-t border-black/5">
              <div>
                <div className="text-xs font-bold text-[#0B1E3A]">Potong Kertas Otomatis (Auto Cut)</div>
                <div className="text-[11px] text-black/50">Kirim perintah cutter ESC/POS setelah struk selesai</div>
              </div>
              <input
                type="checkbox"
                checked={config.autoCut}
                onChange={(e) => printerService.saveConfig({ autoCut: e.target.checked })}
                className="w-5 h-5 accent-[#0B1E3A] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-black/5">
              <div>
                <div className="text-xs font-bold text-[#0B1E3A]">Buka Laci Kasir (Cash Drawer)</div>
                <div className="text-[11px] text-black/50">Kirim sinyal pulse 24V saat struk tercetak</div>
              </div>
              <input
                type="checkbox"
                checked={config.openDrawer}
                onChange={(e) => printerService.saveConfig({ openDrawer: e.target.checked })}
                className="w-5 h-5 accent-[#0B1E3A] cursor-pointer"
              />
            </div>
          </div>

          {/* Test Print Action */}
          <div className="pt-2">
            <button
              onClick={handleTestPrint}
              disabled={testPrinting || !config.connected}
              className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition shadow-sm ${
                config.connected
                  ? 'bg-[#FFD23F] hover:brightness-95 text-[#0B1E3A]'
                  : 'bg-black/10 text-black/40 cursor-not-allowed'
              }`}
            >
              <Zap className="w-4 h-4 fill-current" />
              {testPrinting ? 'Mengirim Data ke Printer...' : 'Cetak Test Struk Thermal Sekarang'}
            </button>
          </div>

          {/* Info & Tips */}
          <div className="text-[11px] text-black/60 bg-blue-50/70 border border-blue-200/60 rounded-2xl p-3.5 space-y-1">
            <div className="font-bold text-blue-900">Tips Penggunaan Printer Thermal:</div>
            <ul className="list-disc list-inside space-y-0.5 text-blue-950/80">
              <li><strong>Bluetooth:</strong> Nyalakan printer thermal, buka Bluetooth di HP/Laptop lalu pasangkan (PIN biasanya 0000 atau 1234), lalu klik Sambungkan Bluetooth.</li>
              <li><strong>Kabel USB:</strong> Colokkan kabel printer ke PC atau gunakan konverter OTG untuk HP Android, pilih port COM/USB printer yang terdeteksi.</li>
              <li>Printer tidak mendukung Web Bluetooth? Anda tetap bisa gunakan tombol <strong>Cetak Sistem (Browser Print)</strong> dengan layout khusus 58mm/80mm yang otomatis rapi.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F6F7FB] border-t border-black/10 flex justify-end">
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
