import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from '../components/Login';
import { Layout } from '../components/Layout';
import { authService } from '../services/authService';
import { makeUser, pick, randWord } from './random';
import { renderWith } from './render';
import { asMock } from './mocks';

vi.mock('../services/api', async () => (await import('./mocks')).serviceMocks.api());
import api from '../services/api';

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('Login', () => {
  const setup = (theme: 'light' | 'dark' = pick(['light', 'dark'])) => {
    const onLoginSuccess = vi.fn();
    const toggleTheme = vi.fn();
    renderWith(<Login onLoginSuccess={onLoginSuccess} theme={theme} toggleTheme={toggleTheme} />);
    return { onLoginSuccess, toggleTheme };
  };

  it('form kosong menampilkan pesan dan tidak memanggil server', async () => {
    const login = vi.spyOn(authService, 'login');
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('username dan password yang diketik dikirim, lalu onLoginSuccess menerima user', async () => {
    const user = makeUser();
    const pw = randWord('pw');
    const login = vi.spyOn(authService, 'login').mockResolvedValue({ token: randWord('t'), user });
    const { onLoginSuccess } = setup();
    await userEvent.type(screen.getByLabelText('Username'), user.username);
    await userEvent.type(screen.getByLabelText('Password'), pw);
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }));
    expect(login).toHaveBeenCalledWith(user.username, pw);
    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledWith(user));
  });

  it('pesan error dari backend ditampilkan apa adanya', async () => {
    const msg = randWord('Salah');
    vi.spyOn(authService, 'login').mockRejectedValue({ response: { data: { message: msg } } });
    setup();
    await userEvent.type(screen.getByLabelText('Username'), randWord('u'));
    await userEvent.type(screen.getByLabelText('Password'), randWord('p'));
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(msg);
  });

  it.each(['demo', 'admin'])('tombol akun %s masuk dengan password sama dengan username', async (u) => {
    const login = vi.spyOn(authService, 'login').mockResolvedValue({ token: randWord('t'), user: makeUser({ username: u }) });
    setup();
    await userEvent.click(screen.getByRole('button', { name: `Akun ${u}` }));
    expect(login).toHaveBeenCalledWith(u, u);
  });

  it('tombol tema memanggil toggleTheme dan labelnya sesuai tema aktif', async () => {
    const theme = pick(['light', 'dark'] as const);
    const { toggleTheme } = setup(theme);
    const btn = screen.getByRole('button', { name: theme === 'dark' ? 'Pakai tema terang' : 'Pakai tema gelap' });
    await userEvent.click(btn);
    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });

  it('isian punya autocomplete yang benar untuk password manager', () => {
    setup();
    expect(screen.getByLabelText('Username')).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'current-password');
  });
});

describe('Layout', () => {
  const menu = [
    ['/dashboard', 'Ringkasan'],
    ['/assets', 'Aset'],
    ['/categories', 'Kategori'],
    ['/assignments', 'Peminjaman'],
    ['/maintenance', 'Perawatan'],
  ] as const;

  const setup = ({ db = pick(['Connected', 'Disconnected']), route = pick(menu)[0] } = {}) => {
    asMock(api.get).mockResolvedValue({ data: { status: 'Online', database: db, timestamp: new Date().toISOString() } });
    const user = makeUser();
    const props = { user, onLogout: vi.fn(), theme: pick(['light', 'dark'] as const), toggleTheme: vi.fn() };
    const content = randWord('Konten');
    renderWith(
      <Layout {...props}>
        <p>{content}</p>
      </Layout>,
      { route },
    );
    return { ...props, content, db, route };
  };

  it('menu samping berisi lima tujuan yang nyata, yang aktif ditandai aria-current', () => {
    const { route } = setup();
    const nav = screen.getByRole('navigation', { name: 'Menu utama' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((l) => [l.getAttribute('href'), l.textContent])).toEqual(menu.map(([h, l]) => [h, l]));
    expect(within(nav).getByRole('link', { current: 'page' })).toHaveAttribute('href', route);
  });

  it('judul tab mengikuti halaman aktif', async () => {
    const { route } = setup();
    const label = menu.find(([h]) => h === route)![1];
    await waitFor(() => expect(document.title).toBe(`${label} | SpaceHub`));
  });

  it('status database ditampilkan sesuai respons /status', async () => {
    const { db } = setup();
    expect(await screen.findByText(db === 'Connected' ? 'Terhubung' : 'Terputus')).toBeInTheDocument();
  });

  it('konten halaman dan nama user tampil', () => {
    const { content, user } = setup();
    expect(screen.getByText(content)).toBeInTheDocument();
    expect(screen.getAllByText(user.username).length).toBeGreaterThan(0);
  });

  it('menu mobile: aria-expanded berubah, Escape dan klik link menutupnya', async () => {
    setup();
    const toggle = screen.getByRole('button', { name: 'Buka menu' });
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Buka menu' })).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(screen.getByRole('button', { name: 'Buka menu' }));
    const drawer = document.getElementById('mobile-nav-drawer')!;
    await userEvent.click(within(drawer).getByRole('link', { name: pick(menu)[1] }));
    expect(document.getElementById('mobile-nav-drawer')).toBeNull();
  });

  it('keluar menghapus sesi dan memanggil onLogout', async () => {
    localStorage.setItem('token', randWord('t'));
    const { onLogout } = setup();
    await userEvent.click(screen.getAllByRole('button', { name: 'Keluar dari akun' })[0]);
    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('skip link mengarah ke konten utama yang ada', () => {
    setup();
    const skip = screen.getByRole('link', { name: 'Lewati ke konten' });
    const target = skip.getAttribute('href')!.slice(1);
    expect(document.getElementById(target)?.tagName).toBe('MAIN');
  });
});
