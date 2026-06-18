import api from './api';
import { MaintenanceTicket, PaginatedResponse } from '../types';

export const maintenanceService = {
  async getAll(
    status?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<MaintenanceTicket>> {
    const response = await api.get('/maintenance', {
      params: { status, page, limit },
    });
    return response.data;
  },

  async create(data: {
    assetId: number;
    issueDescription: string;
    assetStatus?: 'Broken' | 'Maintenance';
  }): Promise<MaintenanceTicket> {
    const response = await api.post('/maintenance', data);
    return response.data;
  },

  async resolveTicket(
    id: number,
    data: {
      repairCost: number;
      vendorName?: string;
      restoreAssetStatus?: boolean;
    }
  ): Promise<{ message: string }> {
    const response = await api.post(`/maintenance/${id}/resolve`, data);
    return response.data;
  },
};
