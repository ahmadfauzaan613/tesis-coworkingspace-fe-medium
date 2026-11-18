import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import App from '../App';
import { authService } from '../services/authService';
import { makeAsset, makeCategory, makeHistory, makeLoan, makeStats, makeTicket, makeUser, paginate, randInt, randWord } from './random';
import { newClient } from './render';
import { asMock } from './mocks';

vi.mock('../services/api', async () => (await import('./mocks')).serviceMocks.api());
vi.mock('../services/assetService', async () => (await import('./mocks')).serviceMocks.asset());
vi.mock('../services/categoryService', async () => (await import('./mocks')).serviceMocks.category());
vi.mock('../services/assignmentService', async () => (await import('./mocks')).serviceMocks.assignment());
vi.mock('../services/maintenanceService', async () => (await import('./mocks')).serviceMocks.maintenance());
vi.mock('../services/dashboardService', async () => (await import('./mocks')).serviceMocks.dashboard());
import api from '../services/api';
import { assetService } from '../services/assetService';
import { categoryService } from '../services/categoryService';
import { assignmentService } from '../services/assignmentService';
import { maintenanceService } from '../services/maintenanceService';
import { dashboardService } from '../services/dashboardService';

const routes = ['/dashboard', '/assets', '/categories', '/assignments', '/maintenance'];

function seedServices() {
  const n = () => randInt(1, 6);
  asMock(api.get).mockResolvedValue({ data: { status: 'Online', database: 'Connected', timestamp: new Date().toISOString() } });
  asMock(dashboardService.getStats).mockResolvedValue(makeStats());
  asMock(assetService.getAll).mockResolvedValue(paginate(Array.from({ length: n() }, (_, i) => makeAsset(i + 1))));
  asMock(assetService.getGlobalHistory).mockResolvedValue(paginate(Array.from({ length: n() }, (_, i) => makeHistory(i + 1))));
  asMock(categoryService.getAll).mockResolvedValue(paginate(Array.from({ length: n() }, (_, i) => makeCategory(i + 1))));
  asMock(assignmentService.getAll).mockResolvedValue(paginate(Array.from({ length: n() }, (_, i) => makeLoan(i + 1))));
  asMock(maintenanceService.getAll).mockResolvedValue(paginate(Array.from({ length: n() }, (_, i) => makeTicket(i + 1))));
}

function loginAs(user = makeUser()) {
  localStorage.setItem('token', randWord('token'));
  localStorage.setItem('user', JSON.stringify(user));
  vi.spyOn(authService, 'getMe').mockResolvedValue(user);
  return user;
}

const renderApp = (path: string) => {
  window.history.pushState({}, '', path);
  return render(
    <QueryClientProvider client={newClient()}>
      <App />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  seedServices();
});

describe('Routing', () => {
  it('belum login: semua halaman panel diarahkan ke login', async () => {
    renderApp(routes[randInt(0, routes.length - 1)]);
    expect(await screen.findByRole('heading', { name: 'Masuk ke panel inventaris' })).toBeInTheDocument();
  });

  it('sudah login: halaman login diarahkan ke ringkasan', async () => {
    loginAs();
    renderApp('/');
    expect(await screen.findByRole('heading', { level: 1, name: 'Ringkasan' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/dashboard');
  });

  it('alamat tidak dikenal diarahkan, bukan halaman kosong', async () => {
    loginAs();
    renderApp(`/${randWord('tidakada')}`);
    await screen.findByRole('heading', { level: 1, name: 'Ringkasan' });
    expect(window.location.pathname).toBe('/dashboard');
  });
});

describe('Tema', () => {
  it('pilihan tema disimpan dan dipasang ke <html>', async () => {
    renderApp('/');
    const btn = await screen.findByRole('button', { name: /Pakai tema/ });
    const toDark = btn.getAttribute('aria-label') === 'Pakai tema gelap';
    await userEvent.click(btn);
    expect(document.documentElement.classList.contains('dark')).toBe(toDark);
    expect(localStorage.getItem('theme')).toBe(toDark ? 'dark' : 'light');
  });

  it('tema tersimpan dipakai saat aplikasi dibuka lagi', async () => {
    const theme = randInt(0, 1) ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    renderApp('/');
    await screen.findByRole('heading', { name: 'Masuk ke panel inventaris' });
    expect(document.documentElement.classList.contains('dark')).toBe(theme === 'dark');
  });
});

describe.each(['/', ...routes])('Kualitas halaman %s', (path) => {
  const open = async () => {
    if (path !== '/') loginAs();
    renderApp(path);
    await screen.findByRole('heading', { level: 1 });
    await waitFor(() => expect(screen.queryAllByRole('status').filter((s) => /Memuat/.test(s.textContent ?? ''))).toHaveLength(0));
  };

  it('tepat satu h1 dan tidak ada level heading yang terlewat', async () => {
    await open();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const levels = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => Number(h.tagName[1]));
    levels.reduce((prev, cur) => {
      expect(cur - prev).toBeLessThanOrEqual(1);
      return cur;
    });
  });

  it('tidak ada em dash di teks yang tampil', async () => {
    await open();
    expect(document.body.textContent).not.toContain('—');
  });

  it('setiap tombol dan link punya nama yang bisa dibaca pembaca layar', async () => {
    await open();
    for (const el of [...screen.queryAllByRole('button'), ...screen.queryAllByRole('link')]) {
      expect(el).toHaveAccessibleName();
    }
  });

  it('setiap isian form punya label', async () => {
    await open();
    for (const el of document.querySelectorAll('input, select, textarea')) {
      expect(el).toHaveAccessibleName();
    }
  });

  it('tidak ada link ke "#" atau link tanpa tujuan', async () => {
    await open();
    for (const a of document.querySelectorAll('a')) {
      const href = a.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href === '#' || href!.startsWith('#') && !document.getElementById(href!.slice(1))).toBe(false);
    }
  });
});
