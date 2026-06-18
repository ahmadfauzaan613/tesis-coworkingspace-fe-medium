import React, { useState } from 'react';
import { useAssignments } from '../hooks/useAssignments';
import { useAssets } from '../hooks/useAssets';
import { 
  Send, 
  RotateCcw, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Loader2, 
  AlertCircle,
  FileCheck,
  Briefcase,
  Layers,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AssignmentsManager: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modal Checkout State
  const [isOpen, setIsOpen] = useState(false);
  const [assetId, setAssetId] = useState<number | string>('');
  const [assignedTo, setAssignedTo] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);

  // Use custom assignments hook
  const { 
    assignmentsData, 
    isLoading, 
    error,
    checkoutAsset,
    isCheckingOut,
    returnAsset
  } = useAssignments(page, limit);

  // Use custom assets hook to get catalog list for available assets
  const { assetsData: assetsDropdown } = useAssets({ limit: 100 });

  // Filters to find available assets with stock > 0
  const availableAssets = assetsDropdown?.data.filter(
    (asset) => asset.stock > 0 && asset.status === 'Available'
  ) || [];

  const openModal = () => {
    setAssetId(availableAssets[0]?.id || '');
    setAssignedTo('');
    setQuantity(1);
    setFormError(null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setAssetId('');
    setAssignedTo('');
    setQuantity(1);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !assignedTo.trim() || quantity <= 0) {
      setFormError('All fields are required. Quantity must be > 0.');
      toast.error('All fields are required. Quantity must be > 0.');
      return;
    }

    // Check quantity bounds locally
    const selectedAsset = availableAssets.find((a) => a.id === Number(assetId));
    if (selectedAsset && selectedAsset.stock < quantity) {
      const msg = `Insufficient stock. Only ${selectedAsset.stock} items available.`;
      setFormError(msg);
      toast.error(msg);
      return;
    }

    setFormError(null);

    try {
      await checkoutAsset({
        assetId: Number(assetId),
        assignedTo: assignedTo.trim(),
        quantity
      });
      toast.success('Asset loan checked out successfully');
      closeModal();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Checkout assignment failed. Ensure asset has enough stock.';
      setFormError(errMsg);
      toast.error(errMsg);
    }
  };

  const handleReturn = async (id: number, assetName: string, recipient: string) => {
    if (window.confirm(`Mark equipment "${assetName}" assigned to "${recipient}" as returned?`)) {
      try {
        await returnAsset(id);
        toast.success('Asset returned successfully. Stock level restored.');
      } catch (err: any) {
        const errMsg = err.response?.data?.message || 'Failed to process equipment return.';
        toast.error(errMsg);
      }
    }
  };

  return (
    <div id="assignments-manager-page" className="space-y-6 animate-fadeIn">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 id="assignments-header-title" className="text-2xl font-bold text-slate-900 dark:text-white">Asset Assignments</h2>
          <p id="assignments-header-desc" className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-light">
            Assign equipment items to employees, coworkers, or coworking zones and manage returns.
          </p>
        </div>
        <button
          id="checkout-asset-btn"
          onClick={openModal}
          className="inline-flex items-center space-x-2 py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-purple-500/10 transition cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>Checkout Asset</span>
        </button>
      </div>

      {/* Assignments list table */}
      <div className="bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-900 rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div id="assignments-loading-spinner" className="py-20 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-3" />
            <p className="text-xs">Loading loans registry...</p>
          </div>
        ) : error || !assignmentsData ? (
          <div id="assignments-error-container" className="py-16 text-center text-red-550 dark:text-red-400 text-xs">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <p className="font-semibold">Failed to fetch assignments logs</p>
            <p className="opacity-80">Make sure database connections are online.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table id="assignments-table" className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-900/10">
                    <th className="py-3 px-6">Assigned Equipment</th>
                    <th className="py-3 px-6">Assigned To</th>
                    <th className="py-3 px-6 text-center w-20">Quantity</th>
                    <th className="py-3 px-6 text-center">Status</th>
                    <th className="py-3 px-6">Checkout Date</th>
                    <th className="py-3 px-6">Return Date</th>
                    <th className="py-3 px-6 text-center w-28">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignmentsData.data.length > 0 ? (
                    assignmentsData.data.map((loan) => (
                      <tr 
                        key={loan.id} 
                        id={`loan-row-${loan.id}`}
                        className="group border-b border-slate-150 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-900/20 transition"
                      >
                        <td className="py-4 px-6">
                          <div>
                            <p id={`loan-asset-name-${loan.id}`} className="font-bold text-slate-800 dark:text-slate-200">{loan.asset_name}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{loan.asset_sku || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-300">
                          <span className="inline-flex items-center space-x-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            <span id={`loan-recipient-${loan.id}`}>{loan.assigned_to}</span>
                          </span>
                        </td>
                        <td id={`loan-qty-${loan.id}`} className="py-4 px-6 text-center font-bold text-slate-800 dark:text-slate-200">{loan.quantity}</td>
                        <td className="py-4 px-6 text-center">
                          <span 
                            id={`loan-status-${loan.id}`}
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              loan.status === 'ACTIVE'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/60'
                            }`}
                          >
                            {loan.status}
                          </span>
                        </td>
                        <td id={`loan-date-${loan.id}`} className="py-4 px-6 text-slate-500 dark:text-slate-400 font-mono">{new Date(loan.created_at).toLocaleString()}</td>
                        <td id={`loan-return-date-${loan.id}`} className="py-4 px-6 text-slate-500 dark:text-slate-400 font-mono">
                          {loan.returned_at ? new Date(loan.returned_at).toLocaleString() : <span className="text-slate-400 dark:text-slate-600 italic">No return date</span>}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="lg:opacity-40 lg:group-hover:opacity-100 transition-opacity duration-150">
                            {loan.status === 'ACTIVE' ? (
                              <button
                                id={`return-asset-btn-${loan.id}`}
                                onClick={() => handleReturn(loan.id, loan.asset_name || '', loan.assigned_to)}
                                className="inline-flex items-center space-x-1 py-1 px-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white rounded-lg transition text-[10px] font-bold"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Return Asset</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 dark:text-slate-600 italic flex items-center justify-center space-x-1">
                                <Sparkles className="w-3 h-3 text-slate-450 dark:text-slate-600" />
                                <span>Completed</span>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-450 dark:text-slate-500 italic">
                        No checkout assignments logged. Click "Checkout Asset" to issue a loan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {assignmentsData.pagination && assignmentsData.pagination.totalPages > 1 && (
              <div className="py-4 px-6 border-t border-slate-150 dark:border-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Showing page <b>{assignmentsData.pagination.currentPage}</b> of <b>{assignmentsData.pagination.totalPages}</b>
                </span>
                <div className="flex space-x-2">
                  <button
                    id="assignments-page-prev"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    id="assignments-page-next"
                    onClick={() => setPage(p => Math.min(assignmentsData.pagination.totalPages, p + 1))}
                    disabled={page === assignmentsData.pagination.totalPages}
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

      {/* Checkout asset dialog modal */}
      {isOpen && (
        <div 
          id="checkout-modal" 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
            
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center">
                <Briefcase className="w-4.5 h-4.5 text-purple-650 dark:text-purple-400 mr-2" />
                Equipment Checkout Form
              </h3>
              <button 
                id="close-checkout-modal-btn"
                onClick={closeModal} 
                className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg transition"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form id="checkout-form" onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                {formError && (
                  <div 
                    id="assignments-error-message"
                    className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-800 dark:text-red-200 text-xs flex items-start space-x-2 animate-shake"
                  >
                    <AlertCircle className="w-4.5 h-4.5 text-red-555 dark:text-red-400 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Available Assets Dropdown */}
                <div className="space-y-1.5">
                  <label htmlFor="checkout-asset-select" className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Select Available Equipment</label>
                  {availableAssets.length > 0 ? (
                    <select
                      id="checkout-asset-select"
                      value={assetId}
                      onChange={(e) => setAssetId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition text-xs"
                      required
                      disabled={isCheckingOut}
                    >
                      {availableAssets.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.name} (Stock: {asset.stock} left - SKU: {asset.sku || 'N/A'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 text-xs italic">
                      ⚠️ No equipment items with stock are currently available. Check stock levels or register equipment.
                    </div>
                  )}
                </div>

                {/* Assigned To (recipient name) */}
                <div className="space-y-1.5">
                  <label htmlFor="checkout-recipient-input" className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assigned To (Person / Room)</label>
                  <input
                    id="checkout-recipient-input"
                    type="text"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    placeholder="e.g. John Doe, Meeting Room 3, Finance Team"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition text-xs"
                    required
                    disabled={availableAssets.length === 0 || isCheckingOut}
                  />
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <label htmlFor="checkout-qty-input" className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quantity to Checkout</label>
                  <input
                    id="checkout-qty-input"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition text-xs font-bold font-mono"
                    required
                    disabled={availableAssets.length === 0 || isCheckingOut}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-955/40 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-end space-x-3">
                <button
                  id="cancel-checkout-btn"
                  type="button"
                  onClick={closeModal}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-semibold rounded-xl text-xs transition"
                  disabled={isCheckingOut}
                >
                  Cancel
                </button>
                <button
                  id="submit-checkout-btn"
                  type="submit"
                  className="py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-purple-500/10 transition flex items-center space-x-1"
                  disabled={isCheckingOut || availableAssets.length === 0}
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Issue Loan</span>
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
