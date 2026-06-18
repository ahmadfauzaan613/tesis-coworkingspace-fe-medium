import api from './api';
import { AssetAssignment, PaginatedResponse } from '../types';

export const assignmentService = {
  async getAll(page: number = 1, limit: number = 10): Promise<PaginatedResponse<AssetAssignment>> {
    const response = await api.get('/assignments', {
      params: { page, limit },
    });
    return response.data;
  },

  async create(data: {
    assetId: number;
    assignedTo: string;
    quantity: number;
  }): Promise<AssetAssignment> {
    const response = await api.post('/assignments', data);
    return response.data;
  },

  async returnAsset(id: number): Promise<{ message: string }> {
    const response = await api.post(`/assignments/${id}/return`);
    return response.data;
  },
};
