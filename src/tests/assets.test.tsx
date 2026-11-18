import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssetsManager } from '../components/AssetsManager';
import { LOW_STOCK, assetStatus, changeType, signedQty, type AdjustType } from '../lib/ui';
import { makeAsset, makeCategory, makeHistory, paginate, pick, randInt, randWord } from './random';
import { renderWith } from './render';
import { asMock } from './mocks';

vi.mock('../services/assetService', async () => (await import('./mocks')).serviceMocks.asset());
vi.mock('../services/categoryService', async () => (await import('./mocks')).serviceMocks.category());
import { assetService } from '../services/assetService';
import { categoryService } from '../services/categoryService';

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

const makeList = () => Array.from({ length: randInt(2, 8) }, (_, i) => makeAsset(i + 1, { stock: i === 0 ? 0 : i === 1 ? randInt(1, 4) : randInt(0, 60) }));

const load = async ({ list = makeList(), route = '/assets' } = {}) => {
  const cats = Array.from({ length: randInt(1, 4) }, (_, i) => makeCategory(i + 1));
  asMock(categoryService.getAll).mockResolvedValue(paginate(cats));
  asMock(assetService.getAll).mockResolvedValue(paginate(list));
  asMock(assetService.getGlobalHistory).mockResolvedValue(paginate(Array.from({ length: randInt(0, 5) }, (_, i) => makeHistory(i + 1))));
  renderWith(<AssetsManager />, { route });
  await screen.findByRole('table');
  return { list, cats };
};

describe('Daftar aset', () => {
  it('kolom stok, kondisi, dan kategori sesuai data', async () => {
    const { list } = await load();
    for (const a of list) {
      const row = document.getElementById(`asset-row-${a.id}`)!;
      expect(document.getElementById(`asset-stock-${a.id}`)).toHaveTextContent(String(a.stock));
      expect(row).toHaveTextContent(assetStatus[a.status].label);
      expect(row).toHaveTextContent(a.category_name!);
      if (a.stock === 0) expect(row).toHaveTextContent('habis');
      else if (a.stock < LOW_STOCK) expect(row).toHaveTextContent('menipis');
    }
  });

  it('?lowStock=true dari dashboard langsung mencentang filter dan dikirim ke server', async () => {
    await load({ route: '/assets?lowStock=true' });
    expect(screen.getByLabelText(`Stok di bawah ${LOW_STOCK}`)).toBeChecked();
    expect(asMock(assetService.getAll).mock.calls[0][0]).toMatchObject({ lowStock: 'true' });
  });

  it('filter kategori dan kondisi dikirim ke server dan page kembali ke 1', async () => {
    const { cats } = await load();
    const cat = pick(cats);
    const status = pick(Object.keys(assetStatus));
    await userEvent.selectOptions(screen.getByLabelText('Kategori'), String(cat.id));
    await userEvent.selectOptions(screen.getByLabelText('Kondisi'), status);
    await waitFor(() =>
      expect(asMock(assetService.getAll).mock.calls.at(-1)![0]).toMatchObject({ categoryId: String(cat.id), status, page: 1 }),
    );
  });

  it('hasil filter kosong menawarkan tombol hapus filter yang benar-benar mereset', async () => {
    await load();
    asMock(assetService.getAll).mockResolvedValue(paginate([]));
    await userEvent.type(screen.getByLabelText('Cari'), randWord('tidakada'));
    await userEvent.click(await screen.findByRole('button', { name: 'Hapus semua filter' }));
    expect(screen.getByLabelText('Cari')).toHaveValue('');
    expect(asMock(assetService.getAll).mock.calls.at(-1)![0].search).toBeUndefined();
  });

  it('?tab=history membuka riwayat stok', async () => {
    asMock(categoryService.getAll).mockResolvedValue(paginate([]));
    asMock(assetService.getAll).mockResolvedValue(paginate([]));
    const logs = Array.from({ length: randInt(1, 5) }, (_, i) => makeHistory(i + 1));
    asMock(assetService.getGlobalHistory).mockResolvedValue(paginate(logs));
    renderWith(<AssetsManager />, { route: '/assets?tab=history' });
    expect(screen.getByRole('button', { name: 'Riwayat stok' })).toHaveAttribute('aria-pressed', 'true');
    const table = await screen.findByRole('table');
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(logs.length);
    logs.forEach((l, i) => expect(rows[i]).toHaveTextContent(changeType[l.change_type].label));
  });
});

