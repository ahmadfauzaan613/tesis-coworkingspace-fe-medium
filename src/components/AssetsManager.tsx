import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAssets, useStockHistory } from '../hooks/useAssets';
import { useCategories } from '../hooks/useCategories';
import { assetService } from '../services/assetService';
import type { Asset } from '../types';
import { cn } from '../lib/utils';
import { Badge, ErrorState, FormError, LoadingState, Modal, ModalFooter, PageHeader, Pagination } from './kit';
import {
  LOW_STOCK,
  assetStatus as statusMap,
  btnDanger,
  btnIcon,
  btnPrimary,
  btnRow,
  btnSecondary,
  changeType,
  errorMessage,
  formatDate,
  formatQty,
  hintCls,
  inputCls,
  labelCls,
  signedQty,
  tableCls,
  tdCls,
  textareaCls,
  thCls,
  type AdjustType,
} from '../lib/ui';

const adjustOptions: { value: AdjustType; label: string }[] = [
  { value: 'ADDITION', label: 'Penambahan (beli atau restock)' },
  { value: 'DEDUCTION', label: 'Pengurangan (dipakai habis, dipindah)' },
  { value: 'DAMAGE', label: 'Rusak (tidak bisa dipakai lagi)' },
  { value: 'AUDIT', label: 'Audit (koreksi hasil hitung ulang)' },
];

