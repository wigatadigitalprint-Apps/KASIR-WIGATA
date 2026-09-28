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
import {
  loginWithGoogle,
  logoutGoogle,
  subscribeToAuth,
  subscribeToTransactions,
  subscribeToProducts,
  saveTransactionToCloud,
  deleteTransactionFromCloud,
  saveAllProductsToCloud,
  testFirestoreConnection
} from './utils/firebase';
import { User as FirebaseUser } from 'firebase/auth';
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

  // Firebase Auth & Cloud Sync State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // Modals
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // App Data with localStorage persistence as initial fallback
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
    return [];
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

  // Test Firestore Connection on Boot
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Subscribe to Firebase Auth
  useEffect(() => {
    const unsub = subscribeToAuth((user) => {
      setCurrentUser(user);
      if (user) {
        showToast(`Terhubung dengan Google: ${user.displayName || user.email}`);
      }
    });
    return () => unsub();
  }, []);

  // Real-time Cloud Sync for Transactions & Products
  useEffect(() => {
    setIsCloudSyncing(true);
    const unsubTrans = subscribeToTransactions((cloudTrans) => {
      if (cloudTrans && cloudTrans.length > 0) {
        setTransactions(cloudTrans);
      }
      setIsCloudSyncing(false);
    });

    const unsubProds = subscribeToProducts((cloudProds) => {
      if (cloudProds && cloudProds.length > 0) {
        setProducts(cloudProds);
      }
    });

    return () => {
      unsubTrans();
      unsubProds();
    };
  }, []);

  // Save changes to localStorage as offline cache
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

  // Handle Google Login & Logout
  const handleGoogleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      if (user) {
        showToast(`Login berhasil! Menyinkronkan data komputer...`);
        // Upload initial local data if cloud is empty
        if (products.length > 0) {
          saveAllProductsToCloud(products, user);
        }
        for (const t of transactions) {
          saveTransactionToCloud(t, user);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal login Google';
      showToast(`Login Google gagal: ${msg}`);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logoutGoogle();
      showToast('Berhasil keluar dari Akun Google.');
    } catch {
      showToast('Gagal logout.');
    }
  };

  // Save transaction handler with automatic real-time Cloud & Excel sync
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

    // 1. Simpan ke Cloud Firestore (agar komputer lain otomatis menerima secara instan)
    saveTransactionToCloud(newTrx, currentUser).then((saved) => {
      if (saved) {
        setIsCloudSyncing(true);
        setTimeout(() => setIsCloudSyncing(false), 800);
      }
    });

    // 2. Jika webhook Excel aktif, kirim juga ke Excel / Google Sheets
    if (syncConfig.webhookUrl && syncConfig.autoSyncOnSave) {
      try {
        const syncRes = await syncTransactionToExcelWebhook(newTrx, syncConfig.webhookUrl);
        if (syncRes.success) {
          newTrx.statusSyncExcel = 'synced';
          showToast(`Nota ${newTrx.noNota} tersimpan & sinkron multi-PC!`);
        } else {
          newTrx.statusSyncExcel = 'failed';
          newTrx.syncError = syncRes.error;
          showToast(`Tersimpan di Cloud. Sync Excel: ${syncRes.error}`);
        }
      } catch (err: unknown) {
        newTrx.statusSyncExcel = 'failed';
        newTrx.syncError = err instanceof Error ? err.message : 'Sync gagal';
      }
    } else {
      showToast(`Nota ${newTrx.noNota} tersimpan & sinkron ke komputer lain!`);
    }

    setTransactions((prev) => [newTrx, ...prev.filter((t) => t.id !== newTrx.id)]);
    return newTrx;
  };

  const handleDeleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    await deleteTransactionFromCloud(id);
    showToast('Transaksi dihapus dari semua komputer.');
  };

  const handleUpdateProducts: React.Dispatch<React.SetStateAction<ProductItem[]>> = (action) => {
    setProducts((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      saveAllProductsToCloud(next, currentUser);
      return next;
    });
    showToast('Katalog diperbarui di semua komputer.');
  };

  const handleResetCatalog = async () => {
    setProducts(CATALOG_PRODUCTS);
    await saveAllProductsToCloud(CATALOG_PRODUCTS, currentUser);
    showToast('Katalog direset ke default.');
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#0B1E3A] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Navigation Header with Google Account Login */}
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
        currentUser={currentUser}
        onLoginGoogle={handleGoogleLogin}
        onLogoutGoogle={handleGoogleLogout}
        isCloudSyncing={isCloudSyncing}
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
            setProducts={handleUpdateProducts}
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
          handleUpdateProducts(imported);
          showToast(`${imported.length} produk diupdate dan disinkronkan ke cloud`);
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
