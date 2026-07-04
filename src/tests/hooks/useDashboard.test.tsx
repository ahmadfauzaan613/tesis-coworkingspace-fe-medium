import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useDashboard } from '../../hooks/useDashboard'
import { dashboardService } from '../../services/dashboardService'
import { mockDashboardStats } from '../fixtures'

vi.mock('../../services/dashboardService', () => ({
  dashboardService: {
    getStats: vi.fn(),
  },
}))

const mockedDashboardService = vi.mocked(dashboardService)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
    },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return isLoading true while data is being fetched', () => {
    mockedDashboardService.getStats.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.stats).toBeUndefined()
  })

  it('should return stats after a successful fetch', async () => {
    mockedDashboardService.getStats.mockResolvedValueOnce(mockDashboardStats)

    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.stats).toEqual(mockDashboardStats)
  })

  it('should return correct total asset count', async () => {
    mockedDashboardService.getStats.mockResolvedValueOnce(mockDashboardStats)

    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.stats?.totalAssets).toBe(2)
    expect(result.current.stats?.totalCategories).toBe(2)
  })

  it('should return category breakdown and low stock alerts', async () => {
    mockedDashboardService.getStats.mockResolvedValueOnce(mockDashboardStats)

    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.stats?.categoryBreakdown).toHaveLength(2)
    expect(result.current.stats?.lowStockAlerts).toHaveLength(1)
    expect(result.current.stats?.lowStockAlerts[0].name).toBe('Office Chair')
  })

  it('should expose an error state when the query fails', async () => {
    mockedDashboardService.getStats.mockRejectedValueOnce(new Error('Failed to load stats'))

    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.error).toBeTruthy())

    expect(result.current.stats).toBeUndefined()
  })

  it('should expose a refetch function', async () => {
    mockedDashboardService.getStats.mockResolvedValue(mockDashboardStats)

    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(typeof result.current.refetch).toBe('function')
  })
})
