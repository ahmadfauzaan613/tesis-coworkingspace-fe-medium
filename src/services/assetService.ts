import api from './api';
import { Asset, PaginatedResponse, StockHistory } from '../types';

export interface AssetFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number | string;
  status?: string;
  lowStock?: 'true' | 'false';
}

export const assetService = {
  async getAll(params: AssetFilterParams = {}): Promise<PaginatedResponse<Asset>> {
    const response = await api.get('/assets', { params });
    return response.data;
  },

  async create(data: {
    categoryId: number;
    name: string;
    sku?: string;
    description?: string;
    initialStock?: number;
    location?: string;
    status?: string;
  }): Promise<Asset> {
    const response = await api.post('/assets', data);
    return response.data;
  },

  async update(
    id: number,
    data: {
      categoryId: number;
      name: string;
      sku?: string;
      description?: string;
      location?: string;
      status?: string;
    }
  ): Promise<Asset> {
    const response = await api.put(`/assets/${id}`, data);
    return response.data.asset;
  },

  async adjustStock(
    id: number,
    data: {
      changeQty: number;
      changeType: 'ADDITION' | 'DEDUCTION' | 'DAMAGE' | 'AUDIT';
      remarks?: string;
    }
  ): Promise<{ message: string }> {
    const response = await api.post(`/assets/${id}/stock`, data);
    return response.data;
  },

  async delete(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/assets/${id}`);
    return response.data;
  },

  async exportCSV(): Promise<string> {
    const response = await api.get('/assets/export', {
      responseType: 'text',
    });
    return response.data;
  },

  async getGlobalHistory(page: number = 1, limit: number = 10): Promise<PaginatedResponse<StockHistory>> {
    const response = await api.get('/assets/history/logs', {
      params: { page, limit },
    });
    return response.data;
  },

  async getAssetHistory(
    id: number,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<StockHistory>> {
    const response = await api.get(`/assets/${id}/history`, {
      params: { page, limit },
    });
    return response.data;
  },
};
