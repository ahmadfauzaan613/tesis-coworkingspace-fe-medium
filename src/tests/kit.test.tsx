import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge, ErrorState, FormError, LoadingState, Modal, ModalFooter, PageHeader, Pagination } from '../components/kit';
import { toneCls } from '../lib/ui';
import { pick, randInt, randWord } from './random';

describe('PageHeader', () => {
  it('judul jadi h1, deskripsi dan aksi tampil', () => {
    const [title, desc, action] = [randWord('Judul'), randWord('Desk'), randWord('Aksi')];
    render(<PageHeader title={title} description={desc} action={<button type="button">{action}</button>} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(title);
    expect(screen.getByText(desc)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: action })).toBeInTheDocument();
  });
});

describe('Badge', () => {
  it('memakai kelas warna sesuai tone', () => {
    const tone = pick(Object.keys(toneCls) as (keyof typeof toneCls)[]);
    const text = randWord('status');
    render(<Badge tone={tone}>{text}</Badge>);
    expect(screen.getByText(text).className).toContain(toneCls[tone].split(' ')[0]);
  });
});

describe('State', () => {
  it('LoadingState diumumkan sebagai status dengan teks', () => {
    const text = randWord('Memuat');
    render(<LoadingState>{text}</LoadingState>);
    expect(screen.getByRole('status')).toHaveTextContent(text);
  });

  it('ErrorState diumumkan sebagai alert dan tombol muat ulang memanggil onRetry', async () => {
    const title = randWord('Gagal');
    const onRetry = vi.fn();
    render(<ErrorState title={title} onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent(title);
    await userEvent.click(screen.getByRole('button', { name: 'Muat ulang' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('ErrorState tanpa onRetry tidak menampilkan tombol', () => {
    render(<ErrorState title={randWord('Gagal')} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('FormError diumumkan sebagai alert', () => {
    const msg = randWord('Salah');
    render(<FormError>{msg}</FormError>);
    expect(screen.getByRole('alert')).toHaveTextContent(msg);
  });
});

describe('Pagination', () => {
  it('tidak tampil bila hanya satu halaman', () => {
    const { container } = render(<Pagination idPrefix="x" page={1} totalPages={pick([0, 1])} onChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('menampilkan posisi halaman dan tombol mengirim halaman tetangga', async () => {
    const totalPages = randInt(3, 20);
    const page = randInt(2, totalPages - 1);
    const onChange = vi.fn();
    render(<Pagination idPrefix={randWord('p')} page={page} totalPages={totalPages} onChange={onChange} />);
    expect(screen.getByText(`Halaman ${page} dari ${totalPages}`)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Halaman sebelumnya' }));
    await userEvent.click(screen.getByRole('button', { name: 'Halaman berikutnya' }));
    expect(onChange.mock.calls).toEqual([[page - 1], [page + 1]]);
  });

  it('tombol dinonaktifkan di halaman pertama dan terakhir', () => {
    const totalPages = randInt(2, 20);
    const { rerender } = render(<Pagination idPrefix="p" page={1} totalPages={totalPages} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Halaman sebelumnya' })).toBeDisabled();
    rerender(<Pagination idPrefix="p" page={totalPages} totalPages={totalPages} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Halaman berikutnya' })).toBeDisabled();
  });
});

describe('Modal', () => {
  const renderModal = (onClose = vi.fn()) => {
    const [id, title, label] = [randWord('m'), randWord('Judul'), randWord('Nama')];
    render(
      <Modal id={id} title={title} onClose={onClose}>
        <form>
          <label htmlFor={`${id}-in`}>{label}</label>
          <input id={`${id}-in`} />
          <ModalFooter>
            <button type="submit">{randWord('Simpan')}</button>
          </ModalFooter>
        </form>
      </Modal>,
    );
    return { id, title, label, onClose };
  };

  it('terbuka sebagai dialog berjudul, fokus langsung ke isian pertama', () => {
    const { title, label } = renderModal();
    const dialog = screen.getByRole('dialog', { name: title });
    expect(dialog).toHaveAttribute('open');
    expect(screen.getByLabelText(label)).toHaveFocus();
  });

  it('tombol tutup memanggil onClose', async () => {
    const { onClose } = renderModal();
    await userEvent.click(screen.getByRole('button', { name: 'Tutup dialog' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape (event cancel) memanggil onClose dan tidak menutup sendiri', () => {
    const { title, onClose } = renderModal();
    const dialog = screen.getByRole('dialog', { name: title });
    const cancel = new Event('cancel', { cancelable: true });
    fireEvent(dialog, cancel);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(cancel.defaultPrevented).toBe(true);
  });

  it('closeId kustom dipakai sebagai id tombol tutup', () => {
    const closeId = randWord('close');
    render(
      <Modal id={randWord('m')} closeId={closeId} title={randWord('t')} onClose={vi.fn()}>
        <p>{randWord('isi')}</p>
      </Modal>,
    );
    expect(document.getElementById(closeId)).toHaveAccessibleName('Tutup dialog');
  });
});
