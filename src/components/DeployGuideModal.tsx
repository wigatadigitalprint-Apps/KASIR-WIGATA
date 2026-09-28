import React, { useState } from 'react';
import { Globe, Server, Smartphone, Check, Copy, ExternalLink, X, ShieldCheck, Users } from 'lucide-react';

interface DeployGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const DeployGuideModal: React.FC<DeployGuideModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'vercel' | 'cpanel' | 'pwa' | 'workflow'>('vercel');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      onShowToast(`Perintah ${label} berhasil disalin!`);
      setTimeout(() => setCopiedText(null), 3000);
    } catch {
      onShowToast('Gagal menyalin');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-[660px] w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-black/10">
        {/* Header */}
        <div className="bg-[#0B1E3A] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFD23F] text-[#0B1E3A] flex items-center justify-center shadow">
              <Globe className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-lg tracking-tight leading-tight">Panduan Deploy & Akses Tim Online</h3>
              <p className="text-xs text-white/70">Cara menerbitkan aplikasi ke Web Hosting agar tim bisa akses kapan saja</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="bg-[#F6F7FB] px-5 pt-3 border-b border-black/10 flex gap-2 overflow-x-auto scrollbar-none">
          {[
            { id: 'vercel', label: '1. Vercel / Netlify (Gratis)', icon: Server },
            { id: 'cpanel', label: '2. Web Hosting cPanel', icon: Globe },
            { id: 'pwa', label: '3. Install di HP Android/PC', icon: Smartphone },
            { id: 'workflow', label: '4. Cara Kerja Tim', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition border-b-2 ${
                  activeTab === tab.id
                    ? 'bg-white text-[#0B1E3A] border-[#0B1E3A] shadow-sm'
                    : 'text-black/60 hover:text-black border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {activeTab === 'vercel' && (
            <div className="space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-emerald-950">
                <span className="font-bold">Direkomendasikan (Paling Cepat & Gratis):</span> Menggunakan Vercel atau Netlify.
                Aplikasi langsung aktif dengan domain HTTPS (wajib untuk Web Bluetooth & Thermal Print di Chrome Android/PC).
              </div>

              <div className="space-y-2">
                <div className="font-bold text-sm text-[#0B1E3A]">Langkah Deploy ke Vercel (Hanya 2 Menit):</div>
                <ol className="list-decimal list-inside space-y-2 text-black/80 leading-relaxed">
                  <li>
                    Buka terminal proyek Anda dan jalankan perintah build untuk memastikan tidak ada error:
                    <div className="bg-black text-white p-2.5 rounded-xl font-mono text-[11px] my-1 flex justify-between items-center">
                      <span>npm run build</span>
                      <button
                        onClick={() => copyToClipboard('npm run build', 'Build')}
                        className="text-amber-400 hover:text-amber-300 font-sans text-xs flex items-center gap-1"
                      >
                        {copiedText === 'Build' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedText === 'Build' ? 'Disalin' : 'Salin'}
                      </button>
                    </div>
                  </li>
                  <li>
                    Upload repository ini ke <strong>GitHub</strong> (akun gratis).
                  </li>
                  <li>
                    Buka <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold inline-flex items-center gap-0.5">Vercel.com <ExternalLink className="w-2.5 h-2.5" /></a> &gt; Login dengan GitHub &gt; Klik <strong>"Add New Project"</strong>.
                  </li>
                  <li>
                    Pilih repository Wigata POS Anda &gt; Klik <strong>Deploy</strong>.
                  </li>
                  <li>
                    Selesai! Anda akan mendapatkan link website online permanen seperti <code>https://wigata-pos.vercel.app</code> yang siap dibagikan ke seluruh tim kasir.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'cpanel' && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-blue-950">
                <span className="font-bold">Untuk Web Hosting Berbayar Sendiri (cPanel / Niagahoster / Rumahweb / DomaiNesia):</span>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-black/80 leading-relaxed">
                <li>
                  Jalankan perintah build di komputer Anda:
                  <div className="bg-black text-white p-2 rounded-xl font-mono text-[11px] my-1">
                    npm run build
                  </div>
                </li>
                <li>
                  Akan muncul folder baru bernama <strong><code>dist</code></strong> di dalam folder proyek.
                </li>
                <li>
                  Zip seluruh isi di dalam folder <code>dist</code> tersebut.
                </li>
                <li>
                  Buka <strong>cPanel &gt; File Manager &gt; public_html</strong> (atau subdomain seperti <code>pos.wigataprint.com</code>).
                </li>
                <li>
                  Upload file zip dan <strong>Ekstrak</strong> langsung di folder tersebut.
                </li>
                <li>
                  Pastikan SSL HTTPS diaktifkan di cPanel (Let&apos;s Encrypt gratis) agar Bluetooth dan USB thermal printer diizinkan oleh browser.
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'pwa' && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-amber-950">
                <span className="font-bold">Install sebagai Aplikasi di Android, Tablet & PC Kasir:</span>
              </div>
              <ul className="list-disc list-inside space-y-2 text-black/80 leading-relaxed">
                <li>
                  <strong>Di HP Android (Chrome):</strong> Buka link website Anda &gt; Klik titik tiga di kanan atas Chrome &gt; Pilih <strong>"Tambahkan ke Layar Utama" (Install App)</strong>. Ikon Wigata POS akan muncul di layar seperti aplikasi Play Store!
                </li>
                <li>
                  <strong>Di PC / Laptop Windows (Chrome / Edge):</strong> Buka link website &gt; Klik ikon instal di samping kanan kolom alamat browser (atau Menu &gt; Install Wigata POS). Aplikasi akan terbuka dalam jendela tersendiri tanpa address bar.
                </li>
                <li>
                  <strong>Mendukung Offline:</strong> Jika koneksi internet di percetakan sempat terputus, kasir tetap bisa menghitung harga dan mencetak struk thermal. Transaksi otomatis di-sync ke Excel saat internet kembali terhubung.
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="space-y-3">
              <div className="bg-[#0B1E3A] text-white rounded-2xl p-4 space-y-2">
                <div className="font-black text-sm text-[#FFD23F] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Sistem Kasir Terpusat Wigata Digital Print
                </div>
                <p className="text-white/80 leading-relaxed">
                  Semua kasir di toko, desainer di ruang produksi, dan pemilik di luar kota dapat menggunakan satu link yang sama secara bersamaan:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-[#F6F7FB] border rounded-xl">
                  <div className="font-bold text-xs">Kasir Depan</div>
                  <div className="text-[10px] text-black/60 mt-1">Input order, terima pembayaran tunai/QRIS, cetak struk via Bluetooth/USB</div>
                </div>
                <div className="p-3 bg-[#F6F7FB] border rounded-xl">
                  <div className="font-bold text-xs">Tim Desain / Mesin</div>
                  <div className="text-[10px] text-black/60 mt-1">Melihat rincian ukuran meteran/A3+ dan biaya desain yang sudah di-ACC</div>
                </div>
                <div className="p-3 bg-[#F6F7FB] border rounded-xl">
                  <div className="font-bold text-xs">Pemilik / Owner</div>
                  <div className="text-[10px] text-black/60 mt-1">Melihat omset dan riwayat penjualan masuk langsung di Excel / Google Sheets</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F6F7FB] border-t border-black/10 flex justify-between items-center">
          <div className="text-[11px] text-black/50">
            Wigata POS siap diakses secara online multi-perangkat
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#0B1E3A] text-white font-bold text-sm hover:bg-black transition"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};
