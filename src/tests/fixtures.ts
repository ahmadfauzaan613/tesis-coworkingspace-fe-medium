import type {
  User,
  Category,
  Asset,
  AssetAssignment,
  MaintenanceTicket,
  StockHistory,
  DashboardStats,
  Pagination,
  PaginatedResponse,
} from '../types'

// ─── Users ───────────────────────────────────────────────────────────────────

export const mockUser: User = {
  id: 1,
  username: 'admin',
  email: 'admin@coworking.com',
  role: 'admin',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

// ─── Categories ───────────────────────────────────────────────────────────────

export const mockCategory: Category = {
  id: 1,
  name: 'Electronics',
  description: 'Electronic devices and accessories',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

export const mockCategories: Category[] = [
  mockCategory,
  {
    id: 2,
    name: 'Furniture',
    description: 'Office furniture and fittings',
    created_at: '2024-01-02T00:00:00.000Z',
    updated_at: '2024-01-02T00:00:00.000Z',
  },
]

// ─── Assets ───────────────────────────────────────────────────────────────────

export const mockAsset: Asset = {
  id: 1,
  category_id: 1,
  category_name: 'Electronics',
  name: 'Laptop Dell XPS',
  sku: 'DELL-XPS-001',
  description: 'High performance business laptop',
  stock: 10,
  location: 'Room A',
  status: 'Available',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

export const mockAssets: Asset[] = [
  mockAsset,
  {
    id: 2,
    category_id: 2,
    category_name: 'Furniture',
    name: 'Office Chair',
    sku: 'CHAIR-001',
    description: 'Ergonomic office chair',
    stock: 5,
    location: 'Room B',
    status: 'Available',
    created_at: '2024-01-02T00:00:00.000Z',
    updated_at: '2024-01-02T00:00:00.000Z',
  },
]

// ─── Stock History ────────────────────────────────────────────────────────────

export const mockStockHistory: StockHistory = {
  id: 1,
  asset_id: 1,
  asset_name: 'Laptop Dell XPS',
  asset_sku: 'DELL-XPS-001',
  change_qty: 10,
  change_type: 'INITIAL',
  remarks: 'Initial stock entry',
  admin_id: 1,
  admin_username: 'admin',
  created_at: '2024-01-01T00:00:00.000Z',
}

export const mockStockHistories: StockHistory[] = [
  mockStockHistory,
  {
    id: 2,
    asset_id: 1,
    asset_name: 'Laptop Dell XPS',
    asset_sku: 'DELL-XPS-001',
    change_qty: 5,
    change_type: 'ADDITION',
    remarks: 'Restocked from supplier',
    admin_id: 1,
    admin_username: 'admin',
    created_at: '2024-01-10T00:00:00.000Z',
  },
]

// ─── Assignments ──────────────────────────────────────────────────────────────

export const mockAssignment: AssetAssignment = {
  id: 1,
  asset_id: 1,
  asset_name: 'Laptop Dell XPS',
  asset_sku: 'DELL-XPS-001',
  assigned_to: 'John Doe',
  quantity: 1,
  status: 'ACTIVE',
  returned_at: null,
  created_at: '2024-01-05T00:00:00.000Z',
  updated_at: '2024-01-05T00:00:00.000Z',
}

export const mockAssignments: AssetAssignment[] = [
  mockAssignment,
  {
    id: 2,
    asset_id: 2,
    asset_name: 'Office Chair',
    asset_sku: 'CHAIR-001',
    assigned_to: 'Jane Smith',
    quantity: 2,
    status: 'ACTIVE',
    returned_at: null,
    created_at: '2024-01-06T00:00:00.000Z',
    updated_at: '2024-01-06T00:00:00.000Z',
  },
]

// ─── Maintenance Tickets ──────────────────────────────────────────────────────

export const mockMaintenanceTicket: MaintenanceTicket = {
  id: 1,
  asset_id: 1,
  asset_name: 'Laptop Dell XPS',
  asset_sku: 'DELL-XPS-001',
  issue_description: 'Screen flickering intermittently',
  status: 'PENDING',
  repair_cost: 0,
  vendor_name: null,
  resolved_at: null,
  created_at: '2024-01-08T00:00:00.000Z',
  updated_at: '2024-01-08T00:00:00.000Z',
}

export const mockMaintenanceTickets: MaintenanceTicket[] = [
  mockMaintenanceTicket,
  {
    id: 2,
    asset_id: 2,
    asset_name: 'Office Chair',
    asset_sku: 'CHAIR-001',
    issue_description: 'Broken wheel base',
    status: 'RESOLVED',
    repair_cost: 150000,
    vendor_name: 'Fix-It Workshop',
    resolved_at: '2024-01-12T00:00:00.000Z',
    created_at: '2024-01-09T00:00:00.000Z',
    updated_at: '2024-01-12T00:00:00.000Z',
  },
]

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export const mockDashboardStats: DashboardStats = {
  totalAssets: 2,
  totalCategories: 2,
  outOfStock: 0,
  lowStockCount: 1,
  brokenAssets: 0,
  categoryBreakdown: [
    { category: 'Electronics', uniqueItems: 1, totalStock: 10 },
    { category: 'Furniture', uniqueItems: 1, totalStock: 5 },
  ],
  lowStockAlerts: [
    {
      id: 2,
      name: 'Office Chair',
      sku: 'CHAIR-001',
      stock: 5,
      location: 'Room B',
      category_name: 'Furniture',
    },
  ],
  recentActivities: [
    {
      id: 1,
      change_qty: 10,
      change_type: 'INITIAL',
      remarks: 'Initial stock entry',
      created_at: '2024-01-01T00:00:00.000Z',
      asset_name: 'Laptop Dell XPS',
      admin_username: 'admin',
    },
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function makePaginatedResponse<T>(
  data: T[],
  paginationOverrides: Partial<Pagination> = {}
): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      totalItems: data.length,
      totalPages: 1,
      currentPage: 1,
      limit: 10,
      ...paginationOverrides,
    },
  }
}
