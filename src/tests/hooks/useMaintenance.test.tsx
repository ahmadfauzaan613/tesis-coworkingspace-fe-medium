import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useMaintenance } from '../../hooks/useMaintenance'
import { maintenanceService } from '../../services/maintenanceService'
import { mockMaintenanceTicket, mockMaintenanceTickets, makePaginatedResponse } from '../fixtures'

vi.mock('../../services/maintenanceService', () => ({
  maintenanceService: {
    getAll: vi.fn(),
    create: vi.fn(),
    resolveTicket: vi.fn(),
  },
}))

const mockedMaintenanceService = vi.mocked(maintenanceService)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useMaintenance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return isLoading true while data is being fetched', () => {
    mockedMaintenanceService.getAll.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useMaintenance(), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(true)
  })

  it('should return paginated tickets after a successful fetch', async () => {
    const paginatedData = makePaginatedResponse(mockMaintenanceTickets)
    mockedMaintenanceService.getAll.mockResolvedValueOnce(paginatedData)

    const { result } = renderHook(() => useMaintenance(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.ticketsData).toEqual(paginatedData)
    expect(result.current.ticketsData?.data).toHaveLength(2)
  })

  it('should call getAll with status filter when provided', async () => {
    mockedMaintenanceService.getAll.mockResolvedValueOnce(
      makePaginatedResponse([mockMaintenanceTicket])
    )

    renderHook(() => useMaintenance('PENDING', 1, 10), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(mockedMaintenanceService.getAll).toHaveBeenCalledWith('PENDING', 1, 10)
    })
  })

  it('should call getAll without status when no filter is provided', async () => {
    mockedMaintenanceService.getAll.mockResolvedValueOnce(
      makePaginatedResponse(mockMaintenanceTickets)
    )

    renderHook(() => useMaintenance(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(mockedMaintenanceService.getAll).toHaveBeenCalledWith(undefined, 1, 10)
    })
  })

  it('should call maintenanceService.create when logTicket is invoked', async () => {
    mockedMaintenanceService.getAll.mockResolvedValue(
      makePaginatedResponse(mockMaintenanceTickets)
    )
    mockedMaintenanceService.create.mockResolvedValueOnce(mockMaintenanceTicket)

    const { result } = renderHook(() => useMaintenance(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const ticketData = {
      assetId: 1,
      issueDescription: 'Screen flickering intermittently',
      assetStatus: 'Maintenance' as const,
    }
    await act(async () => {
      await result.current.logTicket(ticketData)
    })

    expect(mockedMaintenanceService.create).toHaveBeenCalledWith(ticketData)
  })

  it('should call maintenanceService.resolveTicket when resolveTicket is invoked', async () => {
    mockedMaintenanceService.getAll.mockResolvedValue(
      makePaginatedResponse(mockMaintenanceTickets)
    )
    mockedMaintenanceService.resolveTicket.mockResolvedValueOnce({ message: 'Resolved' })

    const { result } = renderHook(() => useMaintenance(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const resolveData = { repairCost: 150000, vendorName: 'Fix-It Workshop', restoreAssetStatus: true }
    await act(async () => {
      await result.current.resolveTicket({ id: 1, data: resolveData })
    })

    expect(mockedMaintenanceService.resolveTicket).toHaveBeenCalledWith(1, resolveData)
  })

  it('should expose error state when the query fails', async () => {
    mockedMaintenanceService.getAll.mockRejectedValueOnce(new Error('Server error'))

    const { result } = renderHook(() => useMaintenance(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.error).toBeTruthy())
  })
})
