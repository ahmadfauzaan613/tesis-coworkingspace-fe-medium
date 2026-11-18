import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssignmentsManager } from '../components/AssignmentsManager';
import { MaintenanceManager } from '../components/MaintenanceManager';
import { formatIDR, loanStatus, ticketStatus } from '../lib/ui';
import { makeAsset, makeLoan, makeTicket, paginate, pick, randInt, randWord } from './random';
import { renderWith } from './render';
import { asMock } from './mocks';

vi.mock('../services/assetService', async () => (await import('./mocks')).serviceMocks.asset());
vi.mock('../services/assignmentService', async () => (await import('./mocks')).serviceMocks.assignment());
vi.mock('../services/maintenanceService', async () => (await import('./mocks')).serviceMocks.maintenance());
import { assetService } from '../services/assetService';
import { assignmentService } from '../services/assignmentService';
import { maintenanceService } from '../services/maintenanceService';

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

const catalog = () => {
  const list = Array.from({ length: randInt(3, 8) }, (_, i) => makeAsset(i + 1));
  list[0] = { ...list[0], status: 'Available', stock: randInt(1, 30) };
  return list;
};

describe('Peminjaman', () => {
  const load = async ({ assets = catalog(), loans = Array.from({ length: randInt(1, 6) }, (_, i) => makeLoan(i + 1)) } = {}) => {
    asMock(assetService.getAll).mockResolvedValue(paginate(assets));
    asMock(assignmentService.getAll).mockResolvedValue(paginate(loans));
    const { client } = renderWith(<AssignmentsManager />);
    await screen.findByRole('table');
    // Alur normal: daftar aset untuk pilihan sudah selesai dimuat sebelum dialog dibuka.
    await waitFor(() => expect(client.getQueryData(['assets', { limit: 100 }])).toBeDefined());
    return { assets, loans };
  };
  const lendable = (assets: ReturnType<typeof catalog>) => assets.filter((a) => a.stock > 0 && a.status === 'Available');

  it('status pinjaman ditampilkan dan tombol kembali hanya untuk yang masih dipinjam', async () => {
    const { loans } = await load();
    for (const l of loans) {
      expect(document.getElementById(`loan-status-${l.id}`)).toHaveTextContent(loanStatus[l.status].label);
      expect(!!document.getElementById(`return-asset-btn-${l.id}`)).toBe(l.status === 'ACTIVE');
    }
  });

  it('pilihan aset hanya berisi aset Tersedia dengan stok di atas 0', async () => {
    const { assets } = await load();
    await waitFor(() => expect(assetService.getAll).toHaveBeenCalled());
    await userEvent.click(screen.getByRole('button', { name: 'Catat peminjaman' }));
    const options = within(screen.getByLabelText('Aset')).getAllByRole('option');
    expect(options.map((o) => Number((o as HTMLOptionElement).value))).toEqual(lendable(assets).map((a) => a.id));
  });

  it('jumlah melebihi stok ditolak sebelum dikirim', async () => {
    const { assets } = await load();
    await userEvent.click(screen.getByRole('button', { name: 'Catat peminjaman' }));
    const dlg = screen.getByRole('dialog');
    const asset = lendable(assets)[0];
    await userEvent.type(within(dlg).getByLabelText('Dipinjam oleh'), randWord('P'));
    const qty = within(dlg).getByLabelText('Jumlah');
    await userEvent.clear(qty);
    await userEvent.type(qty, String(asset.stock + randInt(1, 10)));
    await userEvent.click(within(dlg).getByRole('button', { name: 'Catat peminjaman' }));
    expect(within(dlg).getByRole('alert')).toHaveTextContent(String(asset.stock));
    expect(assignmentService.create).not.toHaveBeenCalled();
  });

  it('peminjaman valid dikirim dengan nama peminjam yang dirapikan', async () => {
    const { assets } = await load();
    asMock(assignmentService.create).mockResolvedValue(makeLoan(99));
    await userEvent.click(screen.getByRole('button', { name: 'Catat peminjaman' }));
    const dlg = screen.getByRole('dialog');
    const asset = lendable(assets)[0];
    const who = randWord('Peminjam');
    const quantity = randInt(1, asset.stock);
    await userEvent.type(within(dlg).getByLabelText('Dipinjam oleh'), ` ${who}  `);
    const qty = within(dlg).getByLabelText('Jumlah');
    await userEvent.clear(qty);
    await userEvent.type(qty, String(quantity));
    await userEvent.click(within(dlg).getByRole('button', { name: 'Catat peminjaman' }));
    await waitFor(() => expect(assignmentService.create).toHaveBeenCalledWith({ assetId: asset.id, assignedTo: who, quantity }));
  });

  it('dialog dibuka sebelum daftar aset selesai dimuat: aset yang tampil terpilih juga yang dikirim', async () => {
    const assets = catalog();
    let resolveAssets: (v: unknown) => void = () => {};
    asMock(assetService.getAll).mockReturnValue(new Promise((r) => (resolveAssets = r)));
    asMock(assignmentService.getAll).mockResolvedValue(paginate([]));
    asMock(assignmentService.create).mockResolvedValue(makeLoan(99));
    renderWith(<AssignmentsManager />);
    await screen.findByRole('table');
    await userEvent.click(screen.getByRole('button', { name: 'Catat peminjaman' }));
    resolveAssets(paginate(assets));
    const dlg = screen.getByRole('dialog');
    const select = (await within(dlg).findByLabelText('Aset')) as HTMLSelectElement;
    const shown = Number(select.value || select.options[0].value);
    await userEvent.type(within(dlg).getByLabelText('Dipinjam oleh'), randWord('P'));
    await userEvent.click(within(dlg).getByRole('button', { name: 'Catat peminjaman' }));
    await waitFor(() => expect(assignmentService.create).toHaveBeenCalledWith(expect.objectContaining({ assetId: shown })));
  });

  it('tanpa aset yang bisa dipinjam: penjelasan, link ke daftar aset, dan tombol simpan nonaktif', async () => {
    await load({ assets: catalog().map((a) => ({ ...a, stock: 0 })) });
    await userEvent.click(screen.getByRole('button', { name: 'Catat peminjaman' }));
    const dlg = screen.getByRole('dialog');
    expect(within(dlg).getByRole('link', { name: 'Buka daftar aset' })).toHaveAttribute('href', '/assets');
    expect(within(dlg).getByRole('button', { name: 'Catat peminjaman' })).toBeDisabled();
  });

  it('tandai kembali memanggil server setelah konfirmasi', async () => {
    const loan = makeLoan(randInt(1, 50), { status: 'ACTIVE', returned_at: null });
    await load({ loans: [loan] });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    asMock(assignmentService.returnAsset).mockResolvedValue({ message: 'ok' });
    await userEvent.click(screen.getByRole('button', { name: 'Tandai kembali' }));
    await waitFor(() => expect(assignmentService.returnAsset).toHaveBeenCalledWith(loan.id));
  });
});

