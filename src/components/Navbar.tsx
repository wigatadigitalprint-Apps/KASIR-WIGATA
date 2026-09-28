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
  LogOut,
  Cloud,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface NavbarProps {
  activeTab: 'kasir' | 'riwayat' | 'laporan' | 'katalog';
  setActiveTab: (tab: 'kasir' | 'riwayat' | 'laporan' | 'katalog') => void;
  syncConfig: ExcelSyncConfig;
  printerConfig: PrinterConfig;
  onOpenExcelModal: () => void;
  onOpenPrinterModal: () => void;
  onOpenDeployModal: () => void;
  kasirName: string;
  onChangeKasir: (name: string) => void;
  trxCount: number;
  currentUser: FirebaseUser | null;
  onLoginGoogle: () => void;
  onLogoutGoogle: () => void;
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
  kasirName,
  onChangeKasir,
  trxCount,
  currentUser,
  onLoginGoogle,
  onLogoutGoogle,
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
          {/* Google Account / Cloud Sync Pill */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 rounded-full px-3 py-1 text-xs">
              <Cloud className={`w-3.5 h-3.5 text-emerald-400 ${isCloudSyncing ? 'animate-pulse' : ''}`} />
              <div className="flex flex-col text-left">
                <span className="font-bold text-emerald-300 text-[11px] leading-tight flex items-center gap-1">
                  <span>{currentUser.displayName || currentUser.email?.split('@')[0]}</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                </span>
                <span className="text-[9.5px] text-white/60">Cloud Aktif (Multi-PC)</span>
              </div>
              <button
                onClick={onLogoutGoogle}
                title="Keluar dari Akun Google"
                className="ml-1 p-1 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginGoogle}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-white text-[#0B1E3A] hover:bg-neutral-100 flex items-center gap-2 shadow-sm transition border border-white"
              title="Masuk dengan Akun Google untuk sinkronisasi otomatis antar komputer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.27 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.17 0 9.97 0 12s.46 3.83 1.26 5.42l4.02-3.13z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.64 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.93 6.72-4.93z"
                />
              </svg>
              <span>Login Akun Google (Sync PC)</span>
            </button>
          )}

          {/* Thermal Printer Status Pill */}
          <button
            onClick={onOpenPrinterModal}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition border ${
              printerConfig.connected
                ? 'bg-blue-500/20 text-blue-300 border-blue-400/40 hover:bg-blue-500/30'
                : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
            }`}
            title="Klik untuk membuka Pengaturan Printer Thermal (Driver Windows / WebUSB / Bluetooth)"
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
                : 'Sambung Thermal'}
            </span>
            {printerConfig.connected ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            )}
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
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#FFD23F] hover:brightness-95 text-[#0B1E3A] flex items-center gap-1.5 shadow-sm transition"
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
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-black transition flex items-center gap-2 ${
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
