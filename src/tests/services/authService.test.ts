import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authService } from '../../services/authService'
import api from '../../services/api'
import { mockUser } from '../fixtures'

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api)

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('should POST to /auth/login and store token and user in localStorage', async () => {
      const responseData = { token: 'test-jwt-token', user: mockUser }
      mockedApi.post.mockResolvedValueOnce({ data: responseData })

      const result = await authService.login('admin', 'password123')

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', {
        username: 'admin',
        password: 'password123',
      })
      expect(localStorage.getItem('token')).toBe('test-jwt-token')
      expect(JSON.parse(localStorage.getItem('user')!)).toEqual(mockUser)
      expect(result).toEqual(responseData)
    })

    it('should remove preventAutoLogin from sessionStorage on successful login', async () => {
      sessionStorage.setItem('preventAutoLogin', 'true')
      mockedApi.post.mockResolvedValueOnce({
        data: { token: 'test-jwt-token', user: mockUser },
      })

      await authService.login('admin', 'password123')

      expect(sessionStorage.getItem('preventAutoLogin')).toBeNull()
    })

    it('should not store token if response has no token field', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: { message: 'Invalid credentials' } })

      await authService.login('admin', 'wrong-password')

      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
    })

    it('should throw when the API call rejects', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Network Error'))

      await expect(authService.login('admin', 'password123')).rejects.toThrow('Network Error')
    })
  })

  describe('getMe', () => {
    it('should GET /auth/me and return user data', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: mockUser })

      const result = await authService.getMe()

      expect(mockedApi.get).toHaveBeenCalledWith('/auth/me')
      expect(result).toEqual(mockUser)
    })
  })

  describe('logout', () => {
    it('should remove token and user from localStorage and set preventAutoLogin', () => {
      localStorage.setItem('token', 'test-jwt-token')
      localStorage.setItem('user', JSON.stringify(mockUser))

      authService.logout()

      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
      expect(sessionStorage.getItem('preventAutoLogin')).toBe('true')
    })

    it('should work even when localStorage is already empty', () => {
      expect(() => authService.logout()).not.toThrow()
      expect(sessionStorage.getItem('preventAutoLogin')).toBe('true')
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when a token exists in localStorage', () => {
      localStorage.setItem('token', 'test-jwt-token')
      expect(authService.isAuthenticated()).toBe(true)
    })

    it('should return false when no token exists', () => {
      expect(authService.isAuthenticated()).toBe(false)
    })
  })

  describe('getCurrentUser', () => {
    it('should return the parsed user object from localStorage', () => {
      localStorage.setItem('user', JSON.stringify(mockUser))
      expect(authService.getCurrentUser()).toEqual(mockUser)
    })

    it('should return null when no user is stored', () => {
      expect(authService.getCurrentUser()).toBeNull()
    })

    it('should return null when stored user JSON is malformed', () => {
      localStorage.setItem('user', '{invalid-json}')
      expect(authService.getCurrentUser()).toBeNull()
    })
  })
})
