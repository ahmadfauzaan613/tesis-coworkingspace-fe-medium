import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeAsset, makeCategory, makeUser, paginate, randInt, randWord, pick } from './random';

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import api from '../services/api';
import { assetService } from '../services/assetService';
import { assignmentService } from '../services/assignmentService';
import { authService } from '../services/authService';
import { categoryService } from '../services/categoryService';
import { dashboardService } from '../services/dashboardService';
import { maintenanceService } from '../services/maintenanceService';

const mocked = api as unknown as Record<'get' | 'post' | 'put' | 'delete', ReturnType<typeof vi.fn>>;
const reply = (method: keyof typeof mocked, data: unknown) => mocked[method].mockResolvedValueOnce({ data });

beforeEach(() => vi.clearAllMocks());

describe('assetService', () => {
  it('getAll meneruskan semua filter sebagai query params', async () => {
    const params = { page: randInt(1, 9), limit: randInt(1, 50), search: randWord('cari'), categoryId: randInt(1, 9), status: 'Broken', lowStock: 'true' as const };
    const body = paginate([makeAsset(1)]);
    reply('get', body);
    expect(await assetService.getAll(params)).toEqual(body);
    expect(mocked.get).toHaveBeenCalledWith('/assets', { params });
  });

  it('create, update, adjustStock, delete memanggil endpoint yang benar', async () => {
    const id = randInt(1, 999);
    const asset = makeAsset(id);
    const payload = { categoryId: asset.category_id, name: asset.name };
    reply('post', asset);
    expect(await assetService.create(payload)).toEqual(asset);
    expect(mocked.post).toHaveBeenLastCalledWith('/assets', payload);

    reply('put', { message: randWord('ok'), asset });
    expect(await assetService.update(id, payload)).toEqual(asset);
    expect(mocked.put).toHaveBeenLastCalledWith(`/assets/${id}`, payload);

    const adj = { changeQty: randInt(1, 9), changeType: 'ADDITION' as const, remarks: randWord('c') };
    const msg = { message: randWord('ok') };
    reply('post', msg);
    expect(await assetService.adjustStock(id, adj)).toEqual(msg);
    expect(mocked.post).toHaveBeenLastCalledWith(`/assets/${id}/stock`, adj);

    reply('delete', msg);
    expect(await assetService.delete(id)).toEqual(msg);
    expect(mocked.delete).toHaveBeenLastCalledWith(`/assets/${id}`);
  });

  it('exportCSV meminta respons teks', async () => {
    const csv = `ID,Nama\n${randInt(1, 9)},${randWord('a')}`;
    reply('get', csv);
    expect(await assetService.exportCSV()).toBe(csv);
    expect(mocked.get).toHaveBeenCalledWith('/assets/export', { responseType: 'text' });
  });

  it('riwayat global dan per aset memakai page dan limit', async () => {
    const [page, limit, id] = [randInt(1, 9), randInt(1, 50), randInt(1, 99)];
    reply('get', paginate([]));
    await assetService.getGlobalHistory(page, limit);
    expect(mocked.get).toHaveBeenLastCalledWith('/assets/history', { params: { page, limit } });
    reply('get', paginate([]));
    await assetService.getAssetHistory(id, page, limit);
    expect(mocked.get).toHaveBeenLastCalledWith(`/assets/${id}/history`, { params: { page, limit } });
  });
});

describe('categoryService', () => {
  it('CRUD memanggil endpoint yang benar dan update mengembalikan objek kategori', async () => {
    const [page, limit] = [randInt(1, 9), randInt(1, 50)];
    const cat = makeCategory(randInt(1, 99));
    reply('get', paginate([cat]));
    await categoryService.getAll(page, limit);
    expect(mocked.get).toHaveBeenLastCalledWith('/categories', { params: { page, limit } });

    const data = { name: cat.name, description: randWord('d') };
    reply('post', cat);
    expect(await categoryService.create(data)).toEqual(cat);
    reply('put', { message: randWord('ok'), category: cat });
    expect(await categoryService.update(cat.id, data)).toEqual(cat);
    expect(mocked.put).toHaveBeenLastCalledWith(`/categories/${cat.id}`, data);
    reply('delete', { message: 'x' });
    await categoryService.delete(cat.id);
    expect(mocked.delete).toHaveBeenLastCalledWith(`/categories/${cat.id}`);
  });
});

