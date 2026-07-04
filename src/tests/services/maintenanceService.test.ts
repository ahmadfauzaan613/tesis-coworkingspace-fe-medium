import { describe, it, expect, vi, beforeEach } from 'vitest'
import { maintenanceService } from '../../services/maintenanceService'
import api from '../../services/api'
import { mockMaintenanceTicket, mockMaintenanceTickets, makePaginatedResponse } from '../fixtures'

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api)

describe('maintenanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('should GET /maintenance with default pagination and no status filter', async () => {
      const paginatedData = makePaginatedResponse(mockMaintenanceTickets)
      mockedApi.get.mockResolvedValueOnce({ data: paginatedData })

      const result = await maintenanceService.getAll()

      expect(mockedApi.get).toHaveBeenCalledWith('/maintenance', {
        params: { status: undefined, page: 1, limit: 10 },
      })
      expect(result).toEqual(paginatedData)
    })

    it('should pass a status filter when provided', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: makePaginatedResponse([mockMaintenanceTicket]) })

      await maintenanceService.getAll('PENDING', 1, 10)

      expect(mockedApi.get).toHaveBeenCalledWith('/maintenance', {
        params: { status: 'PENDING', page: 1, limit: 10 },
      })
    })

    it('should pass RESOLVED status filter', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: makePaginatedResponse([mockMaintenanceTickets[1]]) })

      await maintenanceService.getAll('RESOLVED', 1, 5)

      expect(mockedApi.get).toHaveBeenCalledWith('/maintenance', {
        params: { status: 'RESOLVED', page: 1, limit: 5 },
      })
    })

    it('should return paginated ticket list', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: makePaginatedResponse(mockMaintenanceTickets) })

      const result = await maintenanceService.getAll()

      expect(result.data).toHaveLength(2)
      expect(result.data[0].status).toBe('PENDING')
    })
  })

  describe('create', () => {
    it('should POST /maintenance and return the created ticket', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: mockMaintenanceTicket })

      const createData = {
        assetId: 1,
        issueDescription: 'Screen flickering intermittently',
        assetStatus: 'Maintenance' as const,
      }
      const result = await maintenanceService.create(createData)

      expect(mockedApi.post).toHaveBeenCalledWith('/maintenance', createData)
      expect(result).toEqual(mockMaintenanceTicket)
    })

    it('should work with Broken asset status', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: mockMaintenanceTicket })

      await maintenanceService.create({
        assetId: 1,
        issueDescription: 'Completely broken',
        assetStatus: 'Broken',
      })

      expect(mockedApi.post).toHaveBeenCalledWith('/maintenance', {
        assetId: 1,
        issueDescription: 'Completely broken',
        assetStatus: 'Broken',
      })
    })

    it('should work without an assetStatus', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: mockMaintenanceTicket })

      await maintenanceService.create({ assetId: 1, issueDescription: 'Minor issue' })

      expect(mockedApi.post).toHaveBeenCalledWith('/maintenance', {
        assetId: 1,
        issueDescription: 'Minor issue',
      })
    })
  })

  describe('resolveTicket', () => {
    it('should POST /maintenance/:id/resolve with repair data', async () => {
      const responseData = { message: 'Ticket resolved successfully' }
      mockedApi.post.mockResolvedValueOnce({ data: responseData })

      const resolveData = {
        repairCost: 150000,
        vendorName: 'Fix-It Workshop',
        restoreAssetStatus: true,
      }
      const result = await maintenanceService.resolveTicket(1, resolveData)

      expect(mockedApi.post).toHaveBeenCalledWith('/maintenance/1/resolve', resolveData)
      expect(result).toEqual(responseData)
    })

    it('should work with only repairCost (no vendor or restore flag)', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: { message: 'Resolved' } })

      await maintenanceService.resolveTicket(2, { repairCost: 0 })

      expect(mockedApi.post).toHaveBeenCalledWith('/maintenance/2/resolve', { repairCost: 0 })
    })
  })
})
