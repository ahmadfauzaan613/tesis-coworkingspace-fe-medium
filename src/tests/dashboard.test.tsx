import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardOverview } from '../components/DashboardOverview';
import { changeType, formatQty } from '../lib/ui';
import { makeStats, randWord } from './random';
import { renderWith } from './render';
import { asMock } from './mocks';

vi.mock('../services/dashboardService', async () => (await import('./mocks')).serviceMocks.dashboard());
import { dashboardService } from '../services/dashboardService';

beforeEach(() => vi.clearAllMocks());

const load = async (stats = makeStats()) => {
  asMock(dashboardService.getStats).mockResolvedValue(stats);
  renderWith(<DashboardOverview />);
  await screen.findByRole('heading', { name: 'Perlu restock' });
  return stats;
};

describe('Ringkasan', () => {
  it('menampilkan status memuat sebelum data datang', () => {
    asMock(dashboardService.getStats).mockReturnValue(new Promise(() => {}));
    renderWith(<DashboardOverview />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('angka ringkasan sama dengan data dari server', async () => {
    const s = await load();
    expect(document.getElementById('stat-val-total-items')).toHaveTextContent(String(s.totalAssets));
    expect(document.getElementById('stat-val-categories')).toHaveTextContent(String(s.totalCategories));
    expect(document.getElementById('stat-val-low-stock')).toHaveTextContent(String(s.lowStockAlerts.length));
    expect(document.getElementById('stat-val-damaged')).toHaveTextContent(String(s.brokenAssets));
    expect(screen.getByText(`${s.outOfStock} di antaranya habis`)).toBeInTheDocument();
  });

  it('daftar restock: satu baris per aset, label Habis atau Sisa n', async () => {
    const s = await load();
    for (const a of s.lowStockAlerts) {
      const row = document.getElementById(`warning-row-${a.id}`)!;
      expect(row).toHaveTextContent(a.name);
      expect(row).toHaveTextContent(a.stock === 0 ? 'Habis' : `Sisa ${a.stock}`);
    }
    if (s.lowStockAlerts.length) {
      expect(screen.getByRole('link', { name: /Tambah stok dari daftar aset/ })).toHaveAttribute('href', '/assets?lowStock=true');
    }
  });

  it('tanpa aset menipis tampil pesan kosong yang menjelaskan', async () => {
    await load({ ...makeStats(), lowStockAlerts: [] });
    expect(screen.getByText(/Tidak ada yang perlu dibeli sekarang/)).toBeInTheDocument();
  });

  it('tabel perubahan stok: jumlah baris, label jenis, dan tanda jumlah', async () => {
    const s = await load();
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row').slice(1);
    if (s.recentActivities.length === 0) {
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveTextContent('Belum ada perubahan stok');
      return;
    }
    expect(rows).toHaveLength(s.recentActivities.length);
    s.recentActivities.forEach((a, i) => {
      expect(rows[i]).toHaveTextContent(a.asset_name);
      expect(rows[i]).toHaveTextContent(changeType[a.change_type].label);
      expect(rows[i]).toHaveTextContent(formatQty(a.change_qty));
      expect(rows[i]).toHaveTextContent(a.admin_username ?? 'Sistem');
    });
  });

  it('link riwayat dan tiket perawatan mengarah ke halaman yang ada', async () => {
    await load();
    expect(screen.getByRole('link', { name: /Lihat semua riwayat/ })).toHaveAttribute('href', '/assets?tab=history');
    expect(screen.getByRole('link', { name: 'Lihat tiket perawatan' })).toHaveAttribute('href', '/maintenance');
  });

  it('grafik tanpa kategori menampilkan ajakan mendaftarkan aset', async () => {
    await load({ ...makeStats(), categoryBreakdown: [] });
    expect(screen.getByRole('link', { name: 'Daftarkan aset pertama' })).toHaveAttribute('href', '/assets');
  });

  it('gagal dimuat: tampil alert dan tombol muat ulang meminta data lagi', async () => {
    asMock(dashboardService.getStats).mockRejectedValue(new Error(randWord('gagal')));
    renderWith(<DashboardOverview />);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    const calls = asMock(dashboardService.getStats).mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: 'Muat ulang' }));
    await waitFor(() => expect(asMock(dashboardService.getStats).mock.calls.length).toBeGreaterThan(calls));
  });
});
