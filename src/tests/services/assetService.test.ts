import { describe, it, expect, vi, beforeEach } from 'vitest'
import { assetService } from '../../services/assetService'
import api from '../../services/api'
import { mockAsset, mockAssets, mockStockHistory, mockStockHistories, makePaginatedResponse } from '../fixtures'

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api)

describe('assetService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('should GET /assets with empty params by default', async () => {
      const paginatedData = makePaginatedResponse(mockAssets)
      mockedApi.get.mockResolvedValueOnce({ data: paginatedData })

      const result = await assetService.getAll()

      expect(mockedApi.get).toHaveBeenCalledWith('/assets', { params: {} })
      expect(result).toEqual(paginatedData)
    })

    it('should pass filter params to the request', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: makePaginatedResponse([mockAsset]) })

      await assetService.getAll({ page: 2, limit: 5, search: 'laptop', status: 'Available' })

      expect(mockedApi.get).toHaveBeenCalledWith('/assets', {
        params: { page: 2, limit: 5, search: 'laptop', status: 'Available' },
      })
    })

    it('should pass categoryId and lowStock filters', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: makePaginatedResponse([mockAsset]) })

      await assetService.getAll({ categoryId: 1, lowStock: 'true' })

      expect(mockedApi.get).toHaveBeenCalledWith('/assets', {
        params: { categoryId: 1, lowStock: 'true' },
      })
    })
  })

  describe('create', () => {
    it('should POST /assets with the provided data and return the new asset', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: mockAsset })

      const createData = {
        categoryId: 1,
        name: 'Laptop Dell XPS',
        sku: 'DELL-XPS-001',
        description: 'High performance business laptop',
        initialStock: 10,
        location: 'Room A',
        status: 'Available',
      }

      const result = await assetService.create(createData)

      expect(mockedApi.post).toHaveBeenCalledWith('/assets', createData)
      expect(result).toEqual(mockAsset)
    })

    it('should work with only required fields', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: mockAsset })

      await assetService.create({ categoryId: 1, name: 'Laptop Dell XPS' })

      expect(mockedApi.post).toHaveBeenCalledWith('/assets', { categoryId: 1, name: 'Laptop Dell XPS' })
    })
  })

  describe('update', () => {
    it('should PUT /assets/:id and return the updated asset from response.data.asset', async () => {
      mockedApi.put.mockResolvedValueOnce({ data: { asset: mockAsset } })

      const updateData = { categoryId: 1, name: 'Laptop Dell XPS Updated', status: 'Maintenance' }
      const result = await assetService.update(1, updateData)

      expect(mockedApi.put).toHaveBeenCalledWith('/assets/1', updateData)
      expect(result).toEqual(mockAsset)
    })
  })

  describe('adjustStock', () => {
    it('should POST /assets/:id/stock with ADDITION change type', async () => {
      const responseData = { message: 'Stock adjusted successfully' }
      mockedApi.post.mockResolvedValueOnce({ data: responseData })

      const adjustData = { changeQty: 5, changeType: 'ADDITION' as const, remarks: 'Restocked' }
      const result = await assetService.adjustStock(1, adjustData)

      expect(mockedApi.post).toHaveBeenCalledWith('/assets/1/stock', adjustData)
      expect(result).toEqual(responseData)
    })

    it('should POST /assets/:id/stock with DEDUCTION change type', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: { message: 'Stock deducted' } })

      await assetService.adjustStock(1, { changeQty: 2, changeType: 'DEDUCTION' })

      expect(mockedApi.post).toHaveBeenCalledWith('/assets/1/stock', {
        changeQty: 2,
        changeType: 'DEDUCTION',
      })
    })

    it('should POST /assets/:id/stock with DAMAGE change type', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: { message: 'Damage recorded' } })

      await assetService.adjustStock(1, { changeQty: 1, changeType: 'DAMAGE', remarks: 'Dropped' })

      expect(mockedApi.post).toHaveBeenCalledWith('/assets/1/stock', {
        changeQty: 1,
        changeType: 'DAMAGE',
        remarks: 'Dropped',
      })
    })
  })

  describe('delete', () => {
    it('should DELETE /assets/:id and return the confirmation message', async () => {
      const responseData = { message: 'Asset deleted successfully' }
      mockedApi.delete.mockResolvedValueOnce({ data: responseData })

      const result = await assetService.delete(1)

      expect(mockedApi.delete).toHaveBeenCalledWith('/assets/1')
      expect(result).toEqual(responseData)
    })
  })

  describe('exportCSV', () => {
    it('should GET /assets/export with responseType text and return raw CSV', async () => {
      const csvData = 'id,name,sku\n1,Laptop Dell XPS,DELL-XPS-001'
      mockedApi.get.mockResolvedValueOnce({ data: csvData })

      const result = await assetService.exportCSV()

      expect(mockedApi.get).toHaveBeenCalledWith('/assets/export', { responseType: 'text' })
      expect(result).toBe(csvData)
    })
  })

  describe('getGlobalHistory', () => {
    it('should GET /assets/history with default pagination', async () => {
      const paginatedData = makePaginatedResponse(mockStockHistories)
      mockedApi.get.mockResolvedValueOnce({ data: paginatedData })

      const result = await assetService.getGlobalHistory()

      expect(mockedApi.get).toHaveBeenCalledWith('/assets/history', { params: { page: 1, limit: 10 } })
      expect(result).toEqual(paginatedData)
    })

    it('should pass custom page and limit', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: makePaginatedResponse([mockStockHistory]) })

      await assetService.getGlobalHistory(3, 5)

      expect(mockedApi.get).toHaveBeenCalledWith('/assets/history', { params: { page: 3, limit: 5 } })
    })
  })

  describe('getAssetHistory', () => {
    it('should GET /assets/:id/history for a specific asset', async () => {
      const paginatedData = makePaginatedResponse(mockStockHistories)
      mockedApi.get.mockResolvedValueOnce({ data: paginatedData })

      const result = await assetService.getAssetHistory(1, 1, 10)

      expect(mockedApi.get).toHaveBeenCalledWith('/assets/1/history', { params: { page: 1, limit: 10 } })
      expect(result).toEqual(paginatedData)
    })
  })
})
