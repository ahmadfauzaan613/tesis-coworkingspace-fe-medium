export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Asset {
  id: number;
  category_id: number;
  category_name?: string; // from joined queries
  name: string;
  sku: string | null;
  description: string | null;
  stock: number;
  location: string | null;
  status: 'Available' | 'Maintenance' | 'Broken' | string;
  created_at?: string;
  updated_at?: string;
}

export interface StockHistory {
  id: number;
  asset_id: number;
  asset_name?: string; // from joined queries
  asset_sku?: string;
  change_qty: number;
  change_type: 'INITIAL' | 'ADDITION' | 'DEDUCTION' | 'DAMAGE' | 'AUDIT' | string;
  remarks: string | null;
  admin_id: number | null;
  admin_username?: string; // from joined queries
  created_at: string;
}

export interface AssetAssignment {
  id: number;
  asset_id: number;
  asset_name?: string;
  asset_sku?: string;
  assigned_to: string;
  quantity: number;
  status: 'ACTIVE' | 'RETURNED' | string;
  returned_at: string | null;
  created_at: string;
  updated_at?: string;
}

export interface MaintenanceTicket {
  id: number;
  asset_id: number;
  asset_name?: string;
  asset_sku?: string;
  issue_description: string;
  status: 'PENDING' | 'RESOLVED' | string;
  repair_cost: number;
  vendor_name: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Pagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface DashboardStats {
  totalAssets: number;
  totalCategories: number;
  outOfStock: number;
  lowStockCount: number;
  brokenAssets: number;
  categoryBreakdown: {
    category: string;
    uniqueItems: number;
    totalStock: number;
  }[];
  lowStockAlerts: {
    id: number;
    name: string;
    sku: string | null;
    stock: number;
    location: string | null;
    category_name: string;
  }[];
  recentActivities: {
    id: number;
    change_qty: number;
    change_type: string;
    remarks: string | null;
    created_at: string;
    asset_name: string;
    admin_username: string | null;
  }[];
}

export interface ServerStatus {
  status: string;
  database: string;
  timestamp: string;
}
