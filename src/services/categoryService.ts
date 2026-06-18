import api from './api';
import { Category, PaginatedResponse } from '../types';

export const categoryService = {
  async getAll(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Category>> {
    const response = await api.get('/categories', {
      params: { page, limit },
    });
    return response.data;
  },

  async create(data: { name: string; description?: string }): Promise<Category> {
    const response = await api.post('/categories', data);
    return response.data;
  },

  async update(id: number, data: { name: string; description?: string }): Promise<Category> {
    const response = await api.put(`/categories/${id}`, data);
    return response.data.category;
  },

  async delete(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};
