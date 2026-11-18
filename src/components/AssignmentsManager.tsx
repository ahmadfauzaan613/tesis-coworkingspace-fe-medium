import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAssignments } from '../hooks/useAssignments';
import { useAssets } from '../hooks/useAssets';
import { Badge, ErrorState, FormError, LoadingState, Modal, ModalFooter, PageHeader, Pagination } from './kit';
import {
  btnPrimary,
  btnRow,
  btnSecondary,
  errorMessage,
  formatDate,
  hintCls,
  inputCls,
  labelCls,
  loanStatus,
  tableCls,
  tdCls,
  thCls,
} from '../lib/ui';

export const AssignmentsManager: React.FC = () => {
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isOpen, setIsOpen] = useState(false);
  const [assetId, setAssetId] = useState<number | string>('');
  const [assignedTo, setAssignedTo] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);

  const { assignmentsData, isLoading, error, refetch, checkoutAsset, isCheckingOut, returnAsset } = useAssignments(page, limit);

  // shortcut: hanya 100 aset pertama yang dimuat untuk pilihan, ganti ke pencarian kalau katalog lebih besar
  const { assetsData: assetsDropdown } = useAssets({ limit: 100 });
  const availableAssets = assetsDropdown?.data.filter((a) => a.stock > 0 && a.status === 'Available') || [];
  const selectedAsset = availableAssets.find((a) => a.id === Number(assetId));

  const openModal = () => {
    setAssetId(availableAssets[0]?.id || '');
    setAssignedTo('');
    setQuantity(1);
    setFormError(null);
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !assignedTo.trim() || quantity <= 0) {
      setFormError('Pilih aset, isi peminjam, dan jumlah minimal 1.');
      return;
    }
    if (selectedAsset && selectedAsset.stock < quantity) {
      setFormError(`Stok ${selectedAsset.name} tinggal ${selectedAsset.stock}. Kurangi jumlah pinjaman.`);
      return;
    }
    setFormError(null);
    try {
      await checkoutAsset({ assetId: Number(assetId), assignedTo: assignedTo.trim(), quantity });
      toast.success(`${selectedAsset?.name ?? 'Aset'} dipinjamkan ke ${assignedTo.trim()}.`);
      closeModal();
    } catch (err) {
      setFormError(errorMessage(err, 'Peminjaman gagal dicatat. Pastikan stok aset masih cukup.'));
    }
  };

  const handleReturn = async (id: number, assetName: string, recipient: string) => {
    if (!window.confirm(`Tandai ${assetName} dari ${recipient} sudah dikembalikan? Stok akan bertambah lagi.`)) return;
    try {
      await returnAsset(id);
      toast.success(`${assetName} sudah kembali. Stok diperbarui.`);
    } catch (err) {
      toast.error(errorMessage(err, 'Pengembalian gagal dicatat. Coba lagi.'));
    }
  };

  return (
    <div id="assignments-manager-page" className="space-y-6">
      <PageHeader
        id="assignments-header-title"
        title="Peminjaman"
        description={<span id="assignments-header-desc">Catat aset yang dipinjam staf, member, atau ruangan, lalu tandai saat sudah kembali.</span>}
        action={
          <button type="button" id="checkout-asset-btn" onClick={openModal} className={btnPrimary}>
            <Plus className="size-4" aria-hidden="true" />
            Catat peminjaman
          </button>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border">
        {isLoading ? (
          <LoadingState id="assignments-loading-spinner">Memuat data peminjaman...</LoadingState>
        ) : error || !assignmentsData ? (
          <ErrorState id="assignments-error-container" title="Data peminjaman gagal dimuat" onRetry={() => refetch()} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table id="assignments-table" className={tableCls}>
                <thead className="border-b border-border bg-muted">
                  <tr>
                    <th className={thCls}>Aset</th>
                    <th className={thCls}>Peminjam</th>
                    <th className={`${thCls} text-right`}>Jumlah</th>
                    <th className={thCls}>Status</th>
                    <th className={thCls}>Dipinjam</th>
                    <th className={thCls}>Dikembalikan</th>
                    <th className={`${thCls} text-right`}>
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {assignmentsData.data.length > 0 ? (
                    assignmentsData.data.map((loan) => {
                      const s = loanStatus[loan.status] ?? { label: loan.status, tone: 'neutral' as const };
                      return (
                        <tr key={loan.id} id={`loan-row-${loan.id}`}>
                          <td className={tdCls}>
                            <p id={`loan-asset-name-${loan.id}`} className="font-semibold">
                              {loan.asset_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{loan.asset_sku || 'Tanpa SKU'}</p>
                          </td>
                          <td id={`loan-recipient-${loan.id}`} className={tdCls}>
                            {loan.assigned_to}
                          </td>
                          <td id={`loan-qty-${loan.id}`} className={`${tdCls} text-right font-semibold tabular-nums`}>
                            {loan.quantity}
                          </td>
                          <td className={tdCls}>
                            <Badge id={`loan-status-${loan.id}`} tone={s.tone}>
                              {s.label}
                            </Badge>
                          </td>
                          <td id={`loan-date-${loan.id}`} className={`${tdCls} whitespace-nowrap text-muted-foreground`}>
                            {formatDate(loan.created_at)}
                          </td>
                          <td id={`loan-return-date-${loan.id}`} className={`${tdCls} whitespace-nowrap text-muted-foreground`}>
                            {loan.returned_at ? formatDate(loan.returned_at) : '-'}
                          </td>
                          <td className="px-4 py-1.5 text-right">
                            {loan.status === 'ACTIVE' && (
                              <button
                                type="button"
                                id={`return-asset-btn-${loan.id}`}
                                onClick={() => handleReturn(loan.id, loan.asset_name || 'Aset', loan.assigned_to)}
                                className={`${btnRow} whitespace-nowrap`}
                              >
                                <RotateCcw className="size-4" aria-hidden="true" />
                                Tandai kembali
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">
                        Belum ada peminjaman. Pakai tombol Catat peminjaman saat ada aset yang keluar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              idPrefix="assignments"
              page={assignmentsData.pagination?.currentPage ?? page}
              totalPages={assignmentsData.pagination?.totalPages ?? 1}
              onChange={setPage}
            />
          </>
        )}
      </div>

      {isOpen && (
        <Modal id="checkout-modal" closeId="close-checkout-modal-btn" title="Catat peminjaman" onClose={closeModal}>
          <form id="checkout-form" onSubmit={handleSubmit} noValidate>
            <div className="space-y-4 p-5">
              {formError && <FormError id="assignments-error-message">{formError}</FormError>}

              {availableAssets.length > 0 ? (
                <div>
                  <label htmlFor="checkout-asset-select" className={labelCls}>
                    Aset
                  </label>
                  <select
                    id="checkout-asset-select"
                    value={assetId}
                    onChange={(e) => setAssetId(e.target.value)}
                    className={inputCls}
                    disabled={isCheckingOut}
                  >
                    {availableAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name}, stok {asset.stock}
                        {asset.sku ? ` (${asset.sku})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className={hintCls}>Hanya aset berstatus Tersedia dengan stok di atas 0 yang muncul.</p>
                </div>
              ) : (
                <p className="rounded-lg bg-muted px-4 py-3 text-sm">
                  Belum ada aset yang bisa dipinjamkan: semua stok habis atau sedang dalam perawatan.{' '}
                  <Link to="/assets" className="font-semibold text-primary underline">
                    Buka daftar aset
                  </Link>
                </p>
              )}

              <div>
                <label htmlFor="checkout-recipient-input" className={labelCls}>
                  Dipinjam oleh
                </label>
                <input
                  id="checkout-recipient-input"
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Nama orang, tim, atau ruangan"
                  className={inputCls}
                  disabled={availableAssets.length === 0 || isCheckingOut}
                />
              </div>

              <div>
                <label htmlFor="checkout-qty-input" className={labelCls}>
                  Jumlah
                </label>
                <input
                  id="checkout-qty-input"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={selectedAsset?.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className={`${inputCls} tabular-nums`}
                  disabled={availableAssets.length === 0 || isCheckingOut}
                />
              </div>
            </div>

            <ModalFooter>
              <button id="cancel-checkout-btn" type="button" onClick={closeModal} className={btnSecondary} disabled={isCheckingOut}>
                Batal
              </button>
              <button id="submit-checkout-btn" type="submit" className={btnPrimary} disabled={isCheckingOut || availableAssets.length === 0}>
                {isCheckingOut ? 'Menyimpan...' : 'Catat peminjaman'}
              </button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  );
};
