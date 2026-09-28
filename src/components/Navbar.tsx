import React from 'react';
import { ExcelSyncConfig, PrinterConfig } from '../types';
import {
  ShoppingCart,
  Receipt,
  BarChart3,
  ListOrdered,
  FileSpreadsheet,
  Printer,
  Globe,
  Bluetooth,
  CheckCircle2,
  AlertCircle,
  User,
  Cloud,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'kasir' | 'riwayat' | 'laporan' | 'katalog';
  setActiveTab: (tab: 'kasir' | 'riwayat' | 'laporan' | 'katalog') => void;
  syncConfig: ExcelSyncConfig;
  printerConfig: PrinterConfig;
  onOpenExcelModal: () => void;
  onOpenPrinterModal: () => void;
  onOpenDeployModal: () => void;
  onOpenCloudModal: () => void;
  kasirName: string;
  onChangeKasir: (name: string) => void;
  trxCount: number;
  userEmail: string;
  isCloudSyncing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  syncConfig,
  printerConfig,
  onOpenExcelModal,
  onOpenPrinterModal,
  onOpenDeployModal,
  onOpenCloudModal,
  kasirName,
  onChangeKasir,
  trxCount,
  userEmail,
  isCloudSyncing,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0B1E3A] text-white shadow-md">
      {/* Top Banner */}
      <div className="max-w-[1440px] mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFD23F] text-[#0B1E3A] font-black flex items-center justify-center text-xl shadow">
            W
          </div>
          <div>
            <div className="font-black tracking-tight text-base sm:text-lg leading-none flex items-center gap-2">
              <span>WIGATA DIGITAL PRINT</span>
              <span className="bg-[#FFD23F] text-[#0B1E3A] text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase">
                POS PRO Cloud
              </span>
            </div>
            <div className="text-[11px] text-white/70 tracking-wider mt-0.5">
              SOKARAJA • PURWOKERTO • WA 0823-2340-3108
            </div>
          </div>
        </div>

        {/* Live Status Indicators & Action Modals */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Cloud Multi-PC Sync Status Pill */}
          <button
            onClick={onOpenCloudModal}
            className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/50 hover:bg-emerald-500/30 text-emerald-300 rounded-full px-3 py-1.5 text-xs font-bold transition shadow-sm cursor-pointer"
            title="Sinkronisasi Cloud Aktif: Nota dan harga otomatis tersinkron ke komputer lain"
          >
            <Cloud className={`w-3.5 h-3.5 text-emerald-400 ${isCloudSyncing ? 'animate-bounce' : ''}`} />
            <div className="flex flex-col text-left">
              <span className="font-bold text-emerald-300 text-[11px] leading-tight flex items-center gap-1">
                <span>Cloud Multi-PC Aktif</span>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </span>
              <span className="text-[9px] text-white/60">
                {userEmail ? userEmail.split('@')[0] : 'Otomatis Real-time'}
              </span>
            </div>
          </button>

          {/* Thermal Printer Status Pill */}
          <button
            onClick={onOpenPrinterModal}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition border ${
              printerConfig.connected
                ? 'bg-blue-500/20 text-blue-300 border-blue-400/40 hover:bg-blue-500/30'
                : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
            }`}
            title="Pengaturan Printer Thermal (Driver Windows EPPOS 58 / WebUSB / Bluetooth)"
          >
            {printerConfig.type === 'bluetooth' ? (
              <Bluetooth className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <Printer className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>
              Printer:{' '}
              {printerConfig.connected
                ? printerConfig.type === 'windows_spooler'
                  ? 'EPPOS 58 (Siap)'
                  : `${printerConfig.paperWidth}mm (Konek)`
                : 'EPPOS 58 (Siap)'}
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </button>

          {/* Excel Database Status Pill */}
          <button
            onClick={onOpenExcelModal}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition border ${
              syncConfig.webhookUrl
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30'
                : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
            }`}
            title="Klik untuk membuka Pengaturan Database Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#25D366]" />
            <span>Excel: {syncConfig.webhookUrl ? 'Live Cloud' : 'Lokal / Setup'}</span>
          </button>

          {/* Deploy Guide Button */}
          <button
            onClick={onOpenDeployModal}
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#FFD23F] hover:brightness-95 text-[#0B1E3A] flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            title="Panduan Deploy ke Web Hosting Online"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Deploy</span>
          </button>

          {/* Kasir Selector */}
          <div className="hidden sm:flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1 text-xs">
            <User className="w-3.5 h-3.5 text-white/70" />
            <select
              value={kasirName}
              onChange={(e) => onChangeKasir(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer text-xs"
            >
              <option value="Admin" className="bg-[#0B1E3A] text-white">Admin</option>
              <option value="Kasir 1" className="bg-[#0B1E3A] text-white">Kasir 1</option>
              <option value="Kasir 2" className="bg-[#0B1E3A] text-white">Kasir 2</option>
              <option value="Desainer" className="bg-[#0B1E3A] text-white">Desainer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-[#08162B]">
        <div className="max-w-[1440px] mx-auto px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <div className="flex bg-white/10 p-1 rounded-full gap-1">
            {[
              { id: 'kasir', label: 'Kasir & Kalkulator', icon: ShoppingCart },
              { id: 'riwayat', label: `Riwayat Nota (${trxCount})`, icon: Receipt },
              { id: 'laporan', label: 'Laporan Omset', icon: BarChart3 },
              { id: 'katalog', label: 'Katalog & Harga', icon: ListOrdered },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-[#FFD23F] text-[#0B1E3A] shadow-md'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-3 text-xs text-white/70">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Tunai
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span> QRIS
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Transfer Bank
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
