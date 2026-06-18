import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import { 
  Package, 
  Layers, 
  AlertTriangle, 
  Wrench, 
  Clock, 
  User, 
  TrendingUp, 
  Activity, 
  PlusCircle, 
  MinusCircle,
  Loader2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';

export const DashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const { stats, isLoading, error, refetch } = useDashboard();

  // Dynamic Theme Styling variables for Recharts and styling classes
  const isDark = document.documentElement.classList.contains('dark');
  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const axisStroke = isDark ? '#94a3b8' : '#64748b';
  const tooltipContentStyle = {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderColor: isDark ? '#1e293b' : '#cbd5e1',
    borderRadius: '12px',
    color: isDark ? '#f8fafc' : '#0f172a',
    fontSize: '11px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
  };

  if (isLoading) {
    return (
      <div id="dashboard-loading-spinner" className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-3" />
        <p className="text-sm font-light">Loading inventory metrics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div id="dashboard-error-container" className="bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900/50 p-6 rounded-2xl text-center text-red-800 dark:text-red-200">
        <AlertTriangle className="w-8 h-8 text-red-550 dark:text-red-400 mx-auto mb-2" />
        <p className="font-semibold">Failed to fetch dashboard stats</p>
        <p className="text-xs text-red-550 dark:text-red-400 mt-1">Make sure backend database connections are online.</p>
        <button 
          id="retry-fetch-stats-btn"
          onClick={() => refetch()} 
          className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-800 dark:text-red-200 rounded-xl text-xs font-semibold transition cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Activity change type styling helpers
  const getActivityIcon = (type: string, qty: number) => {
    if (type === 'INITIAL' || type === 'ADDITION' || qty > 0) {
      return <PlusCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
    }
    if (type === 'DAMAGE' || type === 'DEDUCTION' || qty < 0) {
      return <MinusCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />;
    }
    return <Activity className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'INITIAL': return 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/60';
      case 'ADDITION': return 'bg-emerald-50 dark:bg-emerald-955/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60';
      case 'DEDUCTION': return 'bg-blue-50 dark:bg-blue-955/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60';
      case 'DAMAGE': return 'bg-rose-50 dark:bg-rose-955/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60';
      case 'AUDIT': return 'bg-amber-50 dark:bg-amber-955/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60';
      default: return 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-800';
    }
  };

  return (
    <div id="dashboard-overview-page" className="space-y-8 animate-fadeIn">
      
      {/* Metric Cards Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Assets */}
        <div id="stat-card-total-items" className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300 animate-slideIn shadow-sm">
          <div className="absolute top-0 right-0 p-3 bg-purple-500/5 rounded-bl-2xl text-purple-600 dark:text-purple-400">
            <Package className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Total Items</p>
          <h3 id="stat-val-total-items" className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{stats.totalAssets}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-505 mt-2">Registered in inventory database</p>
        </div>

        {/* Categories */}
        <div id="stat-card-categories" className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300 animate-slideIn shadow-sm">
          <div className="absolute top-0 right-0 p-3 bg-indigo-500/5 rounded-bl-2xl text-indigo-600 dark:text-indigo-400">
            <Layers className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Categories</p>
          <h3 id="stat-val-categories" className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{stats.totalCategories}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-505 mt-2">Classified item tags</p>
        </div>

        {/* Low Stock Warn */}
        <div 
          id="stat-card-low-stock"
          onClick={() => navigate('/assets')}
          className={`cursor-pointer p-6 rounded-2xl border relative overflow-hidden group transition-all duration-300 animate-slideIn shadow-sm ${
            stats.lowStockCount > 0 
              ? 'bg-amber-50/50 dark:bg-amber-950/25 border-amber-200 dark:border-amber-900/50 hover:border-amber-550/30' 
              : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/80 hover:border-slate-350 dark:hover:border-slate-700'
          }`}
        >
          <div className="absolute top-0 right-0 p-3 bg-amber-500/5 rounded-bl-2xl text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Low Stock</p>
          <h3 id="stat-val-low-stock" className={`text-3xl font-extrabold mt-2 ${stats.lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
            {stats.lowStockCount}
          </h3>
          <p className="text-xs text-slate-405 dark:text-slate-500 mt-2">
            {stats.lowStockCount > 0 ? 'Action required: Stock level < 5' : 'All stock levels healthy'}
          </p>
        </div>

        {/* Broken / Maintenance */}
        <div 
          id="stat-card-damaged"
          onClick={() => navigate('/maintenance')}
          className={`cursor-pointer p-6 rounded-2xl border relative overflow-hidden group transition-all duration-300 animate-slideIn shadow-sm ${
            stats.brokenAssets > 0 
              ? 'bg-rose-50/50 dark:bg-rose-955/25 border-rose-200 dark:border-rose-900/50 hover:border-rose-550/30' 
              : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/80 hover:border-slate-350 dark:hover:border-slate-700'
          }`}
        >
          <div className="absolute top-0 right-0 p-3 bg-rose-500/5 rounded-bl-2xl text-rose-600 dark:text-rose-400">
            <Wrench className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Damaged / Repair</p>
          <h3 id="stat-val-damaged" className={`text-3xl font-extrabold mt-2 ${stats.brokenAssets > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {stats.brokenAssets}
          </h3>
          <p className="text-xs text-slate-405 dark:text-slate-500 mt-2">
            {stats.brokenAssets > 0 ? 'Active ticket tickets logged' : 'No repairs reported'}
          </p>
        </div>

      </div>

      {/* Main Charts & Notifications Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recharts Chart Panel */}
        <div id="breakdown-chart-container" className="lg:col-span-8 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-900 p-6 rounded-3xl space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 id="breakdown-chart-title" className="font-extrabold text-lg text-slate-900 dark:text-white">Stock Level Breakdown</h3>
              <p id="breakdown-chart-desc" className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 font-light">Stock count and unique equipments classified by categories</p>
            </div>
            <TrendingUp className="w-5 h-5 text-indigo-550 dark:text-indigo-400" />
          </div>

          <div className="h-80 w-full text-slate-700 dark:text-slate-300 text-xs">
            {stats.categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.categoryBreakdown}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="category" stroke={axisStroke} />
                  <YAxis stroke={axisStroke} />
                  <Tooltip contentStyle={tooltipContentStyle} />
                  <Legend />
                  <Bar dataKey="totalStock" name="Total Stock" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="uniqueItems" name="Unique Items" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-505 italic">
                No inventory breakdown data available. Add categories and assets to see charts.
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts Panel */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-900 p-6 rounded-3xl space-y-6 flex flex-col shadow-sm">
          <div>
            <h3 id="warnings-panel-title" className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center">
              <AlertTriangle className="w-5 h-5 text-amber-500 mr-2 shrink-0" />
              Low Stock Warnings
            </h3>
            <p className="text-slate-550 dark:text-slate-400 text-xs mt-0.5 font-light">Equipments with critical quantities less than 5</p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {stats.lowStockAlerts.length > 0 ? (
              stats.lowStockAlerts.map((asset) => (
                <div 
                  key={asset.id} 
                  id={`warning-row-${asset.id}`}
                  className="p-3 bg-amber-50 dark:bg-amber-955/15 border border-amber-200 dark:border-amber-900/30 rounded-xl flex items-center justify-between space-x-2 text-xs animate-slideIn"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{asset.name}</p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">SKU: {asset.sku || 'N/A'} • {asset.location || 'No Location'}</p>
                  </div>
                  <div className="shrink-0 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-lg font-bold border border-amber-200 dark:border-amber-500/20">
                    {asset.stock} left
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500 italic">
                <Package className="w-8 h-8 text-slate-300 dark:text-slate-800 mb-2" />
                <span>All stocks are above minimum threshold.</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Activity Log Trail Panel */}
      <div className="bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-900 p-6 rounded-3xl space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 id="activities-panel-title" className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center">
              <Clock className="w-5 h-5 text-purple-650 dark:text-purple-400 mr-2 shrink-0" />
              Recent Inventory Audit Actions
            </h3>
            <p className="text-slate-550 dark:text-slate-400 text-xs mt-0.5 font-light">Latest stock history logs, addition/deductions, and audits</p>
          </div>
          <button 
            id="view-history-btn"
            onClick={() => navigate('/assets')}
            className="text-xs text-purple-650 hover:text-purple-755 dark:text-purple-400 dark:hover:text-purple-300 font-semibold transition cursor-pointer"
          >
            View History Logs
          </button>
        </div>

        <div className="overflow-x-auto">
          <table id="activities-table" className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-250 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-900/10">
                <th className="py-3 px-4">Equipment</th>
                <th className="py-3 px-4">Change Type</th>
                <th className="py-3 px-4 text-center">Quantity</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4">Authorized By</th>
                <th className="py-3 px-4 text-right">Date Time</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentActivities.length > 0 ? (
                stats.recentActivities.map((act) => (
                  <tr 
                    key={act.id} 
                    id={`activity-row-${act.id}`}
                    className="border-b border-slate-150 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-all"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{act.asset_name}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getBadgeColor(act.change_type)}`}>
                        {getActivityIcon(act.change_type, act.change_qty)}
                        <span>{act.change_type}</span>
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 text-center font-bold text-sm ${act.change_qty > 0 ? 'text-emerald-600 dark:text-emerald-400' : act.change_qty < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
                      {act.change_qty > 0 ? `+${act.change_qty}` : act.change_qty}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-light">{act.remarks || 'No remarks provided'}</td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 pt-4">
                      <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-550" />
                      <span>{act.admin_username || 'System'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-450 dark:text-slate-500 font-mono">
                      {new Date(act.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-450 dark:text-slate-500 italic">
                    No recent activities recorded. Make stock adjustments to see logs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );};
