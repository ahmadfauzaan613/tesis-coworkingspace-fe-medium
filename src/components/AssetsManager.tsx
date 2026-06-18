import React, { useState } from 'react';
import { useAssets, useStockHistory } from '../hooks/useAssets';
import { useCategories } from '../hooks/useCategories';
import { assetService } from '../services/assetService';
import { 
  Plus, 
  Search, 
  Download, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Loader2, 
  AlertCircle, 
  PackageCheck, 
  History, 
  MapPin, 
  Layers,
  Activity,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AssetsManager: React.FC = () => {
  // Navigation tabs within Assets section
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'history'>('catalog');

  // Filter States
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | string>('');
  const [status, setStatus] = useState('');
  const [lowStock, setLowStock] = useState<'true' | 'false'>('false');
  const [page, setPage] = useState(1);
  const [logPage, setLogPage] = useState(1);

  // Modal States
  const [isAssetOpen, setIsAssetOpen] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<number | null>(null);
  
  // Asset Form fields
  const [assetName, setAssetName] = useState('');
  const [assetSku, setAssetSku] = useState('');
  const [assetCategoryId, setAssetCategoryId] = useState<number | string>('');
  const [assetDescription, setAssetDescription] = useState('');
  const [initialStock, setInitialStock] = useState(0);
  const [assetLocation, setAssetLocation] = useState('');
  const [assetStatus, setAssetStatus] = useState('Available');
  const [assetFormError, setAssetFormError] = useState<string | null>(null);

  // Stock Adjustment Modal States
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustAssetId, setAdjustAssetId] = useState<number | null>(null);
  const [adjustAssetName, setAdjustAssetName] = useState('');
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<'ADDITION' | 'DEDUCTION' | 'DAMAGE' | 'AUDIT'>('ADDITION');
  const [adjustRemarks, setAdjustRemarks] = useState('');
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Use categories dropdown list
  const { categoriesData } = useCategories(1, 100);

  const filterParams = {
    page,
    limit: 10,
    search: search.trim() ? search : undefined,
    categoryId: categoryId || undefined,
    status: status || undefined,
    lowStock: lowStock === 'true' ? ('true' as const) : undefined
  };

  // Use custom assets hook
  const { 
    assetsData, 
    isLoading: assetsLoading, 
    error: assetsError,
    createAsset,
    isCreating,
    updateAsset,
    isUpdating,
    adjustStock,
    isAdjusting,
    deleteAsset
  } = useAssets(filterParams);

  // Use custom stock history hook
  const { data: logsData, isLoading: logsLoading } = useStockHistory(
    logPage, 
    10, 
    undefined
  );

  // Asset Save Submission Handler
  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim() || !assetCategoryId) {
      setAssetFormError('Name and Category are required.');
      toast.error('Name and Category are required.');
      return;
    }

    setAssetFormError(null);

    try {
      const payload = {
        categoryId: Number(assetCategoryId),
        name: assetName,
        sku: assetSku.trim() || undefined,
        description: assetDescription.trim() || undefined,
        location: assetLocation.trim() || undefined,
        status: assetStatus
      };

      if (editingAssetId) {
        await updateAsset({ id: editingAssetId, data: payload });
        toast.success('Asset details updated successfully');
      } else {
        await createAsset({
          ...payload,
          initialStock
        });
        toast.success('Asset registered successfully');
      }
      closeAssetModal();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'An error occurred while saving asset. Make sure SKU is unique.';
      setAssetFormError(errMsg);
      toast.error(errMsg);
    }
  };

  // Stock Adjustment Submission Handler
  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustQty === 0) {
      setAdjustError('Adjustment quantity cannot be zero.');
      toast.error('Adjustment quantity cannot be zero.');
      return;
    }
    if (!adjustAssetId) return;

    setAdjustError(null);

    try {
      await adjustStock({
        id: adjustAssetId,
        data: {
          changeQty: adjustQty,
          changeType: adjustType,
          remarks: adjustRemarks.trim() || undefined
        }
      });
      toast.success('Stock adjusted successfully');
      closeAdjustModal();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to adjust stock. Check if adjustment causes stock to go negative.';
      setAdjustError(errMsg);
      toast.error(errMsg);
    }
  };

  const handleDeleteAsset = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete "${name}" from catalog?`)) {
      try {
        await deleteAsset(id);
        toast.success('Asset deleted successfully');
      } catch (err: any) {
        const errMsg = err.response?.data?.message || 'Failed to delete asset.';
        toast.error(errMsg);
      }
    }
  };

  // CSV Export Trigger
  const handleExportCSV = async () => {
    try {
      const csv = await assetService.exportCSV();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cospace_inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV exported successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export inventory CSV file.');
    }
  };

  // Modal Control helpers
  const openCreateAssetModal = () => {
    setEditingAssetId(null);
    setAssetName('');
    setAssetSku('');
    setAssetCategoryId(categoriesData?.data[0]?.id || '');
    setAssetDescription('');
    setInitialStock(0);
    setAssetLocation('');
    setAssetStatus('Available');
    setAssetFormError(null);
    setIsAssetOpen(true);
  };

  const openEditAssetModal = (asset: any) => {
    setEditingAssetId(asset.id);
    setAssetName(asset.name);
    setAssetSku(asset.sku || '');
    setAssetCategoryId(asset.category_id);
    setAssetDescription(asset.description || '');
    setAssetLocation(asset.location || '');
    setAssetStatus(asset.status);
    setAssetFormError(null);
    setIsAssetOpen(true);
  };

  const closeAssetModal = () => {
    setIsAssetOpen(false);
    setEditingAssetId(null);
    setAssetName('');
    setAssetSku('');
    setAssetDescription('');
    setInitialStock(0);
    setAssetLocation('');
    setAssetFormError(null);
  };

  const openAdjustModal = (id: number, name: string) => {
    setAdjustAssetId(id);
    setAdjustAssetName(name);
    setAdjustQty(0);
    setAdjustType('ADDITION');
    setAdjustRemarks('');
    setAdjustError(null);
    setIsAdjustOpen(true);
  };

  const closeAdjustModal = () => {
    setIsAdjustOpen(false);
    setAdjustAssetId(null);
    setAdjustQty(0);
    setAdjustRemarks('');
    setAdjustError(null);
  };

  // Activity log helpers
  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'INITIAL': return 'bg-purple-955/50 text-purple-650 dark:text-purple-300 border-purple-200 dark:border-purple-900/60';
      case 'ADDITION': return 'bg-emerald-955/50 text-emerald-650 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60';
      case 'DEDUCTION': return 'bg-blue-955/50 text-blue-650 dark:text-blue-300 border-blue-200 dark:border-blue-900/60';
      case 'DAMAGE': return 'bg-rose-955/50 text-rose-650 dark:text-rose-300 border-rose-200 dark:border-rose-900/60';
      case 'AUDIT': return 'bg-amber-955/50 text-amber-650 dark:text-amber-300 border-amber-200 dark:border-amber-900/60';
      default: return 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800';
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <div id="assets-manager-page" className="space-y-6 animate-fadeIn">
      
      {/* Tab Switching Sub-Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-900 pb-3 flex-wrap gap-4">
        <div 
          id="assets-tab-navigation"
          className="flex space-x-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-900/60 shrink-0"
        >
          <button
            id="tab-btn-catalog"
            onClick={() => setActiveSubTab('catalog')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'catalog'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Equipment Catalog</span>
          </button>
          <button
            id="tab-btn-history"
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Inventory Activity Logs</span>
          </button>
        </div>

        {activeSubTab === 'catalog' && (
          <div className="flex items-center space-x-3">
            <button
              id="export-csv-btn"
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-2 py-2.5 px-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white rounded-xl text-xs shadow-sm transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              id="register-equipment-btn"
              onClick={openCreateAssetModal}
              className="inline-flex items-center space-x-2 py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-purple-500/10 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Equipment</span>
            </button>
          </div>
        )}
      </div>

      {activeSubTab === 'catalog' ? (
        <>
          {/* Filters Form panel */}
          <div 
            id="assets-filters-panel"
            className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900/80 p-5 rounded-3xl grid grid-cols-1 md:grid-cols-12 gap-4 items-end text-xs shadow-sm"
          >
            {/* Search */}
            <div className="md:col-span-4 space-y-1.5">
              <label htmlFor="search-input" className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Search Asset</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  id="search-input"
                  name="search"
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search by name, SKU..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="md:col-span-3 space-y-1.5">
              <label htmlFor="filter-category-select" className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Filter Category</label>
              <select
                id="filter-category-select"
                name="filterCategory"
                value={categoryId}
                onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-350 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition"
              >
                <option value="">All Categories</option>
                {categoriesData?.data.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="md:col-span-3 space-y-1.5">
              <label htmlFor="filter-status-select" className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Filter Status</label>
              <select
                id="filter-status-select"
                name="filterStatus"
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-350 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition"
              >
                <option value="">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Broken">Broken</option>
              </select>
            </div>

            {/* Low Stock Filter */}
            <div className="md:col-span-2 space-y-1.5">
              <label htmlFor="filter-low-stock-select" className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Stock Warning</label>
              <select
                id="filter-low-stock-select"
                name="filterLowStock"
                value={lowStock}
                onChange={(e) => { setLowStock(e.target.value as any); setPage(1); }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-350 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition font-medium"
              >
                <option value="false">Standard Catalog</option>
                <option value="true">⚠️ Low Stock Only</option>
              </select>
            </div>
          </div>

          {/* Asset List Grid/Table */}
          <div className="bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-900 rounded-3xl overflow-hidden shadow-sm">
            {assetsLoading ? (
              <div id="assets-loading-spinner" className="py-24 flex flex-col items-center justify-center text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-3" />
                <p className="text-xs">Loading equipments catalog...</p>
              </div>
            ) : assetsError || !assetsData ? (
              <div id="assets-error-container" className="py-20 text-center text-red-550 dark:text-red-400 text-xs">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                <p className="font-semibold">Failed to fetch equipments catalog</p>
                <p className="opacity-80">Check connection status & try again.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table id="assets-table" className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-900/10">
                        <th className="py-3 px-6">Asset Detail</th>
                        <th className="py-3 px-6">SKU / Code</th>
                        <th className="py-3 px-6">Category</th>
                        <th className="py-3 px-6">Location</th>
                        <th className="py-3 px-6 text-center w-24">Stock Level</th>
                        <th className="py-3 px-6 text-center">Status</th>
                        <th className="py-3 px-6 text-center w-40">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assetsData.data.length > 0 ? (
                        assetsData.data.map((asset) => (
                          <tr 
                            key={asset.id} 
                            id={`asset-row-${asset.id}`}
                            className="group border-b border-slate-150 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-900/20 transition"
                          >
                            <td className="py-4.5 px-6">
                              <div>
                                <p id={`asset-name-${asset.id}`} className="font-bold text-slate-800 dark:text-slate-200">{asset.name}</p>
                                <p id={`asset-desc-${asset.id}`} className="text-[10px] text-slate-500 font-light mt-0.5 max-w-xs truncate">{asset.description || 'No description provided'}</p>
                              </div>
                            </td>
                            <td id={`asset-sku-${asset.id}`} className="py-4.5 px-6 font-mono text-[11px] text-slate-500 dark:text-slate-400">{asset.sku || '—'}</td>
                            <td className="py-4.5 px-6">
                              <span id={`asset-cat-${asset.id}`} className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-lg text-[10px] border border-indigo-200 dark:border-indigo-900/40 font-medium">
                                {asset.category_name}
                              </span>
                            </td>
                            <td className="py-4.5 px-6 text-slate-500 dark:text-slate-400 font-light flex items-center space-x-1.5 pt-6">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span id={`asset-loc-${asset.id}`}>{asset.location || '—'}</span>
                            </td>
                            <td className="py-4.5 px-6 text-center">
                              <span 
                                id={`asset-stock-${asset.id}`}
                                className={`inline-block px-3 py-1 rounded-xl text-xs font-extrabold border ${
                                  asset.stock === 0 
                                    ? 'bg-red-50 dark:bg-red-950/50 text-red-650 dark:text-red-400 border-red-200 dark:border-red-900/50' 
                                    : asset.stock < 5 
                                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-650 dark:text-amber-400 border-amber-200 dark:border-amber-900/50' 
                                      : 'bg-emerald-55 dark:bg-emerald-950/50 text-emerald-650 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
                                }`}
                              >
                                {asset.stock}
                              </span>
                            </td>
                            <td className="py-4.5 px-6 text-center">
                              <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                asset.status === 'Available' 
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                  : asset.status === 'Maintenance' 
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  asset.status === 'Available' 
                                    ? 'bg-emerald-500 dark:bg-emerald-400' 
                                    : asset.status === 'Maintenance' 
                                      ? 'bg-amber-500 dark:bg-amber-400' 
                                      : 'bg-rose-500 dark:bg-rose-400'
                                }`} />
                                <span>{asset.status}</span>
                              </span>
                            </td>
                            <td className="py-4.5 px-6 text-center">
                              <div className="flex items-center justify-center space-x-2 lg:opacity-40 lg:group-hover:opacity-100 transition-opacity duration-150">
                                <button
                                  id={`adjust-stock-btn-${asset.id}`}
                                  onClick={() => openAdjustModal(asset.id, asset.name)}
                                  className="py-1 px-2.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-white rounded-lg transition text-[10px] font-bold"
                                  title="Adjust Stock Level"
                                >
                                  Stock Adjust
                                </button>
                                <button
                                   id={`edit-asset-btn-${asset.id}`}
                                   onClick={() => openEditAssetModal(asset)}
                                   className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-455 rounded-lg transition border border-slate-200 dark:border-slate-700"
                                   title="Edit details"
                                 >
                                   <Edit3 className="w-4 h-4" />
                                 </button>
                                 <button
                                   id={`delete-asset-btn-${asset.id}`}
                                   onClick={() => handleDeleteAsset(asset.id, asset.name)}
                                   className="p-1.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/30 text-slate-550 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-455 rounded-lg transition border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900/30"
                                   title="Delete item"
                                 >
                                   <Trash2 className="w-4 h-4" />
                                 </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-16 text-center text-slate-400 dark:text-slate-500 italic">
                            No equipment matching filters was found in catalog.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {assetsData.pagination && assetsData.pagination.totalPages > 1 && (
                  <div className="py-4 px-6 border-t border-slate-150 dark:border-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Showing page <b>{assetsData.pagination.currentPage}</b> of <b>{assetsData.pagination.totalPages}</b>
                    </span>
                    <div className="flex space-x-2">
                      <button
                        id="assets-page-prev"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        id="assets-page-next"
                        onClick={() => setPage(p => Math.min(assetsData.pagination.totalPages, p + 1))}
                        disabled={page === assetsData.pagination.totalPages}
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
        </>
      ) : (
        /* Global History Logs view */
        <div className="bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-900 rounded-3xl overflow-hidden shadow-sm">
          {logsLoading ? (
            <div id="logs-loading-spinner" className="py-24 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-3" />
              <p className="text-xs">Loading log sheets...</p>
            </div>
          ) : !logsData ? (
            <div id="logs-empty" className="py-16 text-center text-slate-500 text-xs">No activity logs recorded.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table id="history-logs-table" className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-900/10">
                      <th className="py-3 px-6">ID Log</th>
                      <th className="py-3 px-6">Equipment</th>
                      <th className="py-3 px-6">Change Type</th>
                      <th className="py-3 px-6 text-center w-24">Qty Altered</th>
                      <th className="py-3 px-6">Audit Details / Remarks</th>
                      <th className="py-3 px-6">Operator</th>
                      <th className="py-3 px-6 text-right">Date Recorded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logsData.data.length > 0 ? (
                      logsData.data.map((log) => (
                        <tr 
                          key={log.id} 
                          id={`history-row-${log.id}`}
                          className="border-b border-slate-150 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-900/20 transition"
                        >
                          <td className="py-3.5 px-6 font-mono text-slate-400 dark:text-slate-500">#{log.id}</td>
                          <td className="py-3.5 px-6 font-bold text-slate-800 dark:text-slate-200">
                            <div>
                              <p>{log.asset_name}</p>
                              <p className="text-[9px] text-slate-400 dark:text-slate-505 font-mono mt-0.5">{log.asset_sku || 'N/A'}</p>
                            </div>
                          </td>
                          <td className="py-3.5 px-6">
                            <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[9px] font-bold border ${getBadgeColor(log.change_type)}`}>
                              {log.change_type}
                            </span>
                          </td>
                          <td className={`py-3.5 px-6 text-center font-bold ${log.change_qty > 0 ? 'text-emerald-600 dark:text-emerald-400' : log.change_qty < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
                            {log.change_qty > 0 ? `+${log.change_qty}` : log.change_qty}
                          </td>
                          <td className="py-3.5 px-6 text-slate-500 dark:text-slate-400 font-light">{log.remarks || 'No details provided'}</td>
                          <td className="py-3.5 px-6 text-slate-700 dark:text-slate-300 flex items-center space-x-1 pt-5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{log.admin_username || 'System'}</span>
                          </td>
                          <td className="py-3.5 px-6 text-right text-slate-400 dark:text-slate-500 font-mono">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500 italic">No activity logs logged.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Logs Pagination */}
              {logsData.pagination && logsData.pagination.totalPages > 1 && (
                <div className="py-4 px-6 border-t border-slate-150 dark:border-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Showing page <b>{logsData.pagination.currentPage}</b> of <b>{logsData.pagination.totalPages}</b>
                  </span>
                  <div className="flex space-x-2">
                    <button
                      id="logs-page-prev"
                      onClick={() => setLogPage(p => Math.max(1, p - 1))}
                      disabled={logPage === 1}
                      className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      id="logs-page-next"
                      onClick={() => setLogPage(p => Math.min(logsData.pagination.totalPages, p + 1))}
                      disabled={logPage === logsData.pagination.totalPages}
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
      )}

      {/* Equipment catalog registration / edit dialog modal */}
      {isAssetOpen && (
        <div 
          id="asset-form-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
            
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
              <h3 id="asset-modal-title" className="font-bold text-base text-slate-800 dark:text-white">
                {editingAssetId ? 'Edit Equipment Details' : 'Register New Equipment'}
              </h3>
              <button 
                id="asset-modal-close-btn"
                onClick={closeAssetModal} 
                className="p-1 text-slate-400 hover:text-slate-655 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg transition"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form id="asset-form" onSubmit={handleAssetSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {assetFormError && (
                  <div 
                    id="asset-form-error"
                    className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-800 dark:text-red-200 text-xs flex items-start space-x-2"
                  >
                    <AlertCircle className="w-4.5 h-4.5 text-red-500 dark:text-red-400 shrink-0" />
                    <span>{assetFormError}</span>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1">
                  <label htmlFor="asset-name-input" className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Asset Name</label>
                  <input
                    id="asset-name-input"
                    name="name"
                    type="text"
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    placeholder="e.g. Epson Projector, Acer Monitor"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition text-xs"
                    required
                    disabled={isSaving}
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1">
                  <label htmlFor="asset-category-select" className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</label>
                  <select
                    id="asset-category-select"
                    name="categoryId"
                    value={assetCategoryId}
                    onChange={(e) => setAssetCategoryId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition text-xs"
                    required
                    disabled={isSaving}
                  >
                    <option value="" disabled>Select Category</option>
                    {categoriesData?.data.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* SKU Code */}
                <div className="space-y-1">
                  <label htmlFor="asset-sku-input" className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">SKU / Code ID</label>
                  <input
                    id="asset-sku-input"
                    name="sku"
                    type="text"
                    value={assetSku}
                    onChange={(e) => setAssetSku(e.target.value)}
                    placeholder="e.g. ELC-PRJ-005"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition text-xs font-mono"
                    disabled={isSaving}
                  />
                </div>

                {/* Location */}
                <div className="space-y-1">
                  <label htmlFor="asset-location-input" className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Storage / Room Location</label>
                  <input
                    id="asset-location-input"
                    name="location"
                    type="text"
                    value={assetLocation}
                    onChange={(e) => setAssetLocation(e.target.value)}
                    placeholder="e.g. Conference Room A, Storage 2"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition text-xs"
                    disabled={isSaving}
                  />
                </div>

                {/* Status Selection (only for Edit) */}
                {editingAssetId && (
                  <div className="space-y-1">
                    <label htmlFor="asset-status-select" className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Asset Status</label>
                    <select
                      id="asset-status-select"
                      name="status"
                      value={assetStatus}
                      onChange={(e) => setAssetStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition text-xs"
                      disabled={isSaving}
                    >
                      <option value="Available">Available</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Broken">Broken</option>
                    </select>
                  </div>
                )}

                {/* Initial Stock (Only for Create) */}
                {!editingAssetId && (
                  <div className="space-y-1">
                    <label htmlFor="asset-initial-stock-input" className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Initial Stock Level</label>
                    <input
                      id="asset-initial-stock-input"
                      name="initialStock"
                      type="number"
                      min="0"
                      value={initialStock}
                      onChange={(e) => setInitialStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition text-xs font-bold"
                      required
                      disabled={isSaving}
                    />
                    <p className="text-[9px] text-slate-500 font-light mt-0.5">Locks item creation transaction to prevent negative levels.</p>
                  </div>
                )}

                {/* Description */}
                <div className="space-y-1">
                  <label htmlFor="asset-desc-textarea" className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</label>
                  <textarea
                    id="asset-desc-textarea"
                    name="description"
                    value={assetDescription}
                    onChange={(e) => setAssetDescription(e.target.value)}
                    placeholder="Provide serial numbers, product specifications..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-450 dark:placeholder-slate-655 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition text-xs min-h-[80px] resize-none"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-end space-x-3">
                <button
                  id="asset-save-cancel-btn"
                  type="button"
                  onClick={closeAssetModal}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-705 dark:text-slate-350 font-semibold rounded-xl text-xs transition"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  id="asset-save-submit-btn"
                  type="submit"
                  className="py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-purple-500/10 transition flex items-center space-x-1"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <PackageCheck className="w-3.5 h-3.5" />
                      <span>{editingAssetId ? 'Update Detail' : 'Register Asset'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock adjustment dialog modal */}
      {isAdjustOpen && (
        <div 
          id="stock-adjust-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
            
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
              <h3 id="adjust-modal-title" className="font-bold text-base text-slate-800 dark:text-white">Manual Stock Audit</h3>
              <button 
                id="adjust-modal-close-btn"
                onClick={closeAdjustModal} 
                className="p-1 text-slate-400 hover:text-slate-655 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg transition"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form id="adjust-form" onSubmit={handleAdjustSubmit}>
              <div className="p-6 space-y-4">
                {adjustError && (
                  <div 
                    id="adjust-form-error"
                    className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-805 dark:text-red-200 text-xs flex items-start space-x-2 animate-shake"
                  >
                    <AlertCircle className="w-4.5 h-4.5 text-red-550 dark:text-red-400 shrink-0" />
                    <span>{adjustError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Target Equipment</label>
                  <p id="adjust-asset-name-label" className="font-bold text-slate-800 dark:text-slate-200 text-sm bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-850">{adjustAssetName}</p>
                </div>

                {/* Adjust Type */}
                <div className="space-y-1.5">
                  <label htmlFor="adjust-type-select" className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Adjustment Type</label>
                  <select
                    id="adjust-type-select"
                    name="changeType"
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition text-xs"
                    required
                    disabled={isAdjusting}
                  >
                    <option value="ADDITION">ADDITION (Purchased Stock, Restocking)</option>
                    <option value="DEDUCTION">DEDUCTION (Equipment checkout, usage reduction)</option>
                    <option value="DAMAGE">DAMAGE (Broken item reduction)</option>
                    <option value="AUDIT">AUDIT (General recount alignment)</option>
                  </select>
                </div>

                {/* Adjust Quantity */}
                <div className="space-y-1.5">
                  <label htmlFor="adjust-qty-input" className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Altered Quantity</label>
                  <input
                    id="adjust-qty-input"
                    name="changeQty"
                    type="number"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(parseInt(e.target.value, 10) || 0)}
                    placeholder="Enter positive value to add, negative to deduct"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition text-xs font-mono font-bold text-center"
                    required
                    disabled={isAdjusting}
                  />
                  <p className="text-[9px] text-slate-500 font-light mt-0.5">
                    💡 positive values (`+`) add stock. Negative values (`-`) reduce stock levels.
                  </p>
                </div>

                {/* Remarks Description */}
                <div className="space-y-1.5">
                  <label htmlFor="adjust-remarks-textarea" className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Audit Remarks / Log</label>
                  <textarea
                    id="adjust-remarks-textarea"
                    name="remarks"
                    value={adjustRemarks}
                    onChange={(e) => setAdjustRemarks(e.target.value)}
                    placeholder="Describe transaction context (e.g., monthly audit, purchased 10 units, AC unit damaged)"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-655 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition text-xs min-h-[85px] resize-none"
                    required
                    disabled={isAdjusting}
                  />
                </div>
              </div>

              {/* Adjust Actions */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-end space-x-3">
                <button
                  id="adjust-cancel-btn"
                  type="button"
                  onClick={closeAdjustModal}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-707 dark:text-slate-350 font-semibold rounded-xl text-xs transition"
                  disabled={isAdjusting}
                >
                  Cancel
                </button>
                <button
                  id="adjust-submit-btn"
                  type="submit"
                  className="py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-purple-500/10 transition flex items-center space-x-1"
                  disabled={isAdjusting}
                >
                  {isAdjusting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Adjusting...</span>
                    </>
                  ) : (
                    <>
                      <Activity className="w-3.5 h-3.5" />
                      <span>Execute Adjustment</span>
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
