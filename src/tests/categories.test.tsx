import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoriesManager } from '../components/CategoriesManager';
import { makeCategory, paginate, pick, randInt, randWord } from './random';
import { renderWith } from './render';
import { asMock } from './mocks';

vi.mock('../services/categoryService', async () => (await import('./mocks')).serviceMocks.category());
import { categoryService } from '../services/categoryService';

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

const load = async (list = Array.from({ length: randInt(1, 8) }, (_, i) => makeCategory(i + 1))) => {
  asMock(categoryService.getAll).mockResolvedValue(paginate(list));
  renderWith(<CategoriesManager />);
  await screen.findByRole('table');
  return list;
};

const openCreate = () => userEvent.click(screen.getByRole('button', { name: 'Tambah kategori' }));
const dialog = () => screen.getByRole('dialog');

describe('Kategori', () => {
  it('satu baris per kategori, keterangan kosong ditulis "-"', async () => {
    const list = await load();
    for (const c of list) {
      expect(document.getElementById(`category-name-${c.id}`)).toHaveTextContent(c.name);
      expect(document.getElementById(`category-desc-${c.id}`)).toHaveTextContent(c.description ?? '-');
    }
  });

  it('tombol ubah dan hapus punya nama yang menyebut kategorinya', async () => {
    const c = pick(await load());
    expect(screen.getByRole('button', { name: `Ubah kategori ${c.name}` })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `Hapus kategori ${c.name}` })).toBeInTheDocument();
  });

  it('daftar kosong menampilkan langkah berikutnya', async () => {
    await load([]);
    expect(screen.getByText(/Belum ada kategori/)).toBeInTheDocument();
  });

  it('nama kosong ditolak tanpa memanggil server', async () => {
    await load();
    await openCreate();
    await userEvent.click(within(dialog()).getByRole('button', { name: 'Tambah kategori' }));
    expect(within(dialog()).getByRole('alert')).toBeInTheDocument();
    expect(categoryService.create).not.toHaveBeenCalled();
  });

  it('kategori baru dikirim dengan nama dan keterangan yang diketik', async () => {
    await load();
    const [name, desc] = [randWord('Kategori'), randWord('Ket')];
    asMock(categoryService.create).mockResolvedValue(makeCategory(99));
    await openCreate();
    await userEvent.type(screen.getByLabelText('Nama kategori'), name);
    await userEvent.type(screen.getByLabelText(/Keterangan/), desc);
    await userEvent.click(within(dialog()).getByRole('button', { name: 'Tambah kategori' }));
    await waitFor(() => expect(categoryService.create).toHaveBeenCalledWith({ name, description: desc }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('spasi di awal dan akhir nama dibuang sebelum dikirim', async () => {
    await load();
    const name = randWord('Kategori');
    asMock(categoryService.create).mockResolvedValue(makeCategory(99));
    await openCreate();
    await userEvent.type(screen.getByLabelText('Nama kategori'), `  ${name}  `);
    await userEvent.click(within(dialog()).getByRole('button', { name: 'Tambah kategori' }));
    await waitFor(() => expect(categoryService.create).toHaveBeenCalled());
    expect(asMock(categoryService.create).mock.calls[0][0].name).toBe(name);
  });

  it('ubah: form terisi data lama dan update dikirim ke id yang benar', async () => {
    const c = pick(await load());
    asMock(categoryService.update).mockResolvedValue(c);
    await userEvent.click(screen.getByRole('button', { name: `Ubah kategori ${c.name}` }));
    const input = screen.getByLabelText('Nama kategori');
    expect(input).toHaveValue(c.name);
    const name = randWord('Baru');
    await userEvent.clear(input);
    await userEvent.type(input, name);
    await userEvent.click(within(dialog()).getByRole('button', { name: 'Simpan perubahan' }));
    await waitFor(() => expect(categoryService.update).toHaveBeenCalledWith(c.id, { name, description: c.description ?? '' }));
  });

  it('error dari server ditampilkan di form', async () => {
    await load();
    const msg = randWord('Duplikat');
    asMock(categoryService.create).mockRejectedValue({ response: { data: { message: msg } } });
    await openCreate();
    await userEvent.type(screen.getByLabelText('Nama kategori'), randWord('K'));
    await userEvent.click(within(dialog()).getByRole('button', { name: 'Tambah kategori' }));
    expect(await within(dialog()).findByRole('alert')).toHaveTextContent(msg);
  });

  it('hapus hanya jalan setelah dikonfirmasi', async () => {
    const c = pick(await load());
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    asMock(categoryService.delete).mockResolvedValue({ message: 'ok' });
    const btn = screen.getByRole('button', { name: `Hapus kategori ${c.name}` });
    await userEvent.click(btn);
    expect(categoryService.delete).not.toHaveBeenCalled();
    await userEvent.click(btn);
    await waitFor(() => expect(categoryService.delete).toHaveBeenCalledWith(c.id));
    expect(confirm.mock.calls[0][0]).toContain(c.name);
  });

  it('hapus gagal: pesan backend tampil di halaman', async () => {
    const c = pick(await load());
    const msg = randWord('Dipakai');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    asMock(categoryService.delete).mockRejectedValue({ response: { data: { message: msg } } });
    await userEvent.click(screen.getByRole('button', { name: `Hapus kategori ${c.name}` }));
    expect(await screen.findByRole('alert')).toHaveTextContent(msg);
  });

  it('gagal memuat: alert dan tombol muat ulang', async () => {
    asMock(categoryService.getAll).mockRejectedValue(new Error(randWord('x')));
    renderWith(<CategoriesManager />);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Muat ulang' })).toBeInTheDocument();
  });
});
