import React, { useState } from 'react';
import { ProductItem, ProductCategory } from '../types';
import { CATEGORIES, formatRupiah } from '../utils/defaultData';
import {
  ListOrdered,
  Plus,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Download,
  Upload,
  RotateCcw,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface KatalogTabProps {
  products: ProductItem[];
  setProducts: React.Dispatch<React.SetStateAction<ProductItem[]>>;
  onResetDefault: () => void;
  onShowToast: (msg: string) => void;
}

export const KatalogTab: React.FC<KatalogTabProps> = ({
  products,
  setProducts,
  onResetDefault,
  onShowToast,
}) => {
  const [selectedCat, setSelectedCat] = useState<ProductCategory | 'Semua'>('Semua');
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New product form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Meteran');
  const [price, setPrice] = useState<number>(25000);
  const [unit, setUnit] = useState('/m²');
  const [popular, setPopular] = useState(false);
  const [description, setDescription] = useState('');

  const filtered = selectedCat === 'Semua' ? products : products.filter((p) => p.category === selectedCat);

  const handleOpenAdd = () => {
    setName('');
    setCategory('Meteran');
    setPrice(25000);
    setUnit('/m²');
    setPopular(false);
    setDescription('');
    setIsAddingNew(true);
    setEditingProduct(null);
  };

  const handleOpenEdit = (prod: ProductItem) => {
    setEditingProduct(prod);
    setName(prod.name);
    setCategory(prod.category);
    setPrice(prod.price);
    setUnit(prod.unit);
    setPopular(!!prod.popular);
    setDescription(prod.description || '');
    setIsAddingNew(false);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onShowToast('Nama produk tidak boleh kosong');
      return;
    }

    if (isAddingNew) {
      const newProd: ProductItem = {
        id: `prod_${Date.now()}`,
        name: name.trim(),
        category,
        price: Number(price),
        unit: unit.trim(),
        popular,
        description: description.trim(),
      };
      setProducts((prev) => [...prev, newProd]);
      onShowToast(`Produk ${newProd.name} berhasil ditambahkan`);
    } else if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: name.trim(),
                category,
                price: Number(price),
                unit: unit.trim(),
                popular,
                description: description.trim(),
              }
            : p
        )
      );
      onShowToast(`Produk ${name} diperbarui`);
    }

    setIsAddingNew(false);
    setEditingProduct(null);
  };

  const handleDelete = (id: string, prodName: string) => {
    if (window.confirm(`Hapus produk "${prodName}" dari katalog?`)) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      onShowToast(`Produk "${prodName}" dihapus`);
    }
  };

  // Export catalog only to Excel
  const handleExportCatalog = () => {
    const rows = products.map((p, idx) => ({
      No: idx + 1,
      'ID Produk': p.id,
      'Nama Produk': p.name,
      Kategori: p.category,
      'Harga (Rp)': p.price,
      Satuan: p.unit,
      Populer: p.popular ? 'YA' : 'TIDAK',
      Deskripsi: p.description || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Katalog_Produk');
    XLSX.writeFile(wb, `Katalog_Wigata_Digital_Print_${new Date().toISOString().slice(0, 10)}.xlsx`);
    onShowToast('File Excel Katalog Produk berhasil diunduh');
  };

  return (
    <div className="max-w-[1440px] mx-auto p-3 sm:p-4 space-y-4">
      {/* Header and Action Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-black/5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-lg text-[#0B1E3A] flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-[#FFD23F]" />
              Katalog Produk & Tarif Cetak
            </h3>
            <p className="text-xs text-black/50">
              Kelola daftar bahan, ukuran, dan harga percetakan Wigata Digital Print
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCatalog}
              className="px-3.5 py-2 rounded-2xl bg-[#F1F3F8] hover:bg-black/10 text-[#0B1E3A] font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download Excel
            </button>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-2xl bg-[#0B1E3A] hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Tambah Produk
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => setSelectedCat('Semua')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap ${
              selectedCat === 'Semua'
                ? 'bg-[#0B1E3A] text-white shadow-sm'
                : 'bg-[#F1F3F8] text-[#0B1E3A] hover:bg-black/10'
            }`}
          >
            Semua ({products.length})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap ${
                selectedCat === cat
                  ? 'bg-[#0B1E3A] text-white shadow-sm'
                  : 'bg-[#F1F3F8] text-[#0B1E3A] hover:bg-black/10'
              }`}
            >
              {cat} ({products.filter((p) => p.category === cat).length})
            </button>
          ))}
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-black/5">
        <div className="overflow-x-auto rounded-2xl border border-black/10">
          <table className="w-full text-xs">
            <thead className="bg-[#0B1E3A] text-white text-[11px] uppercase tracking-wider">
              <tr>
                <th className="p-3 text-left">No</th>
                <th className="p-3 text-left">Nama Produk & Bahan</th>
                <th className="p-3 text-left">Kategori</th>
                <th className="p-3 text-right">Harga Satuan</th>
                <th className="p-3 text-left">Satuan</th>
                <th className="p-3 text-left">Deskripsi</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filtered.map((prod, idx) => (
                <tr key={prod.id} className="hover:bg-[#F6F7FB]/70 transition">
                  <td className="p-3 text-black/50 font-bold">{idx + 1}</td>
                  <td className="p-3 font-bold text-[#0B1E3A]">
                    <div className="flex items-center gap-1.5">
                      <span>{prod.name}</span>
                      {prod.popular && (
                        <span className="bg-[#FFD23F] text-[#0B1E3A] text-[9px] px-1.5 py-0.5 rounded font-black">
                          POPULER
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="bg-[#F1F3F8] text-[#0B1E3A] px-2.5 py-1 rounded-full font-bold text-[10px]">
                      {prod.category}
                    </span>
                  </td>
                  <td className="p-3 text-right font-black text-sm text-[#0B1E3A]">
                    {formatRupiah(prod.price)}
                  </td>
                  <td className="p-3 text-black/60 font-semibold">{prod.unit}</td>
                  <td className="p-3 text-black/60 text-[11px] max-w-xs truncate">
                    {prod.description || '-'}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(prod)}
                        className="p-1.5 rounded-xl bg-[#0B1E3A] text-white hover:bg-black transition"
                        title="Edit Produk"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(prod.id, prod.name)}
                        className="p-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"
                        title="Hapus Produk"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Reset to default link */}
        <div className="mt-4 pt-3 border-t border-black/5 flex justify-between items-center text-xs">
          <span className="text-black/50">Total {products.length} produk tersimpan di database</span>
          <button
            onClick={() => {
              if (window.confirm('Kembalikan katalog ke pengaturan awal standar Wigata?')) {
                onResetDefault();
                onShowToast('Katalog dikembalikan ke data awal');
              }
            }}
            className="text-black/50 hover:text-black flex items-center gap-1 text-[11px] font-bold"
          >
            <RotateCcw className="w-3 h-3" />
            Reset ke Katalog Default Wigata
          </button>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(isAddingNew || editingProduct) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-[480px] w-full p-5 shadow-2xl space-y-4 border border-black/10">
            <div className="flex items-center justify-between pb-2 border-b">
              <h4 className="font-black text-base text-[#0B1E3A]">
                {isAddingNew ? 'Tambah Produk Baru' : `Edit ${editingProduct?.name}`}
              </h4>
              <button
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingProduct(null);
                }}
                className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-black/70 mb-1">Nama Produk / Bahan</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Flexy 440 High Resolution"
                  className="w-full bg-[#F6F7FB] border border-black/10 rounded-xl px-3 py-2 font-bold outline-none focus:border-[#0B1E3A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-black/70 mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="w-full bg-[#F6F7FB] border border-black/10 rounded-xl px-3 py-2 font-bold outline-none cursor-pointer focus:border-[#0B1E3A]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-black/70 mb-1">Satuan</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="/m², /lbr, /rim, /pcs"
                    className="w-full bg-[#F6F7FB] border border-black/10 rounded-xl px-3 py-2 font-bold outline-none focus:border-[#0B1E3A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-black/70 mb-1">Harga Satuan (Rp)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-[#F6F7FB] border border-black/10 rounded-xl px-3 py-2 font-bold text-sm outline-none focus:border-[#0B1E3A]"
                />
              </div>

              <div>
                <label className="block font-bold text-black/70 mb-1">Deskripsi / Keterangan</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan bahan dan kegunaan..."
                  className="w-full bg-[#F6F7FB] border border-black/10 rounded-xl px-3 py-2 outline-none focus:border-[#0B1E3A]"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={popular}
                  onChange={(e) => setPopular(e.target.checked)}
                  className="w-4 h-4 accent-[#0B1E3A]"
                />
                <span className="font-bold text-[#0B1E3A]">Tandai sebagai Produk Populer</span>
              </label>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingProduct(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#F1F3F8] hover:bg-black/10 font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0B1E3A] hover:bg-black text-white font-bold transition shadow-sm"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
