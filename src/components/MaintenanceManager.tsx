import React, { useState } from 'react';
import { useMaintenance } from '../hooks/useMaintenance';
import { useAssets } from '../hooks/useAssets';
import { 
  Wrench, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Loader2, 
  AlertCircle,
  Clock,
  Coins,
  Store,
  FilePlus,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

export const MaintenanceManager: React.FC = () => {
  const [status, setStatus] = useState<string>(''); // PENDING or RESOLVED
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modal Log Ticket state
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [assetId, setAssetId] = useState<number | string>('');
  const [issueDescription, setIssueDescription] = useState('');
  const [assetStatus, setAssetStatus] = useState<'Broken' | 'Maintenance' | ''>('Maintenance');
  const [logError, setLogError] = useState<string | null>(null);

  // Modal Resolve Ticket state
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [resolveTicketId, setResolveTicketId] = useState<number | null>(null);
  const [resolveAssetName, setResolveAssetName] = useState('');
  const [repairCost, setRepairCost] = useState(0);
  const [vendorName, setVendorName] = useState('');
  const [restoreAssetStatus, setRestoreAssetStatus] = useState(true);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Use custom maintenance hook
  const { 
    ticketsData, 
    isLoading, 
    error,
    logTicket,
    isLoggingTicket,
    resolveTicket,
    isResolvingTicket
  } = useMaintenance(status || undefined, page, limit);

  // Use custom assets hook for listing equipments
  const { assetsData: assetsDropdown } = useAssets({ limit: 100 });

  // Modal Controls
  const openLogModal = () => {
    setAssetId(assetsDropdown?.data[0]?.id || '');
    setIssueDescription('');
    setAssetStatus('Maintenance');
    setLogError(null);
    setIsLogOpen(true);
  };

  const closeLogModal = () => {
    setIsLogOpen(false);
    setAssetId('');
    setIssueDescription('');
    setLogError(null);
  };

  const openResolveModal = (id: number, name: string) => {
    setResolveTicketId(id);
    setResolveAssetName(name);
    setRepairCost(0);
    setVendorName('');
    setRestoreAssetStatus(true);
    setResolveError(null);
    setIsResolveOpen(true);
  };

  const closeResolveModal = () => {
    setIsResolveOpen(false);
    setResolveTicketId(null);
    setRepairCost(0);
    setVendorName('');
    setResolveError(null);
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !issueDescription.trim()) {
      setLogError('Asset selection and issue description are required.');
      toast.error('Asset selection and issue description are required.');
      return;
    }

    setLogError(null);

    try {
      await logTicket({
        assetId: Number(assetId),
        issueDescription: issueDescription.trim(),
        assetStatus: assetStatus || undefined
      });
      toast.success('Maintenance ticket logged successfully');
      closeLogModal();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to log maintenance ticket. Ensure fields are valid.';
      setLogError(errMsg);
      toast.error(errMsg);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (repairCost < 0) {
      setResolveError('Repair cost cannot be negative.');
      toast.error('Repair cost cannot be negative.');
      return;
    }
    if (!resolveTicketId) return;

    setResolveError(null);

    try {
      await resolveTicket({
        id: resolveTicketId,
        data: {
          repairCost,
          vendorName: vendorName.trim() || undefined,
          restoreAssetStatus
        }
      });
      toast.success('Maintenance ticket resolved successfully');
      closeResolveModal();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to resolve ticket. Repair cost must not be negative.';
      setResolveError(errMsg);
      toast.error(errMsg);
    }
  };

  // Currency Formatter Helper
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div id="maintenance-manager-page" className="space-y-6 animate-fadeIn">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 id="maintenance-header-title" className="text-2xl font-bold text-slate-900 dark:text-white">Maintenance & Repairs</h2>
          <p id="maintenance-header-desc" className="text-slate-550 dark:text-slate-400 text-xs mt-1 font-light">
            Log damage issues, repair vendor services, and monitor maintenance costs.
          </p>
        </div>
        <button
          id="log-damage-btn"
          onClick={openLogModal}
          className="inline-flex items-center space-x-2 py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-purple-500/10 transition cursor-pointer"
        >
          <Wrench className="w-4 h-4" />
          <span>Log Damage Ticket</span>
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900/80 p-4 rounded-2xl flex items-center space-x-3 text-xs shadow-sm">
        <Filter className="w-4 h-4 text-slate-450 dark:text-slate-500 shrink-0" />
        <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Filter Status:</span>
        <div className="flex space-x-2">
          {['', 'PENDING', 'RESOLVED'].map((s) => {
            const btnId = s ? `filter-status-${s.toLowerCase()}` : 'filter-status-all';
            return (
              <button
                key={s}
                id={btnId}
                onClick={() => { setStatus(s); setPage(1); }}
                className={`py-1.5 px-3 rounded-lg font-semibold transition cursor-pointer ${
                  status === s
                    ? 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                }`}
              >
                {s || 'ALL TICKETS'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tickets List Table */}
      <div className="bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-900 rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div id="maintenance-loading-spinner" className="py-20 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-3" />
            <p className="text-xs">Loading repair tickets...</p>
          </div>
        ) : error || !ticketsData ? (
          <div id="maintenance-error-container" className="py-16 text-center text-red-555 dark:text-red-400 text-xs">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <p className="font-semibold">Failed to fetch maintenance tickets</p>
            <p className="opacity-80">Make sure database connections are online.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table id="maintenance-table" className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-900/10">
                    <th className="py-3 px-6">Equipment</th>
                    <th className="py-3 px-6">Issue Description</th>
                    <th className="py-3 px-6 text-center">Ticket Status</th>
                    <th className="py-3 px-6">Logged Date</th>
                    <th className="py-3 px-6">Repair Cost</th>
                    <th className="py-3 px-6">Vendor Services</th>
                    <th className="py-3 px-6 text-center w-28">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketsData.data.length > 0 ? (
                    ticketsData.data.map((ticket) => (
                      <tr 
                        key={ticket.id} 
                        id={`ticket-row-${ticket.id}`}
                        className="group border-b border-slate-150 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-900/20 transition"
                      >
                        <td className="py-4 px-6">
                          <div>
                            <p id={`ticket-asset-name-${ticket.id}`} className="font-bold text-slate-800 dark:text-slate-200">{ticket.asset_name}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{ticket.asset_sku || 'N/A'}</p>
                          </div>
                        </td>
                        <td id={`ticket-desc-${ticket.id}`} className="py-4 px-6 text-slate-600 dark:text-slate-300 font-light max-w-xs truncate">{ticket.issue_description}</td>
                        <td className="py-4 px-6 text-center">
                          <span 
                            id={`ticket-status-${ticket.id}`}
                            className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                              ticket.status === 'PENDING'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {ticket.status === 'PENDING' ? (
                              <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                            ) : (
                              <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            )}
                            <span>{ticket.status}</span>
                          </span>
                        </td>
                        <td id={`ticket-date-${ticket.id}`} className="py-4 px-6 text-slate-500 dark:text-slate-400 font-mono">{new Date(ticket.created_at).toLocaleString()}</td>
                        <td id={`ticket-cost-${ticket.id}`} className="py-4 px-6 text-slate-700 dark:text-slate-355 font-bold font-mono">
                          {ticket.status === 'RESOLVED' ? formatIDR(ticket.repair_cost) : <span className="text-slate-400 dark:text-slate-600 font-normal italic">Pending repair</span>}
                        </td>
                        <td id={`ticket-vendor-${ticket.id}`} className="py-4 px-6 text-slate-500 dark:text-slate-400 font-light">
                          {ticket.vendor_name || <span className="text-slate-400 dark:text-slate-600 italic">—</span>}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="lg:opacity-40 lg:group-hover:opacity-100 transition-opacity duration-150">
                            {ticket.status === 'PENDING' ? (
                              <button
                                id={`resolve-ticket-btn-${ticket.id}`}
                                onClick={() => openResolveModal(ticket.id, ticket.asset_name || '')}
                                className="inline-flex items-center space-x-1 py-1 px-2.5 bg-emerald-50 dark:bg-emerald-955/40 border border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-white rounded-lg transition text-[10px] font-bold"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Resolve Ticket</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">Resolved</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-450 dark:text-slate-500 italic">
                        No maintenance tickets logged matching this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {ticketsData.pagination && ticketsData.pagination.totalPages > 1 && (
              <div className="py-4 px-6 border-t border-slate-150 dark:border-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Showing page <b>{ticketsData.pagination.currentPage}</b> of <b>{ticketsData.pagination.totalPages}</b>
                </span>
                <div className="flex space-x-2">
                  <button
                    id="maintenance-page-prev"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    id="maintenance-page-next"
                    onClick={() => setPage(p => Math.min(ticketsData.pagination.totalPages, p + 1))}
                    disabled={page === ticketsData.pagination.totalPages}
                    className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Log Damage Ticket dialog modal */}
      {isLogOpen && (
        <div 
          id="log-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
            
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center">
                <Wrench className="w-4.5 h-4.5 text-purple-650 dark:text-purple-400 mr-2" />
                Log Damage / Repair Ticket
              </h3>
              <button 
                id="close-log-modal-btn"
                onClick={closeLogModal} 
                className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 rounded-lg transition"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form id="log-form" onSubmit={handleLogSubmit}>
              <div className="p-6 space-y-4">
                {logError && (
                  <div 
                    id="log-error-message"
                    className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-800 dark:text-red-200 text-xs flex items-start space-x-2 animate-shake"
                  >
                    <AlertCircle className="w-4.5 h-4.5 text-red-500 dark:text-red-400 shrink-0" />
                    <span>{logError}</span>
                  </div>
                )}

                {/* Select Asset */}
                <div className="space-y-1.5">
                  <label htmlFor="log-asset-select" className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Select Damaged Equipment</label>
                  <select
                    id="log-asset-select"
                    value={assetId}
                    onChange={(e) => setAssetId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition text-xs"
                    required
                    disabled={isLoggingTicket}
                  >
                    <option value="" disabled>Select Asset</option>
                    {assetsDropdown?.data.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} (Stock: {asset.stock} left - SKU: {asset.sku || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Change Asset Status option */}
                <div className="space-y-1.5">
                  <label htmlFor="log-asset-status-select" className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Change Operational Status To</label>
                  <select
                    id="log-asset-status-select"
                    value={assetStatus}
                    onChange={(e) => setAssetStatus(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition text-xs"
                    disabled={isLoggingTicket}
                  >
                    <option value="">Do Not Change Status (Keep Current)</option>
                    <option value="Maintenance">Maintenance (Under Repair / Diagnostics)</option>
                    <option value="Broken">Broken (Not Operational / Down)</option>
                  </select>
                </div>

                {/* Issue Description */}
                <div className="space-y-1.5">
                  <label htmlFor="log-desc-textarea" className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Report Details / Damage Description</label>
                  <textarea
                    id="log-desc-textarea"
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="Describe specific issues (e.g., screen cracked, filter blocked, remote control missing)"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition text-xs min-h-[100px] resize-none"
                    required
                    disabled={isLoggingTicket}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-955/40 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-end space-x-3">
                <button
                  id="cancel-log-btn"
                  type="button"
                  onClick={closeLogModal}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-semibold rounded-xl text-xs transition"
                  disabled={isLoggingTicket}
                >
                  Cancel
                </button>
                <button
                  id="submit-log-btn"
                  type="submit"
                  className="py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-purple-500/10 transition flex items-center space-x-1"
                  disabled={isLoggingTicket}
                >
                  {isLoggingTicket ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Logging...</span>
                    </>
                  ) : (
                    <>
                      <FilePlus className="w-3.5 h-3.5" />
                      <span>Log Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Repair Ticket dialog modal */}
      {isResolveOpen && (
        <div 
          id="resolve-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/70 backdrop-blur-sm animate-fadeIn"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
            
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-800 dark:text-white">Resolve Maintenance Ticket</h3>
              <button 
                id="close-resolve-modal-btn"
                onClick={closeResolveModal} 
                className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 rounded-lg transition"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form id="resolve-form" onSubmit={handleResolveSubmit}>
              <div className="p-6 space-y-4">
                {resolveError && (
                  <div 
                    id="resolve-error-message"
                    className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-800 dark:text-red-200 text-xs flex items-start space-x-2 animate-shake"
                  >
                    <AlertCircle className="w-4.5 h-4.5 text-red-500 dark:text-red-400 shrink-0" />
                    <span>{resolveError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Equipment Resolved</label>
                  <p id="resolve-asset-name-label" className="font-bold text-slate-800 dark:text-slate-200 text-sm bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-850">{resolveAssetName}</p>
                </div>

                {/* Repair Cost */}
                <div className="space-y-1.5">
                  <label htmlFor="resolve-cost-input" className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center">
                    <Coins className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 mr-1" />
                    Repair Cost (IDR)
                  </label>
                  <input
                    id="resolve-cost-input"
                    type="number"
                    min="0"
                    value={repairCost}
                    onChange={(e) => setRepairCost(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    placeholder="Enter repair cost in IDR (Rp)"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition text-xs font-mono font-bold"
                    required
                    disabled={isResolvingTicket}
                  />
                </div>

                {/* Vendor Name */}
                <div className="space-y-1.5">
                  <label htmlFor="resolve-vendor-input" className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center">
                    <Store className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 mr-1" />
                    Repair Vendor / Service Shop Name
                  </label>
                  <input
                    id="resolve-vendor-input"
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. Daikin Service Center, Toko Jaya Elektronik"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition text-xs"
                    disabled={isResolvingTicket}
                  />
                </div>

                {/* Restore Asset Status checkbox */}
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 p-4 rounded-xl flex items-center space-x-3 text-xs">
                  <input
                    type="checkbox"
                    id="resolve-restore-checkbox"
                    checked={restoreAssetStatus}
                    onChange={(e) => setRestoreAssetStatus(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-655 focus:ring-purple-550 focus:ring-offset-white dark:focus:ring-offset-slate-900 border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer"
                    disabled={isResolvingTicket}
                  />
                  <label htmlFor="resolve-restore-checkbox" className="text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                    Restore equipment operational status to <b>Available</b>
                  </label>
                </div>
              </div>

              {/* Resolve Actions */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-955/40 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-end space-x-3">
                <button
                  id="cancel-resolve-btn"
                  type="button"
                  onClick={closeResolveModal}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-semibold rounded-xl text-xs transition"
                  disabled={isResolvingTicket}
                >
                  Cancel
                </button>
                <button
                  id="submit-resolve-btn"
                  type="submit"
                  className="py-2 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-emerald-500/10 transition flex items-center space-x-1"
                  disabled={isResolvingTicket}
                >
                  {isResolvingTicket ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Resolving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Complete Repair</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
