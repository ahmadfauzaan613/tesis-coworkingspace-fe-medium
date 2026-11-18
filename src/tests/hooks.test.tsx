import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { makeAsset, makeCategory, makeHistory, makeLoan, makeStats, makeTicket, makeUser, paginate, pick, randInt, randWord } from './random';
import { newClient, withProviders } from './render';

vi.mock('../services/assetService', () => ({
  assetService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), adjustStock: vi.fn(), delete: vi.fn(), getGlobalHistory: vi.fn(), getAssetHistory: vi.fn() },
}));
vi.mock('../services/categoryService', () => ({ categoryService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() } }));
vi.mock('../services/assignmentService', () => ({ assignmentService: { getAll: vi.fn(), create: vi.fn(), returnAsset: vi.fn() } }));
vi.mock('../services/maintenanceService', () => ({ maintenanceService: { getAll: vi.fn(), create: vi.fn(), resolveTicket: vi.fn() } }));
vi.mock('../services/dashboardService', () => ({ dashboardService: { getStats: vi.fn() } }));

import { assetService } from '../services/assetService';
import { categoryService } from '../services/categoryService';
import { assignmentService } from '../services/assignmentService';
import { maintenanceService } from '../services/maintenanceService';
import { dashboardService } from '../services/dashboardService';
import { authService } from '../services/authService';
import { useAssets, useStockHistory } from '../hooks/useAssets';
import { useCategories } from '../hooks/useCategories';
import { useAssignments } from '../hooks/useAssignments';
import { useMaintenance } from '../hooks/useMaintenance';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../hooks/useAuth';

const fn = (f: unknown) => f as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

function setup<T>(hook: () => T) {
  const client = newClient();
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const view = renderHook(hook, { wrapper: withProviders(client) });
  const invalidatedKeys = () => invalidate.mock.calls.map((c) => (c[0] as { queryKey: unknown[] }).queryKey[0]);
  return { ...view, invalidatedKeys };
}

describe('useAssets', () => {
  it('data dari service diteruskan apa adanya, dengan filter yang sama', async () => {
    const body = paginate(Array.from({ length: randInt(1, 8) }, (_, i) => makeAsset(i + 1)));
    const filter = { page: randInt(1, 5), search: randWord('cari') };
    fn(assetService.getAll).mockResolvedValue(body);
    const { result } = setup(() => useAssets(filter));
    await waitFor(() => expect(result.current.assetsData).toEqual(body));
    expect(assetService.getAll).toHaveBeenCalledWith(filter);
  });

  it('mutasi stok menyegarkan aset, ringkasan, dan riwayat', async () => {
    fn(assetService.getAll).mockResolvedValue(paginate([]));
    fn(assetService.adjustStock).mockResolvedValue({ message: 'ok' });
    const { result, invalidatedKeys } = setup(() => useAssets());
    const args = { id: randInt(1, 99), data: { changeQty: randInt(1, 9), changeType: 'ADDITION' as const } };
    await act(() => result.current.adjustStock(args));
    expect(assetService.adjustStock).toHaveBeenCalledWith(args.id, args.data);
    expect(invalidatedKeys()).toEqual(expect.arrayContaining(['assets', 'dashboardStats', 'globalHistory', 'assetHistory']));
  });

  it('create, update, delete menyegarkan aset dan ringkasan', async () => {
    fn(assetService.getAll).mockResolvedValue(paginate([]));
    const { result, invalidatedKeys } = setup(() => useAssets());
    const asset = makeAsset(randInt(1, 99));
    await act(() => result.current.createAsset({ categoryId: asset.category_id, name: asset.name }));
    await act(() => result.current.updateAsset({ id: asset.id, data: { name: asset.name } }));
    await act(() => result.current.deleteAsset(asset.id));
    expect(assetService.delete).toHaveBeenCalledWith(asset.id);
    expect(invalidatedKeys().filter((k) => k === 'assets')).toHaveLength(3);
    expect(invalidatedKeys().filter((k) => k === 'dashboardStats')).toHaveLength(3);
  });
});

describe('useStockHistory', () => {
  it('tanpa assetId memakai riwayat global, dengan assetId memakai riwayat aset', async () => {
    const body = paginate([makeHistory(1)]);
    fn(assetService.getGlobalHistory).mockResolvedValue(body);
    fn(assetService.getAssetHistory).mockResolvedValue(body);
    const [page, limit, id] = [randInt(1, 5), randInt(5, 20), randInt(1, 99)];
    const g = setup(() => useStockHistory(page, limit));
    await waitFor(() => expect(g.result.current.data).toEqual(body));
    expect(assetService.getGlobalHistory).toHaveBeenCalledWith(page, limit);
    const a = setup(() => useStockHistory(page, limit, id));
    await waitFor(() => expect(a.result.current.data).toEqual(body));
    expect(assetService.getAssetHistory).toHaveBeenCalledWith(id, page, limit);
  });
});

