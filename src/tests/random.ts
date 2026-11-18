// Data uji dibuat acak setiap run; nilai yang diharapkan dihitung dari data ini.
import type { Asset, AssetAssignment, Category, DashboardStats, MaintenanceTicket, PaginatedResponse, StockHistory, User } from '../types';

export const randInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
export const randId = () => Math.random().toString(36).slice(2, 10);
export const randWord = (prefix: string) => `${prefix}-${randId()}`;
export const pick = <T,>(arr: readonly T[]): T => arr[randInt(0, arr.length - 1)];
export const isoAgo = (minutes: number) => new Date(Date.now() - minutes * 60000).toISOString();

export const makeUser = (overrides: Partial<User> = {}): User => ({
  id: randInt(1, 999),
  username: randWord('user'),
  email: `${randId()}@${randId()}.test`,
  role: pick(['admin', 'staff']),
  ...overrides,
});

export const makeCategory = (id: number): Category => ({ id, name: randWord('Kategori'), description: pick([null, randWord('Ket')]) });

export const makeAsset = (id: number, overrides: Partial<Asset> = {}): Asset => ({
  id,
  category_id: randInt(1, 5),
  category_name: randWord('Kategori'),
  name: randWord('Aset'),
  sku: pick([null, randWord('SKU')]),
  description: pick([null, randWord('Desk')]),
  stock: randInt(0, 60),
  location: pick([null, randWord('Ruang')]),
  status: pick(['Available', 'Maintenance', 'Broken']),
  ...overrides,
});

export const makeHistory = (id: number): StockHistory => ({
  id,
  asset_id: randInt(1, 50),
  asset_name: randWord('Aset'),
  asset_sku: pick([undefined, randWord('SKU')]),
  change_qty: pick([-1, 1]) * randInt(1, 40),
  change_type: pick(['INITIAL', 'ADDITION', 'DEDUCTION', 'DAMAGE', 'AUDIT']),
  remarks: pick([null, randWord('Catatan')]),
  admin_id: randInt(1, 3),
  admin_username: pick([undefined, randWord('admin')]),
  created_at: isoAgo(randInt(1, 10000)),
});

export const makeLoan = (id: number, overrides: Partial<AssetAssignment> = {}): AssetAssignment => {
  const returned = Math.random() < 0.5;
  return {
    id,
    asset_id: randInt(1, 50),
    asset_name: randWord('Aset'),
    asset_sku: randWord('SKU'),
    assigned_to: randWord('Peminjam'),
    quantity: randInt(1, 9),
    status: returned ? 'RETURNED' : 'ACTIVE',
    returned_at: returned ? isoAgo(randInt(1, 100)) : null,
    created_at: isoAgo(randInt(101, 1000)),
    ...overrides,
  };
};

export const makeTicket = (id: number, overrides: Partial<MaintenanceTicket> = {}): MaintenanceTicket => {
  const resolved = Math.random() < 0.5;
  return {
    id,
    asset_id: randInt(1, 50),
    asset_name: randWord('Aset'),
    asset_sku: randWord('SKU'),
    issue_description: randWord('Rusak'),
    status: resolved ? 'RESOLVED' : 'PENDING',
    repair_cost: resolved ? randInt(0, 5_000_000) : 0,
    vendor_name: resolved ? randWord('Vendor') : null,
    resolved_at: resolved ? isoAgo(randInt(1, 100)) : null,
    created_at: isoAgo(randInt(101, 1000)),
    ...overrides,
  };
};

export function paginate<T>(data: T[], page = 1, limit = 10): PaginatedResponse<T> {
  return { data, pagination: { totalItems: data.length, totalPages: Math.max(1, Math.ceil(data.length / limit)), currentPage: page, limit } };
}

export function makeStats(): DashboardStats {
  const assets = Array.from({ length: randInt(4, 12) }, (_, i) => makeAsset(i + 1));
  const low = assets.filter((a) => a.stock < 5);
  const cats = [...new Set(assets.map((a) => a.category_name!))];
  return {
    totalAssets: assets.length,
    totalCategories: cats.length,
    outOfStock: assets.filter((a) => a.stock === 0).length,
    lowStockCount: assets.filter((a) => a.stock > 0 && a.stock < 5).length,
    brokenAssets: assets.filter((a) => a.status !== 'Available').length,
    categoryBreakdown: cats.map((c) => {
      const own = assets.filter((a) => a.category_name === c);
      return { category: c, uniqueItems: own.length, totalStock: own.reduce((s, a) => s + a.stock, 0) };
    }),
    lowStockAlerts: low.map((a) => ({ id: a.id, name: a.name, sku: a.sku, stock: a.stock, location: a.location, category_name: a.category_name! })),
    recentActivities: Array.from({ length: randInt(0, 5) }, (_, i) => {
      const h = makeHistory(i + 1);
      return { id: h.id, change_qty: h.change_qty, change_type: h.change_type, remarks: h.remarks, created_at: h.created_at, asset_name: h.asset_name!, admin_username: h.admin_username ?? null };
    }),
  };
}