describe('assignmentService dan maintenanceService', () => {
  it('assignment: daftar, pinjam, kembalikan', async () => {
    const [page, limit, id] = [randInt(1, 9), randInt(1, 50), randInt(1, 99)];
    reply('get', paginate([]));
    await assignmentService.getAll(page, limit);
    expect(mocked.get).toHaveBeenLastCalledWith('/assignments', { params: { page, limit } });
    const data = { assetId: id, assignedTo: randWord('p'), quantity: randInt(1, 9) };
    reply('post', {});
    await assignmentService.create(data);
    expect(mocked.post).toHaveBeenLastCalledWith('/assignments', data);
    reply('post', {});
    await assignmentService.returnAsset(id);
    expect(mocked.post).toHaveBeenLastCalledWith(`/assignments/${id}/return`);
  });

  it('maintenance: filter status, lapor, selesaikan', async () => {
    const [page, limit, id] = [randInt(1, 9), randInt(1, 50), randInt(1, 99)];
    const status = pick(['PENDING', 'RESOLVED', undefined]);
    reply('get', paginate([]));
    await maintenanceService.getAll(status, page, limit);
    expect(mocked.get).toHaveBeenLastCalledWith('/maintenance', { params: { status, page, limit } });
    const report = { assetId: id, issueDescription: randWord('r'), assetStatus: 'Broken' as const };
    reply('post', {});
    await maintenanceService.create(report);
    expect(mocked.post).toHaveBeenLastCalledWith('/maintenance', report);
    const resolve = { repairCost: randInt(0, 1e6), vendorName: randWord('v'), restoreAssetStatus: true };
    reply('post', {});
    await maintenanceService.resolveTicket(id, resolve);
    expect(mocked.post).toHaveBeenLastCalledWith(`/maintenance/${id}/resolve`, resolve);
  });

  it('dashboard: getStats', async () => {
    const body = { totalAssets: randInt(0, 99) };
    reply('get', body);
    expect(await dashboardService.getStats()).toEqual(body);
    expect(mocked.get).toHaveBeenCalledWith('/dashboard/stats');
  });
});

describe('authService', () => {
  it('login menyimpan token dan user ke localStorage', async () => {
    const user = makeUser();
    const token = randWord('token');
    reply('post', { token, user, message: randWord('ok') });
    const pw = randWord('pw');
    await authService.login(user.username, pw);
    expect(mocked.post).toHaveBeenCalledWith('/auth/login', { username: user.username, password: pw });
    expect(localStorage.getItem('token')).toBe(token);
    expect(authService.getCurrentUser()).toEqual(user);
    expect(authService.isAuthenticated()).toBe(true);
  });

  it('login gagal (tanpa token) tidak menyimpan apa pun', async () => {
    reply('post', { message: randWord('gagal') });
    await authService.login(randWord('u'), randWord('p'));
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('logout menghapus sesi', () => {
    localStorage.setItem('token', randWord('t'));
    localStorage.setItem('user', JSON.stringify(makeUser()));
    authService.logout();
    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.getCurrentUser()).toBeNull();
  });

  it('data user rusak di localStorage dibaca sebagai null', () => {
    localStorage.setItem('user', `{${randWord('rusak')}`);
    expect(authService.getCurrentUser()).toBeNull();
  });

  it('getMe memanggil /auth/me', async () => {
    const user = makeUser();
    reply('get', user);
    expect(await authService.getMe()).toEqual(user);
    expect(mocked.get).toHaveBeenCalledWith('/auth/me');
  });
});
