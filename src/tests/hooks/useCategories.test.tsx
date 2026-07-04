import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useCategories } from '../../hooks/useCategories'
import { categoryService } from '../../services/categoryService'
import { mockCategory, mockCategories, makePaginatedResponse } from '../fixtures'

vi.mock('../../services/categoryService', () => ({
  categoryService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockedCategoryService = vi.mocked(categoryService)

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

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return isLoading true initially', () => {
    mockedCategoryService.getAll.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(true)
  })

  it('should return paginated categories after a successful fetch', async () => {
    const paginatedData = makePaginatedResponse(mockCategories)
    mockedCategoryService.getAll.mockResolvedValueOnce(paginatedData)

    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.categoriesData).toEqual(paginatedData)
    expect(result.current.categoriesData?.data).toHaveLength(2)
  })

  it('should call getAll with page and limit params', async () => {
    mockedCategoryService.getAll.mockResolvedValueOnce(makePaginatedResponse([mockCategory]))

    renderHook(() => useCategories(2, 5), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(mockedCategoryService.getAll).toHaveBeenCalledWith(2, 5)
    })
  })

  it('should call categoryService.create when createCategory is invoked', async () => {
    mockedCategoryService.getAll.mockResolvedValue(makePaginatedResponse(mockCategories))
    mockedCategoryService.create.mockResolvedValueOnce(mockCategory)

    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.createCategory({ name: 'Electronics', description: 'Electronic devices' })
    })

    expect(mockedCategoryService.create).toHaveBeenCalledWith({
      name: 'Electronics',
      description: 'Electronic devices',
    })
  })

  it('should call categoryService.update when updateCategory is invoked', async () => {
    mockedCategoryService.getAll.mockResolvedValue(makePaginatedResponse(mockCategories))
    mockedCategoryService.update.mockResolvedValueOnce(mockCategory)

    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.updateCategory({ id: 1, data: { name: 'Electronics Updated' } })
    })

    expect(mockedCategoryService.update).toHaveBeenCalledWith(1, { name: 'Electronics Updated' })
  })

  it('should call categoryService.delete when deleteCategory is invoked', async () => {
    mockedCategoryService.getAll.mockResolvedValue(makePaginatedResponse(mockCategories))
    mockedCategoryService.delete.mockResolvedValueOnce({ message: 'Category deleted' })

    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.deleteCategory(1)
    })

    expect(mockedCategoryService.delete).toHaveBeenCalledWith(1)
  })

  it('should expose error state when the query fails', async () => {
    mockedCategoryService.getAll.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.error).toBeTruthy())
  })
})
