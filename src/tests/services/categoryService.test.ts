import { describe, it, expect, vi, beforeEach } from 'vitest'
import { categoryService } from '../../services/categoryService'
import api from '../../services/api'
import { mockCategory, mockCategories, makePaginatedResponse } from '../fixtures'

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api)

describe('categoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('should GET /categories with default pagination params', async () => {
      const paginatedData = makePaginatedResponse(mockCategories)
      mockedApi.get.mockResolvedValueOnce({ data: paginatedData })

      const result = await categoryService.getAll()

      expect(mockedApi.get).toHaveBeenCalledWith('/categories', { params: { page: 1, limit: 10 } })
      expect(result).toEqual(paginatedData)
    })

    it('should pass custom page and limit', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: makePaginatedResponse([mockCategory]) })

      await categoryService.getAll(2, 5)

      expect(mockedApi.get).toHaveBeenCalledWith('/categories', { params: { page: 2, limit: 5 } })
    })

    it('should return the paginated category list', async () => {
      const paginatedData = makePaginatedResponse(mockCategories)
      mockedApi.get.mockResolvedValueOnce({ data: paginatedData })

      const result = await categoryService.getAll()

      expect(result.data).toHaveLength(2)
      expect(result.data[0]).toEqual(mockCategory)
    })
  })

  describe('create', () => {
    it('should POST /categories with name and description', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: mockCategory })

      const createData = { name: 'Electronics', description: 'Electronic devices and accessories' }
      const result = await categoryService.create(createData)

      expect(mockedApi.post).toHaveBeenCalledWith('/categories', createData)
      expect(result).toEqual(mockCategory)
    })

    it('should work with only a name (no description)', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: mockCategory })

      await categoryService.create({ name: 'Electronics' })

      expect(mockedApi.post).toHaveBeenCalledWith('/categories', { name: 'Electronics' })
    })
  })

  describe('update', () => {
    it('should PUT /categories/:id and return updated category from response.data.category', async () => {
      mockedApi.put.mockResolvedValueOnce({ data: { category: mockCategory } })

      const updateData = { name: 'Electronics Updated', description: 'Updated description' }
      const result = await categoryService.update(1, updateData)

      expect(mockedApi.put).toHaveBeenCalledWith('/categories/1', updateData)
      expect(result).toEqual(mockCategory)
    })
  })

  describe('delete', () => {
    it('should DELETE /categories/:id and return the confirmation message', async () => {
      const responseData = { message: 'Category deleted successfully' }
      mockedApi.delete.mockResolvedValueOnce({ data: responseData })

      const result = await categoryService.delete(1)

      expect(mockedApi.delete).toHaveBeenCalledWith('/categories/1')
      expect(result).toEqual(responseData)
    })
  })
})
