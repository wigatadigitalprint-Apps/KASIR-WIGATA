import React, { useState, useEffect } from 'react';
import {
  ProductItem,
  CartItem,
  Transaction,
  PrinterConfig,
  ExcelSyncConfig,
} from './types';
import {
  CATALOG_PRODUCTS,
  generateNoNota,
} from './utils/defaultData';
import { printerService } from './utils/printer';
import {
  DEFAULT_EXCEL_SYNC_CONFIG,
  syncTransactionToExcelWebhook,
} from './utils/excel';
import { Navbar } from './components/Navbar';
import { KasirTab } from './components/KasirTab';
import { RiwayatTab } from './components/RiwayatTab';
import { LaporanTab } from './components/LaporanTab';
import { KatalogTab } from './components/KatalogTab';
import { PrinterModal } from './components/PrinterModal';
import { ExcelSyncModal } from './components/ExcelSyncModal';
import { DeployGuideModal } from './components/DeployGuideModal';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'kasir' | 'riwayat' | 'laporan' | 'katalog'>('kasir');

  // Modals
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // App Data with localStorage persistence
  const [products, setProducts] = useState<ProductItem[]>(() => {
    try {
      const saved = localStorage.getItem('wigata_products');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading products', e);
    }
    return CATALOG_PRODUCTS;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('wigata_cart');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('wigata_transactions');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading transactions', e);
    }
    // Initial sample transactions
    const now = new Date();
    return [
      {
        id: 'init_1',
        noNota: 'WGT-20260927-1042',
        date: new Date(now.getTime() - 3600000 * 2).toISOString(),
        dateStr: new Date(now.getTime() - 3600000 * 2).toLocaleDateString('id-ID'),
        tanggalDisplay: new Date(now.getTime() - 3600000 * 2).toLocaleDateString('id-ID', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
        jam: '10:15',
        pelanggan: 'CV Mandiri Grafika',
        hp: '08122334455',
        kasir: 'Admin',
        items: [
          {
            cartId: 'item_1',
            product: CATALOG_PRODUCTS[0], // Flexy 340
            panjang: 3,
            lebar: 1,
            luas: 3,
            totalLuas: 6,
            qty: 2,
            finishing: {
              mataAyam: true,
              mataAyamCount: 4,
              kelim: true,
              laminasiDoffM: false,
              laminasiGlossyM: false,
              ciscut: false,
              potong: false,
              laminasiDoffA3: false,
              laminasiGlossyA3: false,
              bolakBalik: false,
              laminasiDingin: false,
              laminasiPanas: false,
              laminatingF4: false,
              warna2x: false,
              tambahanNomor: false,
            },
            desainFee: 0,
            basePrice: 150000,
            finishingCost: 10000,
            total: 160000,
          },
        ],
        subtotal: 160000,
        diskonPercent: 0,
        diskonRp: 0,
        grandTotal: 160000,
        paymentMethod: 'qris',
        bayar: 160000,
        kembalian: 0,
        statusSyncExcel: 'synced',
      },
      {
        id: 'init_2',
        noNota: 'WGT-20260927-1158',
        date: new Date(now.getTime() - 3600000).toISOString(),
        dateStr: new Date(now.getTime() - 3600000).toLocaleDateString('id-ID'),
        tanggalDisplay: new Date(now.getTime() - 3600000).toLocaleDateString('id-ID', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
        jam: '11:45',
        pelanggan: 'Ibu Rina (Snack Berkah)',
        hp: '085711223344',
        kasir: 'Kasir 1',
        items: [
          {
            cartId: 'item_2',
            product: CATALOG_PRODUCTS[11], // Stiker Chromo A3+
            panjang: 0,
            lebar: 0,
            luas: 0,
            totalLuas: 20,
            qty: 20,
            finishing: {
              mataAyam: false,
              mataAyamCount: 0,
              kelim: false,
              laminasiDoffM: false,
              laminasiGlossyM: false,
              ciscut: true,
              potong: false,
              laminasiDoffA3: false,
              laminasiGlossyA3: false,
              bolakBalik: false,
              laminasiDingin: false,
              laminasiPanas: false,
              laminatingF4: false,
              warna2x: false,
              tambahanNomor: false,
            },
            desainFee: 15000,
            basePrice: 150000,
            finishingCost: 90000, // Ciscut 20 * 4500
            total: 255000,
          },
        ],
        subtotal: 255000,
        diskonPercent: 5,
        diskonRp: 12750,
        grandTotal: 242250,
        paymentMethod: 'tunai',
        bayar: 250000,
        kembalian: 7750,
        statusSyncExcel: 'synced',
      },
    ];
  });

  // Printer & Excel Config
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>(printerService.config);
  const [syncConfig, setSyncConfig] = useState<ExcelSyncConfig>(() => {
    try {
      const saved = localStorage.getItem('wigata_excel_config');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_EXCEL_SYNC_CONFIG;
  });

  const [kasirName, setKasirName] = useState<string>(() => {
    return localStorage.getItem('wigata_kasir_name') || 'Admin';
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('wigata_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('wigata_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('wigata_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('wigata_excel_config', JSON.stringify(syncConfig));
  }, [syncConfig]);

  useEffect(() => {
    localStorage.setItem('wigata_kasir_name', kasirName);
  }, [kasirName]);

  // Subscribe to printer changes
  useEffect(() => {
    return printerService.subscribe((cfg) => {
      setPrinterConfig(cfg);
    });
  }, []);

  // Toast auto-hide
  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // Save transaction handler with automatic real-time Excel sync
  const handleSaveTransaction = async (
    trxData: Omit<Transaction, 'id'>
  ): Promise<Transaction> => {
    const noNota = generateNoNota();
    const newTrx: Transaction = {
      ...trxData,
      id: `trx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      noNota,
      statusSyncExcel: syncConfig.webhookUrl ? 'pending' : 'local_only',
    };

    // If auto-sync is on and webhook URL is present, post real-time
    if (syncConfig.webhookUrl && syncConfig.autoSyncOnSave) {
      try {
        const syncRes = await syncTransactionToExcelWebhook(newTrx, syncConfig.webhookUrl);
        if (syncRes.success) {
          newTrx.statusSyncExcel = 'synced';
          showToast(`Data otomatis disinkronkan ke Excel / Google Sheets!`);
        } else {
          newTrx.statusSyncExcel = 'failed';
          newTrx.syncError = syncRes.error;
          showToast(`Tersimpan lokal. Sync Excel gagal: ${syncRes.error}`);
        }
      } catch (err: unknown) {
        newTrx.statusSyncExcel = 'failed';
        newTrx.syncError = err instanceof Error ? err.message : 'Sync gagal';
      }
    }

    setTransactions((prev) => [newTrx, ...prev]);
    return newTrx;
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleResetCatalog = () => {
    setProducts(CATALOG_PRODUCTS);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#0B1E3A] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        syncConfig={syncConfig}
        printerConfig={printerConfig}
        onOpenExcelModal={() => setIsExcelModalOpen(true)}
        onOpenPrinterModal={() => setIsPrinterModalOpen(true)}
        onOpenDeployModal={() => setIsDeployModalOpen(true)}
        kasirName={kasirName}
        onChangeKasir={setKasirName}
        trxCount={transactions.length}
      />

      {/* Main Tab Views */}
      <main className="flex-1 pb-10">
        {activeTab === 'kasir' && (
          <KasirTab
            products={products}
            cart={cart}
            setCart={setCart}
            onSaveTransaction={handleSaveTransaction}
            printerConfig={printerConfig}
            onOpenPrinterModal={() => setIsPrinterModalOpen(true)}
            onShowToast={showToast}
            kasirName={kasirName}
          />
        )}

        {activeTab === 'riwayat' && (
          <RiwayatTab
            transactions={transactions}
            onDeleteTransaction={handleDeleteTransaction}
            printerConfig={printerConfig}
            onOpenPrinterModal={() => setIsPrinterModalOpen(true)}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'laporan' && (
          <LaporanTab
            transactions={transactions}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'katalog' && (
          <KatalogTab
            products={products}
            setProducts={setProducts}
            onResetDefault={handleResetCatalog}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Modals */}
      <PrinterModal
        isOpen={isPrinterModalOpen}
        onClose={() => setIsPrinterModalOpen(false)}
        onShowToast={showToast}
      />

      <ExcelSyncModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        syncConfig={syncConfig}
        onUpdateConfig={(cfg) => setSyncConfig((prev) => ({ ...prev, ...cfg }))}
        transactions={transactions}
        products={products}
        onImportProducts={(imported) => {
          setProducts(imported);
          showToast(`${imported.length} produk diupdate dari Excel`);
        }}
        onShowToast={showToast}
      />

      <DeployGuideModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
        onShowToast={showToast}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#0B1E3A] text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-black shadow-2xl border border-white/10 flex items-center gap-2 animate-bounce-in">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
