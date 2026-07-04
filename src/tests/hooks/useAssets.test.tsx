import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useAssets, useStockHistory } from '../../hooks/useAssets'
import { assetService } from '../../services/assetService'
import { mockAsset, mockAssets, mockStockHistories, makePaginatedResponse } from '../fixtures'

vi.mock('../../services/assetService', () => ({
  assetService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    adjustStock: vi.fn(),
    delete: vi.fn(),
    exportCSV: vi.fn(),
    getGlobalHistory: vi.fn(),
    getAssetHistory: vi.fn(),
  },
}))

const mockedAssetService = vi.mocked(assetService)

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

describe('useAssets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return isLoading true while data is being fetched', () => {
    mockedAssetService.getAll.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useAssets(), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.assetsData).toBeUndefined()
  })

  it('should return paginated assets data after successful fetch', async () => {
    const paginatedData = makePaginatedResponse(mockAssets)
    mockedAssetService.getAll.mockResolvedValueOnce(paginatedData)

    const { result } = renderHook(() => useAssets(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.assetsData).toEqual(paginatedData)
    expect(result.current.assetsData?.data).toHaveLength(2)
  })

  it('should pass filter params to the service', async () => {
    mockedAssetService.getAll.mockResolvedValueOnce(makePaginatedResponse([mockAsset]))

    const { result } = renderHook(() => useAssets({ page: 2, search: 'laptop' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(mockedAssetService.getAll).toHaveBeenCalledWith({ page: 2, search: 'laptop' })
  })

  it('should call assetService.create when createAsset is invoked', async () => {
    mockedAssetService.getAll.mockResolvedValue(makePaginatedResponse(mockAssets))
    mockedAssetService.create.mockResolvedValueOnce(mockAsset)

    const { result } = renderHook(() => useAssets(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.createAsset({
        categoryId: 1,
        name: 'Laptop Dell XPS',
        sku: 'DELL-XPS-001',
        initialStock: 10,
      })
    })

    expect(mockedAssetService.create).toHaveBeenCalledWith({
      categoryId: 1,
      name: 'Laptop Dell XPS',
      sku: 'DELL-XPS-001',
      initialStock: 10,
    })
  })

  it('should call assetService.update when updateAsset is invoked', async () => {
    mockedAssetService.getAll.mockResolvedValue(makePaginatedResponse(mockAssets))
    mockedAssetService.update.mockResolvedValueOnce(mockAsset)

    const { result } = renderHook(() => useAssets(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const updateData = { categoryId: 1, name: 'Updated Laptop', status: 'Maintenance' }
    await act(async () => {
      await result.current.updateAsset({ id: 1, data: updateData })
    })

    expect(mockedAssetService.update).toHaveBeenCalledWith(1, updateData)
  })

  it('should call assetService.adjustStock when adjustStock is invoked', async () => {
    mockedAssetService.getAll.mockResolvedValue(makePaginatedResponse(mockAssets))
    mockedAssetService.adjustStock.mockResolvedValueOnce({ message: 'Stock adjusted' })

    const { result } = renderHook(() => useAssets(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const adjustData = { changeQty: 5, changeType: 'ADDITION' as const, remarks: 'Restock' }
    await act(async () => {
      await result.current.adjustStock({ id: 1, data: adjustData })
    })

    expect(mockedAssetService.adjustStock).toHaveBeenCalledWith(1, adjustData)
  })

  it('should call assetService.delete when deleteAsset is invoked', async () => {
    mockedAssetService.getAll.mockResolvedValue(makePaginatedResponse(mockAssets))
    mockedAssetService.delete.mockResolvedValueOnce({ message: 'Deleted' })

    const { result } = renderHook(() => useAssets(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.deleteAsset(1)
    })

    expect(mockedAssetService.delete).toHaveBeenCalledWith(1)
  })

  it('should expose error state when the query fails', async () => {
    const error = new Error('Failed to fetch assets')
    mockedAssetService.getAll.mockRejectedValueOnce(error)

    const { result } = renderHook(() => useAssets(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.error).toBeTruthy())

    expect(result.current.assetsData).toBeUndefined()
  })
})

describe('useStockHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call getGlobalHistory when no assetId is provided', async () => {
    const paginatedData = makePaginatedResponse(mockStockHistories)
    mockedAssetService.getGlobalHistory.mockResolvedValueOnce(paginatedData)

    const { result } = renderHook(() => useStockHistory(1, 10), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(mockedAssetService.getGlobalHistory).toHaveBeenCalledWith(1, 10)
    expect(result.current.data).toEqual(paginatedData)
  })

  it('should call getAssetHistory when an assetId is provided', async () => {
    const paginatedData = makePaginatedResponse(mockStockHistories)
    mockedAssetService.getAssetHistory.mockResolvedValueOnce(paginatedData)

    const { result } = renderHook(() => useStockHistory(1, 10, 1), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(mockedAssetService.getAssetHistory).toHaveBeenCalledWith(1, 1, 10)
    expect(result.current.data).toEqual(paginatedData)
  })
})
