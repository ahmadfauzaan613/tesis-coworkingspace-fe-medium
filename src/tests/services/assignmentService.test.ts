import { describe, it, expect, vi, beforeEach } from 'vitest'
import { assignmentService } from '../../services/assignmentService'
import api from '../../services/api'
import { mockAssignment, mockAssignments, makePaginatedResponse } from '../fixtures'

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api)

describe('assignmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('should GET /assignments with default pagination', async () => {
      const paginatedData = makePaginatedResponse(mockAssignments)
      mockedApi.get.mockResolvedValueOnce({ data: paginatedData })

      const result = await assignmentService.getAll()

      expect(mockedApi.get).toHaveBeenCalledWith('/assignments', { params: { page: 1, limit: 10 } })
      expect(result).toEqual(paginatedData)
    })

    it('should pass custom page and limit', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: makePaginatedResponse([mockAssignment]) })

      await assignmentService.getAll(2, 20)

      expect(mockedApi.get).toHaveBeenCalledWith('/assignments', { params: { page: 2, limit: 20 } })
    })

    it('should return a list of assignments', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: makePaginatedResponse(mockAssignments) })

      const result = await assignmentService.getAll()

      expect(result.data).toHaveLength(2)
      expect(result.data[0].assigned_to).toBe('John Doe')
    })
  })

  describe('create', () => {
    it('should POST /assignments and return the created assignment', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: mockAssignment })

      const createData = { assetId: 1, assignedTo: 'John Doe', quantity: 1 }
      const result = await assignmentService.create(createData)

      expect(mockedApi.post).toHaveBeenCalledWith('/assignments', createData)
      expect(result).toEqual(mockAssignment)
    })

    it('should allow assigning multiple units', async () => {
      const multiAssignment = { ...mockAssignment, quantity: 3 }
      mockedApi.post.mockResolvedValueOnce({ data: multiAssignment })

      const createData = { assetId: 1, assignedTo: 'John Doe', quantity: 3 }
      const result = await assignmentService.create(createData)

      expect(result.quantity).toBe(3)
    })
  })

  describe('returnAsset', () => {
    it('should POST /assignments/:id/return and return confirmation', async () => {
      const responseData = { message: 'Asset returned successfully' }
      mockedApi.post.mockResolvedValueOnce({ data: responseData })

      const result = await assignmentService.returnAsset(1)

      expect(mockedApi.post).toHaveBeenCalledWith('/assignments/1/return')
      expect(result).toEqual(responseData)
    })
  })
})