describe('Ubah stok', () => {
  const openAdjust = async (asset: { id: number }) => {
    await userEvent.click(document.getElementById(`adjust-stock-btn-${asset.id}`)!);
    return screen.getByRole('dialog');
  };

  it('pratinjau stok setelah disimpan dihitung dari jenis dan jumlah', async () => {
    const { list } = await load();
    const asset = pick(list);
    const dlg = await openAdjust(asset);
    const type = pick<AdjustType>(['ADDITION', 'DEDUCTION', 'DAMAGE', 'AUDIT']);
    const qty = randInt(1, 30);
    await userEvent.selectOptions(within(dlg).getByLabelText('Jenis perubahan'), type);
    const input = within(dlg).getByLabelText('Jumlah');
    await userEvent.clear(input);
    await userEvent.type(input, String(qty));
    const expected = asset.stock + signedQty(type, qty);
    expect(within(dlg).getByText(/Stok sekarang/)).toHaveTextContent(`Stok sekarang ${asset.stock}, setelah disimpan ${expected}.`);
  });

  it('pengurangan melebihi stok ditolak sebelum dikirim', async () => {
    const { list } = await load();
    const asset = pick(list);
    const dlg = await openAdjust(asset);
    await userEvent.selectOptions(within(dlg).getByLabelText('Jenis perubahan'), 'DEDUCTION');
    const input = within(dlg).getByLabelText('Jumlah');
    await userEvent.clear(input);
    await userEvent.type(input, String(asset.stock + randInt(1, 10)));
    await userEvent.click(within(dlg).getByRole('button', { name: 'Simpan perubahan stok' }));
    expect(within(dlg).getByRole('alert')).toBeInTheDocument();
    expect(assetService.adjustStock).not.toHaveBeenCalled();
  });

  it('jumlah 0 ditolak sebelum dikirim', async () => {
    const { list } = await load();
    const dlg = await openAdjust(pick(list));
    await userEvent.click(within(dlg).getByRole('button', { name: 'Simpan perubahan stok' }));
    expect(within(dlg).getByRole('alert')).toBeInTheDocument();
    expect(assetService.adjustStock).not.toHaveBeenCalled();
  });

  it('penambahan dikirim dengan jumlah bertanda positif dan catatan', async () => {
    const { list } = await load();
    const asset = pick(list);
    asMock(assetService.adjustStock).mockResolvedValue({ message: 'ok' });
    const dlg = await openAdjust(asset);
    const qty = randInt(1, 30);
    const remarks = randWord('Catatan');
    const input = within(dlg).getByLabelText('Jumlah');
    await userEvent.clear(input);
    await userEvent.type(input, String(qty));
    await userEvent.type(within(dlg).getByLabelText(/Catatan/), remarks);
    await userEvent.click(within(dlg).getByRole('button', { name: 'Simpan perubahan stok' }));
    await waitFor(() =>
      expect(assetService.adjustStock).toHaveBeenCalledWith(asset.id, { changeQty: qty, changeType: 'ADDITION', remarks }),
    );
  });
});

describe('Daftarkan dan ubah aset', () => {
  it('nama kosong ditolak tanpa memanggil server', async () => {
    await load();
    await userEvent.click(screen.getByRole('button', { name: 'Daftarkan aset' }));
    const dlg = screen.getByRole('dialog');
    await userEvent.click(within(dlg).getByRole('button', { name: 'Daftarkan aset' }));
    expect(within(dlg).getByRole('alert')).toBeInTheDocument();
    expect(assetService.create).not.toHaveBeenCalled();
  });

  it('aset baru dikirim dengan nama yang dirapikan dan stok awal', async () => {
    const { cats } = await load();
    asMock(assetService.create).mockResolvedValue(makeAsset(99));
    await userEvent.click(screen.getByRole('button', { name: 'Daftarkan aset' }));
    const dlg = screen.getByRole('dialog');
    const [name, stock] = [randWord('Aset'), randInt(0, 99)];
    await userEvent.type(within(dlg).getByLabelText('Nama aset'), `  ${name} `);
    const stockInput = within(dlg).getByLabelText('Stok awal');
    await userEvent.clear(stockInput);
    await userEvent.type(stockInput, String(stock));
    await userEvent.click(within(dlg).getByRole('button', { name: 'Daftarkan aset' }));
    await waitFor(() =>
      expect(assetService.create).toHaveBeenCalledWith(expect.objectContaining({ name, initialStock: stock, categoryId: cats[0].id })),
    );
  });

  it('ubah: form terisi data aset yang dipilih', async () => {
    const { list } = await load();
    const asset = pick(list);
    await userEvent.click(screen.getByRole('button', { name: `Ubah data ${asset.name}` }));
    const dlg = screen.getByRole('dialog');
    expect(within(dlg).getByLabelText('Nama aset')).toHaveValue(asset.name);
    expect(within(dlg).getByLabelText('Kondisi')).toHaveValue(asset.status);
    expect(within(dlg).queryByLabelText('Stok awal')).toBeNull();
  });

  it('hapus memanggil server setelah konfirmasi', async () => {
    const { list } = await load();
    const asset = pick(list);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    asMock(assetService.delete).mockResolvedValue({ message: 'ok' });
    await userEvent.click(screen.getByRole('button', { name: `Hapus ${asset.name}` }));
    await waitFor(() => expect(assetService.delete).toHaveBeenCalledWith(asset.id));
  });
});