export const AssetsManager: React.FC = () => {
  // Dashboard bisa membuka halaman ini langsung ke tab riwayat atau filter stok menipis.
  const [params] = useSearchParams();
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'history'>(() =>
    params.get('tab') === 'history' ? 'history' : 'catalog',
  );

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | string>('');
  const [status, setStatus] = useState('');
  const [lowStock, setLowStock] = useState(() => params.get('lowStock') === 'true');
  const [page, setPage] = useState(1);
  const [logPage, setLogPage] = useState(1);

  const [isAssetOpen, setIsAssetOpen] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<number | null>(null);
  const [assetName, setAssetName] = useState('');
  const [assetSku, setAssetSku] = useState('');
  const [assetCategoryId, setAssetCategoryId] = useState<number | string>('');
  const [assetDescription, setAssetDescription] = useState('');
  const [initialStock, setInitialStock] = useState(0);
  const [assetLocation, setAssetLocation] = useState('');
  const [assetStatus, setAssetStatus] = useState('Available');
  const [assetFormError, setAssetFormError] = useState<string | null>(null);

  const [adjustAsset, setAdjustAsset] = useState<Asset | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustType, setAdjustType] = useState<AdjustType>('ADDITION');
  const [adjustRemarks, setAdjustRemarks] = useState('');
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const { categoriesData } = useCategories(1, 100);

  const filterParams = {
    page,
    limit: 10,
    search: search.trim() || undefined,
    categoryId: categoryId || undefined,
    status: status || undefined,
    lowStock: lowStock ? ('true' as const) : undefined,
  };

  const {
    assetsData,
    isLoading: assetsLoading,
    error: assetsError,
    refetch,
    createAsset,
    isCreating,
    updateAsset,
    isUpdating,
    adjustStock,
    isAdjusting,
    deleteAsset,
  } = useAssets(filterParams);

  const { data: logsData, isLoading: logsLoading, error: logsError, refetch: refetchLogs } = useStockHistory(logPage, 10);

  const hasFilter = !!(search.trim() || categoryId || status || lowStock);
  const resetFilters = () => {
    setSearch('');
    setCategoryId('');
    setStatus('');
    setLowStock(false);
    setPage(1);
  };

  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim() || !assetCategoryId) {
      setAssetFormError('Nama aset dan kategori wajib diisi.');
      return;
    }
    setAssetFormError(null);
    const payload = {
      categoryId: Number(assetCategoryId),
      name: assetName.trim(),
      sku: assetSku.trim() || undefined,
      description: assetDescription.trim() || undefined,
      location: assetLocation.trim() || undefined,
      status: assetStatus,
    };
    try {
      if (editingAssetId) {
        await updateAsset({ id: editingAssetId, data: payload });
        toast.success(`${payload.name} diperbarui.`);
      } else {
        await createAsset({ ...payload, initialStock });
        toast.success(`${payload.name} didaftarkan.`);
      }
      setIsAssetOpen(false);
    } catch (err) {
      setAssetFormError(errorMessage(err, 'Aset gagal disimpan. SKU mungkin sudah dipakai aset lain.'));
    }
  };

  const nextStock = adjustAsset ? adjustAsset.stock + signedQty(adjustType, adjustQty) : 0;

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustAsset) return;
    if (adjustQty === 0) {
      setAdjustError('Jumlah tidak boleh 0.');
      return;
    }
    if (nextStock < 0) {
      setAdjustError(`Stok ${adjustAsset.name} tinggal ${adjustAsset.stock}, tidak bisa dikurangi sebanyak itu.`);
      return;
    }
    setAdjustError(null);
    try {
      await adjustStock({
        id: adjustAsset.id,
        data: { changeQty: signedQty(adjustType, adjustQty), changeType: adjustType, remarks: adjustRemarks.trim() || undefined },
      });
      toast.success(`Stok ${adjustAsset.name} sekarang ${nextStock}.`);
      setAdjustAsset(null);
    } catch (err) {
      setAdjustError(errorMessage(err, 'Stok gagal diubah. Coba lagi.'));
    }
  };

  const handleDeleteAsset = async (id: number, name: string) => {
    if (!window.confirm(`Hapus ${name} dari daftar aset? Riwayat stoknya ikut terhapus.`)) return;
    try {
      await deleteAsset(id);
      toast.success(`${name} dihapus.`);
    } catch (err) {
      toast.error(errorMessage(err, `${name} gagal dihapus. Mungkin masih ada peminjaman atau tiket yang terkait.`));
    }
  };

  const handleExportCSV = async () => {
    try {
      const csv = await assetService.exportCSV();
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `spacehub_inventaris_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('File CSV diunduh.');
    } catch {
      toast.error('Ekspor CSV gagal. Cek koneksi ke server lalu coba lagi.');
    }
  };

  const openAssetModal = (asset?: Asset) => {
    setEditingAssetId(asset?.id ?? null);
    setAssetName(asset?.name ?? '');
    setAssetSku(asset?.sku ?? '');
    setAssetCategoryId(asset?.category_id ?? categoriesData?.data[0]?.id ?? '');
    setAssetDescription(asset?.description ?? '');
    setInitialStock(0);
    setAssetLocation(asset?.location ?? '');
    setAssetStatus(asset?.status ?? 'Available');
    setAssetFormError(null);
    setIsAssetOpen(true);
  };

  const openAdjustModal = (asset: Asset) => {
    setAdjustAsset(asset);
    setAdjustQty(0);
    setAdjustType('ADDITION');
    setAdjustRemarks('');
    setAdjustError(null);
  };

  const isSaving = isCreating || isUpdating;
  const tabBtn = (active: boolean) =>
    `h-10 rounded-md px-4 text-sm font-semibold transition-colors ${
      active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
    }`;

  return (
    <div id="assets-manager-page" className="space-y-6">
      <PageHeader
        title="Aset"
        description="Semua peralatan di lokasi SpaceHub beserta stok, lokasi simpan, dan kondisinya."
        action={
          activeSubTab === 'catalog' && (
            <>
              <button type="button" id="export-csv-btn" onClick={handleExportCSV} className={btnSecondary}>
                <Download className="size-4" aria-hidden="true" />
                Ekspor CSV
              </button>
              <button type="button" id="register-equipment-btn" onClick={() => openAssetModal()} className={btnPrimary}>
                <Plus className="size-4" aria-hidden="true" />
                Daftarkan aset
              </button>
            </>
          )
        }
      />

      <div id="assets-tab-navigation" role="group" aria-label="Tampilan aset" className="inline-flex rounded-lg bg-muted p-1">
        <button type="button" id="tab-btn-catalog" aria-pressed={activeSubTab === 'catalog'} onClick={() => setActiveSubTab('catalog')} className={tabBtn(activeSubTab === 'catalog')}>
          Daftar aset
        </button>
        <button type="button" id="tab-btn-history" aria-pressed={activeSubTab === 'history'} onClick={() => setActiveSubTab('history')} className={tabBtn(activeSubTab === 'history')}>
          Riwayat stok
        </button>
      </div>

      {activeSubTab === 'catalog' ? (
        <>
          <div id="assets-filters-panel" className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]">
            <div>
              <label htmlFor="search-input" className={labelCls}>
                Cari
              </label>
              <div className="relative mt-1.5">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  id="search-input"
                  name="search"
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Nama atau SKU"
                  className={cn(inputCls, 'mt-0 pl-9')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="filter-category-select" className={labelCls}>
                Kategori
              </label>
              <select
                id="filter-category-select"
                name="filterCategory"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setPage(1);
                }}
                className={inputCls}
              >
                <option value="">Semua kategori</option>
                {categoriesData?.data.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-status-select" className={labelCls}>
                Kondisi
              </label>
              <select
                id="filter-status-select"
                name="filterStatus"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className={inputCls}
              >
                <option value="">Semua kondisi</option>
                {Object.entries(statusMap).map(([value, s]) => (
                  <option key={value} value={value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <label htmlFor="filter-low-stock-select" className="flex min-h-11 items-center gap-3 text-sm font-semibold">
              <input
                id="filter-low-stock-select"
                type="checkbox"
                checked={lowStock}
                onChange={(e) => {
                  setLowStock(e.target.checked);
                  setPage(1);
                }}
                className="size-5 accent-primary"
              />
              Stok di bawah {LOW_STOCK}
            </label>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            {assetsLoading ? (
              <LoadingState id="assets-loading-spinner">Memuat daftar aset...</LoadingState>
            ) : assetsError || !assetsData ? (
              <ErrorState id="assets-error-container" title="Daftar aset gagal dimuat" onRetry={() => refetch()} />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table id="assets-table" className={`${tableCls} min-w-[880px]`}>
                    <thead className="border-b border-border bg-muted">
                      <tr>
                        <th className={thCls}>Aset</th>
                        <th className={thCls}>SKU</th>
                        <th className={thCls}>Kategori</th>
                        <th className={thCls}>Lokasi</th>
                        <th className={`${thCls} text-right`}>Stok</th>
                        <th className={thCls}>Kondisi</th>
                        <th className={`${thCls} text-right`}>
                          <span className="sr-only">Aksi</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {assetsData.data.length > 0 ? (
                        assetsData.data.map((asset) => {
                          const s = statusMap[asset.status] ?? { label: asset.status, tone: 'neutral' as const };
                          return (
                            <tr key={asset.id} id={`asset-row-${asset.id}`}>
                              <td className={tdCls}>
                                <p id={`asset-name-${asset.id}`} className="font-semibold">
                                  {asset.name}
                                </p>
                                {asset.description && (
                                  <p id={`asset-desc-${asset.id}`} className="max-w-xs truncate text-xs text-muted-foreground">
                                    {asset.description}
                                  </p>
                                )}
                              </td>
                              <td id={`asset-sku-${asset.id}`} className={`${tdCls} whitespace-nowrap text-muted-foreground`}>
                                {asset.sku || '-'}
                              </td>
                              <td id={`asset-cat-${asset.id}`} className={tdCls}>
                                {asset.category_name}
                              </td>
                              <td id={`asset-loc-${asset.id}`} className={`${tdCls} text-muted-foreground`}>
                                {asset.location || '-'}
                              </td>
                              <td className={`${tdCls} text-right`}>
                                <span
                                  id={`asset-stock-${asset.id}`}
                                  className={`font-bold tabular-nums ${
                                    asset.stock === 0 ? 'text-destructive' : asset.stock < LOW_STOCK ? 'text-warning' : ''
                                  }`}
                                >
                                  {asset.stock}
                                </span>
                                {asset.stock < LOW_STOCK && (
                                  <span className="block text-xs text-muted-foreground">{asset.stock === 0 ? 'habis' : 'menipis'}</span>
                                )}
                              </td>
                              <td className={tdCls}>
                                <Badge tone={s.tone}>{s.label}</Badge>
                              </td>
                              <td className="px-2 py-1.5">
                                <div className="flex items-center justify-end">
                                  <button
                                    type="button"
                                    id={`adjust-stock-btn-${asset.id}`}
                                    onClick={() => openAdjustModal(asset)}
                                    className={`${btnRow} mr-1 whitespace-nowrap`}
                                  >
                                    Ubah stok
                                  </button>
                                  <button
                                    type="button"
                                    id={`edit-asset-btn-${asset.id}`}
                                    onClick={() => openAssetModal(asset)}
                                    aria-label={`Ubah data ${asset.name}`}
                                    title="Ubah data"
                                    className={btnIcon}
                                  >
                                    <Pencil className="size-4" aria-hidden="true" />
                                  </button>
                                  <button
                                    type="button"
                                    id={`delete-asset-btn-${asset.id}`}
                                    onClick={() => handleDeleteAsset(asset.id, asset.name)}
                                    aria-label={`Hapus ${asset.name}`}
                                    title="Hapus"
                                    className={btnDanger}
                                  >
                                    <Trash2 className="size-4" aria-hidden="true" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">
                            {hasFilter ? (
                              <>
                                Tidak ada aset yang cocok dengan filter ini.{' '}
                                <button type="button" onClick={resetFilters} className="inline-flex min-h-11 items-center font-semibold text-primary underline">
                                  Hapus semua filter
                                </button>
                              </>
                            ) : (
                              'Belum ada aset. Pakai tombol Daftarkan aset untuk menambah yang pertama.'
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  idPrefix="assets"
                  page={assetsData.pagination?.currentPage ?? page}
                  totalPages={assetsData.pagination?.totalPages ?? 1}
                  onChange={setPage}
                />
              </>
            )}
          </div>
        </>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          {logsLoading ? (
            <LoadingState id="logs-loading-spinner">Memuat riwayat stok...</LoadingState>
          ) : logsError || !logsData ? (
            <ErrorState id="logs-empty" title="Riwayat stok gagal dimuat" onRetry={() => refetchLogs()} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table id="history-logs-table" className={tableCls}>
                  <thead className="border-b border-border bg-muted">
                    <tr>
                      <th className={thCls}>Aset</th>
                      <th className={thCls}>Jenis perubahan</th>
                      <th className={`${thCls} text-right`}>Jumlah</th>
                      <th className={thCls}>Catatan</th>
                      <th className={thCls}>Oleh</th>
                      <th className={`${thCls} text-right`}>Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logsData.data.length > 0 ? (
                      logsData.data.map((log) => {
                        const t = changeType[log.change_type] ?? { label: log.change_type, tone: 'neutral' as const };
                        return (
                          <tr key={log.id} id={`history-row-${log.id}`}>
                            <td className={tdCls}>
                              <p className="font-semibold">{log.asset_name}</p>
                              <p className="text-xs text-muted-foreground">{log.asset_sku || 'Tanpa SKU'}</p>
                            </td>
                            <td className={tdCls}>
                              <Badge tone={t.tone}>{t.label}</Badge>
                            </td>
                            <td
                              className={`${tdCls} text-right font-bold tabular-nums ${
                                log.change_qty > 0 ? 'text-success' : log.change_qty < 0 ? 'text-destructive' : ''
                              }`}
                            >
                              {formatQty(log.change_qty)}
                            </td>
                            <td className={`${tdCls} text-muted-foreground`}>{log.remarks || '-'}</td>
                            <td className={tdCls}>{log.admin_username || 'Sistem'}</td>
                            <td className={`${tdCls} whitespace-nowrap text-right text-muted-foreground`}>{formatDate(log.created_at)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">
                          Belum ada riwayat. Setiap aset baru dan perubahan stok tercatat di sini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                idPrefix="logs"
                page={logsData.pagination?.currentPage ?? logPage}
                totalPages={logsData.pagination?.totalPages ?? 1}
                onChange={setLogPage}
              />
            </>
          )}
        </div>
      )}

      {isAssetOpen && (
        <Modal
          id="asset-form-modal"
          closeId="asset-modal-close-btn"
          title={editingAssetId ? 'Ubah data aset' : 'Daftarkan aset'}
          onClose={() => setIsAssetOpen(false)}
        >
          <form id="asset-form" onSubmit={handleAssetSubmit} noValidate>
            <div className="space-y-4 p-5">
              {assetFormError && <FormError id="asset-form-error">{assetFormError}</FormError>}

              <div>
                <label htmlFor="asset-name-input" className={labelCls}>
                  Nama aset
                </label>
                <input
                  id="asset-name-input"
                  name="name"
                  type="text"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder="Contoh: Proyektor ruang rapat"
                  className={inputCls}
                  disabled={isSaving}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="asset-category-select" className={labelCls}>
                    Kategori
                  </label>
                  <select
                    id="asset-category-select"
                    name="categoryId"
                    value={assetCategoryId}
                    onChange={(e) => setAssetCategoryId(e.target.value)}
                    className={inputCls}
                    disabled={isSaving}
                  >
                    <option value="" disabled>
                      Pilih kategori
                    </option>
                    {categoriesData?.data.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="asset-sku-input" className={labelCls}>
                    SKU <span className="font-normal text-muted-foreground">(opsional)</span>
                  </label>
                  <input
                    id="asset-sku-input"
                    name="sku"
                    type="text"
                    value={assetSku}
                    onChange={(e) => setAssetSku(e.target.value)}
                    placeholder="Kode unik aset"
                    className={inputCls}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="asset-location-input" className={labelCls}>
                  Lokasi simpan <span className="font-normal text-muted-foreground">(opsional)</span>
                </label>
                <input
                  id="asset-location-input"
                  name="location"
                  type="text"
                  value={assetLocation}
                  onChange={(e) => setAssetLocation(e.target.value)}
                  placeholder="Contoh: Gudang lantai 2"
                  className={inputCls}
                  disabled={isSaving}
                />
              </div>

              {editingAssetId ? (
                <div>
                  <label htmlFor="asset-status-select" className={labelCls}>
                    Kondisi
                  </label>
                  <select
                    id="asset-status-select"
                    name="status"
                    value={assetStatus}
                    onChange={(e) => setAssetStatus(e.target.value)}
                    className={inputCls}
                    disabled={isSaving}
                  >
                    {Object.entries(statusMap).map(([value, s]) => (
                      <option key={value} value={value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label htmlFor="asset-initial-stock-input" className={labelCls}>
                    Stok awal
                  </label>
                  <input
                    id="asset-initial-stock-input"
                    name="initialStock"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={initialStock}
                    onChange={(e) => setInitialStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className={`${inputCls} tabular-nums`}
                    disabled={isSaving}
                  />
                  <p className={hintCls}>Setelah tersimpan, ubah stok lewat tombol Ubah stok supaya tercatat di riwayat.</p>
                </div>
              )}

              <div>
                <label htmlFor="asset-desc-textarea" className={labelCls}>
                  Keterangan <span className="font-normal text-muted-foreground">(opsional)</span>
                </label>
                <textarea
                  id="asset-desc-textarea"
                  name="description"
                  value={assetDescription}
                  onChange={(e) => setAssetDescription(e.target.value)}
                  placeholder="Nomor seri, merek, atau spesifikasi"
                  className={textareaCls}
                  disabled={isSaving}
                />
              </div>
            </div>

            <ModalFooter>
              <button id="asset-save-cancel-btn" type="button" onClick={() => setIsAssetOpen(false)} className={btnSecondary} disabled={isSaving}>
                Batal
              </button>
              <button id="asset-save-submit-btn" type="submit" className={btnPrimary} disabled={isSaving}>
                {isSaving ? 'Menyimpan...' : editingAssetId ? 'Simpan perubahan' : 'Daftarkan aset'}
              </button>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {adjustAsset && (
        <Modal id="stock-adjust-modal" closeId="adjust-modal-close-btn" title={`Ubah stok ${adjustAsset.name}`} onClose={() => setAdjustAsset(null)}>
          <form id="adjust-form" onSubmit={handleAdjustSubmit} noValidate>
            <div className="space-y-4 p-5">
              {adjustError && <FormError id="adjust-form-error">{adjustError}</FormError>}
              <p id="adjust-asset-name-label" className="sr-only">
                {adjustAsset.name}
              </p>

              <div>
                <label htmlFor="adjust-type-select" className={labelCls}>
                  Jenis perubahan
                </label>
                <select
                  id="adjust-type-select"
                  name="changeType"
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as AdjustType)}
                  className={inputCls}
                  disabled={isAdjusting}
                >
                  {adjustOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="adjust-qty-input" className={labelCls}>
                  Jumlah
                </label>
                <input
                  id="adjust-qty-input"
                  name="changeQty"
                  type="number"
                  inputMode="numeric"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value, 10) || 0)}
                  aria-describedby="adjust-qty-preview"
                  className={`${inputCls} tabular-nums`}
                  disabled={isAdjusting}
                />
                <p id="adjust-qty-preview" className={`${hintCls} tabular-nums`}>
                  {adjustType === 'AUDIT' ? 'Pakai angka negatif untuk mengurangi. ' : ''}
                  Stok sekarang {adjustAsset.stock}, setelah disimpan{' '}
                  <span className={`font-semibold ${nextStock < 0 ? 'text-destructive' : 'text-foreground'}`}>{nextStock}</span>.
                </p>
              </div>

              <div>
                <label htmlFor="adjust-remarks-textarea" className={labelCls}>
                  Catatan <span className="font-normal text-muted-foreground">(opsional)</span>
                </label>
                <textarea
                  id="adjust-remarks-textarea"
                  name="remarks"
                  value={adjustRemarks}
                  onChange={(e) => setAdjustRemarks(e.target.value)}
                  placeholder="Contoh: beli 10 unit dari vendor, hasil audit bulanan"
                  className={textareaCls}
                  disabled={isAdjusting}
                />
              </div>
            </div>

            <ModalFooter>
              <button id="adjust-cancel-btn" type="button" onClick={() => setAdjustAsset(null)} className={btnSecondary} disabled={isAdjusting}>
                Batal
              </button>
              <button id="adjust-submit-btn" type="submit" className={btnPrimary} disabled={isAdjusting}>
                {isAdjusting ? 'Menyimpan...' : 'Simpan perubahan stok'}
              </button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  );
};
