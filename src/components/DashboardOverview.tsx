import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useDashboard } from '../hooks/useDashboard';
import { Badge, ErrorState, LoadingState, PageHeader } from './kit';
import { LOW_STOCK, changeType, formatDate, formatQty, tableCls, tdCls, thCls } from '../lib/ui';

const textLink =
  'inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary hover:underline';

export const DashboardOverview: React.FC = () => {
  const { stats, isLoading, error, refetch } = useDashboard();

  const header = (
    <PageHeader
      title="Ringkasan"
      description="Aset yang perlu ditangani lebih dulu, lalu gambaran stok dan perubahan terakhir."
    />
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        {header}
        <LoadingState id="dashboard-loading-spinner">Memuat ringkasan inventaris...</LoadingState>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-8">
        {header}
        <ErrorState id="dashboard-error-container" title="Ringkasan gagal dimuat" onRetry={() => refetch()} />
      </div>
    );
  }

  const needsRestock = stats.lowStockAlerts.length;

  return (
    <div id="dashboard-overview-page" className="space-y-10">
      {header}

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4">
        <div id="stat-card-total-items" className="bg-card p-4 sm:p-5">
          <dt className="text-sm text-muted-foreground">Jenis aset terdaftar</dt>
          <dd id="stat-val-total-items" className="mt-1 text-3xl font-extrabold tabular-nums">
            {stats.totalAssets}
          </dd>
        </div>
        <div id="stat-card-categories" className="bg-card p-4 sm:p-5">
          <dt className="text-sm text-muted-foreground">Kategori</dt>
          <dd id="stat-val-categories" className="mt-1 text-3xl font-extrabold tabular-nums">
            {stats.totalCategories}
          </dd>
        </div>
        <div id="stat-card-low-stock" className="bg-card p-4 sm:p-5">
          <dt className="text-sm text-muted-foreground">Stok di bawah {LOW_STOCK}</dt>
          <dd id="stat-val-low-stock" className={`mt-1 text-3xl font-extrabold tabular-nums ${needsRestock ? 'text-warning' : ''}`}>
            {needsRestock}
          </dd>
          <dd className="mt-1 text-xs text-muted-foreground">{stats.outOfStock} di antaranya habis</dd>
        </div>
        <div id="stat-card-damaged" className="bg-card p-4 sm:p-5">
          <dt className="text-sm text-muted-foreground">Rusak atau dalam perawatan</dt>
          <dd id="stat-val-damaged" className={`mt-1 text-3xl font-extrabold tabular-nums ${stats.brokenAssets ? 'text-destructive' : ''}`}>
            {stats.brokenAssets}
          </dd>
          <dd>
            <Link to="/maintenance" className="-mb-3 inline-flex min-h-11 items-center text-xs font-semibold text-primary hover:underline">
              Lihat tiket perawatan
            </Link>
          </dd>
        </div>
      </dl>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <section aria-labelledby="warnings-panel-title" className="rounded-xl border border-border">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-border px-5 py-4">
            <h2 id="warnings-panel-title" className="text-lg font-bold">
              Perlu restock
            </h2>
            <p className="text-sm text-muted-foreground">Aset dengan stok di bawah {LOW_STOCK} unit</p>
          </div>

          {needsRestock > 0 ? (
            <>
              <ul className="max-h-96 divide-y divide-border overflow-y-auto">
                {stats.lowStockAlerts.map((asset) => (
                  <li key={asset.id} id={`warning-row-${asset.id}`} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{asset.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[asset.sku, asset.category_name, asset.location].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <Badge tone={asset.stock === 0 ? 'danger' : 'warning'}>
                      {asset.stock === 0 ? 'Habis' : `Sisa ${asset.stock}`}
                    </Badge>
                  </li>
                ))}
              </ul>
              <div className="border-t border-border px-5">
                <Link to="/assets?lowStock=true" className={textLink}>
                  Tambah stok dari daftar aset
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </>
          ) : (
            <p className="px-5 py-10 text-sm text-muted-foreground">
              Semua aset punya stok {LOW_STOCK} unit atau lebih. Tidak ada yang perlu dibeli sekarang.
            </p>
          )}
        </section>

        <section aria-labelledby="breakdown-chart-title" id="breakdown-chart-container" className="rounded-xl border border-border p-5">
          <h2 id="breakdown-chart-title" className="text-lg font-bold">
            Total unit per kategori
          </h2>
          <p id="breakdown-chart-desc" className="mt-1 text-sm text-muted-foreground">
            Jumlah semua unit aset di tiap kategori, untuk melihat kategori mana yang paling banyak disimpan.
          </p>

          <div className="mt-4 h-72 text-xs">
            {stats.categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.categoryBreakdown} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="category" stroke="var(--muted-foreground)" tickLine={false} />
                  <YAxis stroke="var(--muted-foreground)" tickLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)' }}
                    contentStyle={{
                      background: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--popover-foreground)',
                    }}
                  />
                  <Bar dataKey="totalStock" name="Total unit" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={56} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-sm text-muted-foreground">
                <p>Belum ada aset yang terdaftar.</p>
                <Link to="/assets" className={textLink}>
                  Daftarkan aset pertama
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>

      <section aria-labelledby="activities-panel-title" className="rounded-xl border border-border">
        <div className="flex flex-wrap items-center justify-between gap-x-4 border-b border-border px-5 py-2">
          <h2 id="activities-panel-title" className="py-2 text-lg font-bold">
            Perubahan stok terbaru
          </h2>
          <Link id="view-history-btn" to="/assets?tab=history" className={textLink}>
            Lihat semua riwayat
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table id="activities-table" className={tableCls}>
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
              {stats.recentActivities.length > 0 ? (
                stats.recentActivities.map((act) => {
                  const t = changeType[act.change_type] ?? { label: act.change_type, tone: 'neutral' as const };
                  return (
                    <tr key={act.id} id={`activity-row-${act.id}`}>
                      <td className={`${tdCls} font-semibold`}>{act.asset_name}</td>
                      <td className={tdCls}>
                        <Badge tone={t.tone}>{t.label}</Badge>
                      </td>
                      <td
                        className={`${tdCls} text-right font-bold tabular-nums ${
                          act.change_qty > 0 ? 'text-success' : act.change_qty < 0 ? 'text-destructive' : ''
                        }`}
                      >
                        {formatQty(act.change_qty)}
                      </td>
                      <td className={`${tdCls} text-muted-foreground`}>{act.remarks || '-'}</td>
                      <td className={tdCls}>{act.admin_username || 'Sistem'}</td>
                      <td className={`${tdCls} whitespace-nowrap text-right text-muted-foreground`}>{formatDate(act.created_at)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    Belum ada perubahan stok. Riwayat muncul setelah kamu menambah aset atau menyesuaikan stok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
