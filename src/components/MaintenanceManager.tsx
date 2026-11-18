import React, { useState } from 'react';
import { CheckCircle, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMaintenance } from '../hooks/useMaintenance';
import { useAssets } from '../hooks/useAssets';
import { Badge, ErrorState, FormError, LoadingState, Modal, ModalFooter, PageHeader, Pagination } from './kit';
import {
  btnPrimary,
  btnRow,
  btnSecondary,
  errorMessage,
  formatDate,
  formatIDR,
  hintCls,
  inputCls,
  labelCls,
  tableCls,
  tdCls,
  textareaCls,
  thCls,
  ticketStatus,
} from '../lib/ui';

const filters = [
  { value: '', label: 'Semua', id: 'filter-status-all' },
  { value: 'PENDING', label: 'Menunggu', id: 'filter-status-pending' },
  { value: 'RESOLVED', label: 'Selesai', id: 'filter-status-resolved' },
];

export const MaintenanceManager: React.FC = () => {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isLogOpen, setIsLogOpen] = useState(false);
  const [assetId, setAssetId] = useState<number | string>('');
  const [issueDescription, setIssueDescription] = useState('');
  const [assetStatus, setAssetStatus] = useState<'Broken' | 'Maintenance' | ''>('Maintenance');
  const [logError, setLogError] = useState<string | null>(null);

  const [resolveTicketId, setResolveTicketId] = useState<number | null>(null);
  const [resolveAssetName, setResolveAssetName] = useState('');
  const [repairCost, setRepairCost] = useState(0);
  const [vendorName, setVendorName] = useState('');
  const [restoreAssetStatus, setRestoreAssetStatus] = useState(true);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const { ticketsData, isLoading, error, refetch, logTicket, isLoggingTicket, resolveTicket, isResolvingTicket } = useMaintenance(
    status || undefined,
    page,
    limit,
  );

  // shortcut: hanya 100 aset pertama yang dimuat untuk pilihan, ganti ke pencarian kalau katalog lebih besar
  const { assetsData: assetsDropdown } = useAssets({ limit: 100 });

  const openLogModal = () => {
    setAssetId(assetsDropdown?.data[0]?.id || '');
    setIssueDescription('');
    setAssetStatus('Maintenance');
    setLogError(null);
    setIsLogOpen(true);
  };

  const openResolveModal = (id: number, name: string) => {
    setResolveTicketId(id);
    setResolveAssetName(name);
    setRepairCost(0);
    setVendorName('');
    setRestoreAssetStatus(true);
    setResolveError(null);
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !issueDescription.trim()) {
      setLogError('Pilih aset dan jelaskan kerusakannya.');
      return;
    }
    setLogError(null);
    try {
      await logTicket({ assetId: Number(assetId), issueDescription: issueDescription.trim(), assetStatus: assetStatus || undefined });
      toast.success('Laporan kerusakan dicatat.');
      setIsLogOpen(false);
    } catch (err) {
      setLogError(errorMessage(err, 'Laporan gagal dicatat. Cek isian lalu coba lagi.'));
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (repairCost < 0) {
      setResolveError('Biaya perbaikan tidak boleh negatif.');
      return;
    }
    if (!resolveTicketId) return;
    setResolveError(null);
    try {
      await resolveTicket({
        id: resolveTicketId,
        data: { repairCost, vendorName: vendorName.trim() || undefined, restoreAssetStatus },
      });
      toast.success(`Perbaikan ${resolveAssetName} ditandai selesai.`);
      setResolveTicketId(null);
    } catch (err) {
      setResolveError(errorMessage(err, 'Tiket gagal diselesaikan. Coba lagi.'));
    }
  };

  return (
    <div id="maintenance-manager-page" className="space-y-6">
      <PageHeader
        id="maintenance-header-title"
        title="Perawatan"
        description={<span id="maintenance-header-desc">Laporan kerusakan, vendor yang memperbaiki, dan biaya perbaikan setiap aset.</span>}
        action={
          <button type="button" id="log-damage-btn" onClick={openLogModal} className={btnPrimary}>
            <Plus className="size-4" aria-hidden="true" />
            Laporkan kerusakan
          </button>
        }
      />

      <div role="group" aria-label="Saring status tiket" className="inline-flex rounded-lg bg-muted p-1">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            id={f.id}
            aria-pressed={status === f.value}
            onClick={() => {
              setStatus(f.value);
              setPage(1);
            }}
            className={`h-10 rounded-md px-4 text-sm font-semibold transition-colors ${
              status === f.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        {isLoading ? (
          <LoadingState id="maintenance-loading-spinner">Memuat tiket perawatan...</LoadingState>
        ) : error || !ticketsData ? (
          <ErrorState id="maintenance-error-container" title="Tiket perawatan gagal dimuat" onRetry={() => refetch()} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table id="maintenance-table" className={tableCls}>
                <thead className="border-b border-border bg-muted">
                  <tr>
                    <th className={thCls}>Aset</th>
                    <th className={thCls}>Kerusakan</th>
                    <th className={thCls}>Status</th>
                    <th className={thCls}>Dilaporkan</th>
                    <th className={`${thCls} text-right`}>Biaya</th>
                    <th className={thCls}>Vendor</th>
                    <th className={`${thCls} text-right`}>
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ticketsData.data.length > 0 ? (
                    ticketsData.data.map((ticket) => {
                      const s = ticketStatus[ticket.status] ?? { label: ticket.status, tone: 'neutral' as const };
                      return (
                        <tr key={ticket.id} id={`ticket-row-${ticket.id}`}>
                          <td className={tdCls}>
                            <p id={`ticket-asset-name-${ticket.id}`} className="font-semibold">
                              {ticket.asset_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{ticket.asset_sku || 'Tanpa SKU'}</p>
                          </td>
                          <td id={`ticket-desc-${ticket.id}`} className={`${tdCls} max-w-xs`}>
                            {ticket.issue_description}
                          </td>
                          <td className={tdCls}>
                            <Badge id={`ticket-status-${ticket.id}`} tone={s.tone}>
                              {s.label}
                            </Badge>
                          </td>
                          <td id={`ticket-date-${ticket.id}`} className={`${tdCls} whitespace-nowrap text-muted-foreground`}>
                            {formatDate(ticket.created_at)}
                          </td>
                          <td id={`ticket-cost-${ticket.id}`} className={`${tdCls} whitespace-nowrap text-right tabular-nums`}>
                            {ticket.status === 'RESOLVED' ? formatIDR(ticket.repair_cost) : <span className="text-muted-foreground">-</span>}
                          </td>
                          <td id={`ticket-vendor-${ticket.id}`} className={`${tdCls} text-muted-foreground`}>
                            {ticket.vendor_name || '-'}
                          </td>
                          <td className="px-4 py-1.5 text-right">
                            {ticket.status === 'PENDING' && (
                              <button
                                type="button"
                                id={`resolve-ticket-btn-${ticket.id}`}
                                onClick={() => openResolveModal(ticket.id, ticket.asset_name || 'aset')}
                                className={`${btnRow} whitespace-nowrap`}
                              >
                                <CheckCircle className="size-4" aria-hidden="true" />
                                Tandai selesai
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">
                        {status
                          ? 'Tidak ada tiket dengan status ini. Pilih Semua untuk melihat tiket lain.'
                          : 'Belum ada laporan kerusakan. Pakai tombol Laporkan kerusakan saat ada aset bermasalah.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              idPrefix="maintenance"
              page={ticketsData.pagination?.currentPage ?? page}
              totalPages={ticketsData.pagination?.totalPages ?? 1}
              onChange={setPage}
            />
          </>
        )}
      </div>

      {isLogOpen && (
        <Modal id="log-modal" closeId="close-log-modal-btn" title="Laporkan kerusakan" onClose={() => setIsLogOpen(false)}>
          <form id="log-form" onSubmit={handleLogSubmit} noValidate>
            <div className="space-y-4 p-5">
              {logError && <FormError id="log-error-message">{logError}</FormError>}

              <div>
                <label htmlFor="log-asset-select" className={labelCls}>
                  Aset yang rusak
                </label>
                <select
                  id="log-asset-select"
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className={inputCls}
                  disabled={isLoggingTicket}
                >
                  <option value="" disabled>
                    Pilih aset
                  </option>
                  {assetsDropdown?.data.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name}
                      {asset.sku ? ` (${asset.sku})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="log-asset-status-select" className={labelCls}>
                  Ubah status aset menjadi
                </label>
                <select
                  id="log-asset-status-select"
                  value={assetStatus}
                  onChange={(e) => setAssetStatus(e.target.value as typeof assetStatus)}
                  className={inputCls}
                  disabled={isLoggingTicket}
                >
                  <option value="Maintenance">Perawatan (masih bisa diperbaiki)</option>
                  <option value="Broken">Rusak (tidak bisa dipakai)</option>
                  <option value="">Jangan ubah status</option>
                </select>
                <p className={hintCls}>Aset berstatus Perawatan atau Rusak tidak bisa dipinjamkan.</p>
              </div>

              <div>
                <label htmlFor="log-desc-textarea" className={labelCls}>
                  Kerusakan
                </label>
                <textarea
                  id="log-desc-textarea"
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Contoh: layar retak di pojok kanan, remote hilang"
                  className={textareaCls}
                  disabled={isLoggingTicket}
                />
              </div>
            </div>

            <ModalFooter>
              <button id="cancel-log-btn" type="button" onClick={() => setIsLogOpen(false)} className={btnSecondary} disabled={isLoggingTicket}>
                Batal
              </button>
              <button id="submit-log-btn" type="submit" className={btnPrimary} disabled={isLoggingTicket}>
                {isLoggingTicket ? 'Menyimpan...' : 'Simpan laporan'}
              </button>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {resolveTicketId !== null && (
        <Modal
          id="resolve-modal"
          closeId="close-resolve-modal-btn"
          title={`Selesaikan perbaikan ${resolveAssetName}`}
          onClose={() => setResolveTicketId(null)}
        >
          <form id="resolve-form" onSubmit={handleResolveSubmit} noValidate>
            <div className="space-y-4 p-5">
              {resolveError && <FormError id="resolve-error-message">{resolveError}</FormError>}
              <p id="resolve-asset-name-label" className="sr-only">
                {resolveAssetName}
              </p>

              <div>
                <label htmlFor="resolve-cost-input" className={labelCls}>
                  Biaya perbaikan (Rp)
                </label>
                <input
                  id="resolve-cost-input"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={repairCost}
                  onChange={(e) => setRepairCost(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className={`${inputCls} tabular-nums`}
                  disabled={isResolvingTicket}
                />
                <p className={hintCls}>Isi 0 kalau perbaikan gratis atau masih garansi.</p>
              </div>

              <div>
                <label htmlFor="resolve-vendor-input" className={labelCls}>
                  Vendor <span className="font-normal text-muted-foreground">(opsional)</span>
                </label>
                <input
                  id="resolve-vendor-input"
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="Nama bengkel atau service center"
                  className={inputCls}
                  disabled={isResolvingTicket}
                />
              </div>

              <label htmlFor="resolve-restore-checkbox" className="flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  id="resolve-restore-checkbox"
                  checked={restoreAssetStatus}
                  onChange={(e) => setRestoreAssetStatus(e.target.checked)}
                  className="size-5 accent-primary"
                  disabled={isResolvingTicket}
                />
                Kembalikan status aset menjadi Tersedia
              </label>
            </div>

            <ModalFooter>
              <button id="cancel-resolve-btn" type="button" onClick={() => setResolveTicketId(null)} className={btnSecondary} disabled={isResolvingTicket}>
                Batal
              </button>
              <button id="submit-resolve-btn" type="submit" className={btnPrimary} disabled={isResolvingTicket}>
                {isResolvingTicket ? 'Menyimpan...' : 'Tandai selesai'}
              </button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  );
};
