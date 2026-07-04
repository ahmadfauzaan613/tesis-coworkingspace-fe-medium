import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useAssignments } from '../../hooks/useAssignments'
import { assignmentService } from '../../services/assignmentService'
import { mockAssignment, mockAssignments, makePaginatedResponse } from '../fixtures'

vi.mock('../../services/assignmentService', () => ({
  assignmentService: {
    getAll: vi.fn(),
    create: vi.fn(),
    returnAsset: vi.fn(),
  },
}))

const mockedAssignmentService = vi.mocked(assignmentService)

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

describe('useAssignments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return isLoading true while data is being fetched', () => {
    mockedAssignmentService.getAll.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useAssignments(), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(true)
  })

  it('should return paginated assignments after a successful fetch', async () => {
    const paginatedData = makePaginatedResponse(mockAssignments)
    mockedAssignmentService.getAll.mockResolvedValueOnce(paginatedData)

    const { result } = renderHook(() => useAssignments(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.assignmentsData).toEqual(paginatedData)
    expect(result.current.assignmentsData?.data).toHaveLength(2)
  })

  it('should call getAll with page and limit params', async () => {
    mockedAssignmentService.getAll.mockResolvedValueOnce(makePaginatedResponse([mockAssignment]))

    renderHook(() => useAssignments(3, 20), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(mockedAssignmentService.getAll).toHaveBeenCalledWith(3, 20)
    })
  })

  it('should call assignmentService.create when checkoutAsset is invoked', async () => {
    mockedAssignmentService.getAll.mockResolvedValue(makePaginatedResponse(mockAssignments))
    mockedAssignmentService.create.mockResolvedValueOnce(mockAssignment)

    const { result } = renderHook(() => useAssignments(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const checkoutData = { assetId: 1, assignedTo: 'John Doe', quantity: 1 }
    await act(async () => {
      await result.current.checkoutAsset(checkoutData)
    })

    expect(mockedAssignmentService.create).toHaveBeenCalledWith(checkoutData)
  })

  it('should call assignmentService.returnAsset when returnAsset is invoked', async () => {
    mockedAssignmentService.getAll.mockResolvedValue(makePaginatedResponse(mockAssignments))
    mockedAssignmentService.returnAsset.mockResolvedValueOnce({ message: 'Asset returned' })

    const { result } = renderHook(() => useAssignments(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.returnAsset(1)
    })

    expect(mockedAssignmentService.returnAsset).toHaveBeenCalledWith(1)
  })

  it('should expose error state when the query fails', async () => {
    mockedAssignmentService.getAll.mockRejectedValueOnce(new Error('Failed to fetch'))

    const { result } = renderHook(() => useAssignments(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.error).toBeTruthy())
  })

  it('should expose isCheckingOut false when not in a checkout mutation', () => {
    mockedAssignmentService.getAll.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useAssignments(), { wrapper: createWrapper() })

    expect(result.current.isCheckingOut).toBe(false)
  })

  it('should expose isReturning false when not in a return mutation', () => {
    mockedAssignmentService.getAll.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useAssignments(), { wrapper: createWrapper() })

    expect(result.current.isReturning).toBe(false)
  })
})
