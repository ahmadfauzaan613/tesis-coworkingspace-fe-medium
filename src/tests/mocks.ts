import { vi } from 'vitest';

// Bentuk mock service yang sama untuk semua test komponen.
export const serviceMocks = {
  api: () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }),
  asset: () => ({
    assetService: {
      getAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      adjustStock: vi.fn(),
      delete: vi.fn(),
      exportCSV: vi.fn(),
      getGlobalHistory: vi.fn(),
      getAssetHistory: vi.fn(),
    },
  }),
  category: () => ({ categoryService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() } }),
  assignment: () => ({ assignmentService: { getAll: vi.fn(), create: vi.fn(), returnAsset: vi.fn() } }),
  maintenance: () => ({ maintenanceService: { getAll: vi.fn(), create: vi.fn(), resolveTicket: vi.fn() } }),
  dashboard: () => ({ dashboardService: { getStats: vi.fn() } }),
};

export const asMock = (f: unknown) => f as ReturnType<typeof vi.fn>;