describe('useCategories, useAssignments, useMaintenance, useDashboard', () => {
  it('useCategories: data dan mutasi', async () => {
    const body = paginate([makeCategory(1), makeCategory(2)]);
    fn(categoryService.getAll).mockResolvedValue(body);
    const [page, limit] = [randInt(1, 5), randInt(5, 50)];
    const { result, invalidatedKeys } = setup(() => useCategories(page, limit));
    await waitFor(() => expect(result.current.categoriesData).toEqual(body));
    expect(categoryService.getAll).toHaveBeenCalledWith(page, limit);
    const data = { name: randWord('k') };
    await act(() => result.current.createCategory(data));
    await act(() => result.current.updateCategory({ id: 1, data }));
    await act(() => result.current.deleteCategory(2));
    expect(categoryService.delete).toHaveBeenCalledWith(2);
    expect(invalidatedKeys()).toEqual(expect.arrayContaining(['categories', 'dashboardStats']));
  });

  it('useAssignments: pinjam dan kembalikan menyegarkan aset juga', async () => {
    fn(assignmentService.getAll).mockResolvedValue(paginate([makeLoan(1)]));
    const { result, invalidatedKeys } = setup(() => useAssignments());
    const data = { assetId: randInt(1, 9), assignedTo: randWord('p'), quantity: randInt(1, 5) };
    await act(() => result.current.checkoutAsset(data));
    await act(() => result.current.returnAsset(randInt(1, 9)));
    expect(assignmentService.create).toHaveBeenCalledWith(data);
    expect(invalidatedKeys()).toEqual(expect.arrayContaining(['assignments', 'assets', 'dashboardStats']));
  });

  it('useMaintenance: status kosong dikirim sebagai undefined', async () => {
    fn(maintenanceService.getAll).mockResolvedValue(paginate([makeTicket(1)]));
    const [page, limit] = [randInt(1, 5), randInt(5, 50)];
    const { result, invalidatedKeys } = setup(() => useMaintenance('', page, limit));
    await waitFor(() => expect(result.current.ticketsData).toBeDefined());
    expect(maintenanceService.getAll).toHaveBeenCalledWith(undefined, page, limit);
    const id = randInt(1, 9);
    const data = { repairCost: randInt(0, 1e6), restoreAssetStatus: pick([true, false]) };
    await act(() => result.current.resolveTicket({ id, data }));
    expect(maintenanceService.resolveTicket).toHaveBeenCalledWith(id, data);
    expect(invalidatedKeys()).toEqual(expect.arrayContaining(['maintenance', 'assets', 'dashboardStats']));
  });

  it('useDashboard: meneruskan statistik dan error', async () => {
    const stats = makeStats();
    fn(dashboardService.getStats).mockResolvedValueOnce(stats);
    const ok = setup(() => useDashboard());
    await waitFor(() => expect(ok.result.current.stats).toEqual(stats));
    fn(dashboardService.getStats).mockRejectedValueOnce(new Error(randWord('gagal')));
    const bad = setup(() => useDashboard());
    await waitFor(() => expect(bad.result.current.error).toBeTruthy());
  });
});

describe('useAuth', () => {
  it('tanpa token: belum login dan profil tidak diminta', () => {
    const getMe = vi.spyOn(authService, 'getMe');
    const { result } = setup(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);
    expect(getMe).not.toHaveBeenCalled();
  });

  it('dengan token: profil dari server menggantikan user di localStorage', async () => {
    const stale = makeUser();
    const fresh = makeUser();
    localStorage.setItem('token', randWord('t'));
    localStorage.setItem('user', JSON.stringify(stale));
    vi.spyOn(authService, 'getMe').mockResolvedValue(fresh);
    const { result } = setup(() => useAuth());
    await waitFor(() => expect(result.current.user).toEqual(fresh));
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('profil gagal dimuat (token kedaluwarsa): sesi dihapus', async () => {
    localStorage.setItem('token', randWord('t'));
    localStorage.setItem('user', JSON.stringify(makeUser()));
    vi.spyOn(authService, 'getMe').mockRejectedValue(new Error(randWord('401')));
    const { result } = setup(() => useAuth());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('logout menghapus user dan token', async () => {
    localStorage.setItem('token', randWord('t'));
    localStorage.setItem('user', JSON.stringify(makeUser()));
    vi.spyOn(authService, 'getMe').mockResolvedValue(makeUser());
    const { result } = setup(() => useAuth());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    act(() => result.current.logout());
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });
});