describe('Perawatan', () => {
  const load = async (tickets = Array.from({ length: randInt(1, 6) }, (_, i) => makeTicket(i + 1))) => {
    asMock(assetService.getAll).mockResolvedValue(paginate(catalog()));
    asMock(maintenanceService.getAll).mockResolvedValue(paginate(tickets));
    renderWith(<MaintenanceManager />);
    await screen.findByRole('table');
    return tickets;
  };

  it('status, biaya (format Rupiah), dan tombol selesai sesuai data', async () => {
    const tickets = await load();
    for (const t of tickets) {
      expect(document.getElementById(`ticket-status-${t.id}`)).toHaveTextContent(ticketStatus[t.status].label);
      if (t.status === 'RESOLVED') {
        expect(document.getElementById(`ticket-cost-${t.id}`)!.textContent).toBe(formatIDR(t.repair_cost));
      }
      expect(!!document.getElementById(`resolve-ticket-btn-${t.id}`)).toBe(t.status === 'PENDING');
    }
  });

  it('filter status: tombol aktif ditandai aria-pressed dan status dikirim ke server', async () => {
    await load();
    const [label, value] = pick([
      ['Menunggu', 'PENDING'],
      ['Selesai', 'RESOLVED'],
    ] as const);
    await userEvent.click(screen.getByRole('button', { name: label }));
    expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Semua' })).toHaveAttribute('aria-pressed', 'false');
    await waitFor(() => expect(asMock(maintenanceService.getAll).mock.calls.at(-1)![0]).toBe(value));
  });

  it('laporan tanpa deskripsi ditolak sebelum dikirim', async () => {
    await load();
    await waitFor(() => expect(assetService.getAll).toHaveBeenCalled());
    await userEvent.click(screen.getByRole('button', { name: 'Laporkan kerusakan' }));
    const dlg = screen.getByRole('dialog');
    await userEvent.click(within(dlg).getByRole('button', { name: 'Simpan laporan' }));
    expect(within(dlg).getByRole('alert')).toBeInTheDocument();
    expect(maintenanceService.create).not.toHaveBeenCalled();
  });

  it('menyelesaikan tiket mengirim biaya, vendor, dan pilihan pemulihan status', async () => {
    const t = makeTicket(randInt(1, 50), { status: 'PENDING' });
    await load([t]);
    asMock(maintenanceService.resolveTicket).mockResolvedValue({ message: 'ok' });
    await userEvent.click(screen.getByRole('button', { name: 'Tandai selesai' }));
    const dlg = screen.getByRole('dialog');
    const [cost, vendor] = [randInt(0, 5_000_000), randWord('Vendor')];
    const costInput = within(dlg).getByLabelText('Biaya perbaikan (Rp)');
    await userEvent.clear(costInput);
    await userEvent.type(costInput, String(cost));
    await userEvent.type(within(dlg).getByLabelText(/Vendor/), vendor);
    const restore = pick([true, false]);
    if (!restore) await userEvent.click(within(dlg).getByLabelText('Kembalikan status aset menjadi Tersedia'));
    await userEvent.click(within(dlg).getByRole('button', { name: 'Tandai selesai' }));
    await waitFor(() =>
      expect(maintenanceService.resolveTicket).toHaveBeenCalledWith(t.id, { repairCost: cost, vendorName: vendor, restoreAssetStatus: restore }),
    );
  });
});
