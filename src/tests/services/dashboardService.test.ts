import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dashboardService } from '../../services/dashboardService'
import api from '../../services/api'
import { mockDashboardStats } from '../fixtures'

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api)

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getStats', () => {
    it('should GET /dashboard/stats and return the stats object', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: mockDashboardStats })

      const result = await dashboardService.getStats()

      expect(mockedApi.get).toHaveBeenCalledWith('/dashboard/stats')
      expect(result).toEqual(mockDashboardStats)
    })

    it('should return correct total counts', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: mockDashboardStats })

      const result = await dashboardService.getStats()

      expect(result.totalAssets).toBe(2)
      expect(result.totalCategories).toBe(2)
      expect(result.outOfStock).toBe(0)
      expect(result.lowStockCount).toBe(1)
      expect(result.brokenAssets).toBe(0)
    })

    it('should return category breakdown and low stock alerts', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: mockDashboardStats })

      const result = await dashboardService.getStats()

      expect(result.categoryBreakdown).toHaveLength(2)
      expect(result.lowStockAlerts).toHaveLength(1)
      expect(result.lowStockAlerts[0].name).toBe('Office Chair')
    })

    it('should return recent activities', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: mockDashboardStats })

      const result = await dashboardService.getStats()

      expect(result.recentActivities).toHaveLength(1)
      expect(result.recentActivities[0].change_type).toBe('INITIAL')
    })

    it('should throw when the API call fails', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('Server Error'))

      await expect(dashboardService.getStats()).rejects.toThrow('Server Error')
    })
  })
})
