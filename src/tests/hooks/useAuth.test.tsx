import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { authService } from '../../services/authService'
import { mockUser } from '../fixtures'

vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    getMe: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}))

const mockedAuthService = vi.mocked(authService)

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

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedAuthService.getCurrentUser.mockReturnValue(null)
    mockedAuthService.isAuthenticated.mockReturnValue(false)
  })

  it('should initialize with no user when not authenticated', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should load user from localStorage on mount when already authenticated', async () => {
    mockedAuthService.getCurrentUser.mockReturnValue(mockUser)
    mockedAuthService.isAuthenticated.mockReturnValue(true)
    mockedAuthService.getMe.mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    expect(result.current.user).toEqual(mockUser)

    await waitFor(() => {
      expect(result.current.isLoadingProfile).toBe(false)
    })
  })

  it('should expose login function that calls authService.login', async () => {
    mockedAuthService.login.mockResolvedValueOnce({ token: 'test-token', user: mockUser })
    mockedAuthService.getMe.mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.login({ username: 'admin', password: 'password123' })
    })

    expect(mockedAuthService.login).toHaveBeenCalledWith('admin', 'password123')
  })

  it('should set user state after a successful login', async () => {
    mockedAuthService.login.mockResolvedValueOnce({ token: 'test-token', user: mockUser })
    mockedAuthService.getMe.mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.login({ username: 'admin', password: 'password123' })
    })

    expect(result.current.user).toEqual(mockUser)
  })

  it('should call authService.logout and clear user state on logout', async () => {
    mockedAuthService.getCurrentUser.mockReturnValue(mockUser)
    mockedAuthService.isAuthenticated.mockReturnValue(true)
    mockedAuthService.getMe.mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoadingProfile).toBe(false))

    act(() => {
      result.current.logout()
    })

    expect(mockedAuthService.logout).toHaveBeenCalled()
    expect(result.current.user).toBeNull()
  })

  it('should expose isLoggingIn as false before a login attempt', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    expect(result.current.isLoggingIn).toBe(false)
  })

  it('should call authService.logout and clear user when getMe returns an error', async () => {
    mockedAuthService.getCurrentUser.mockReturnValue(mockUser)
    mockedAuthService.isAuthenticated.mockReturnValue(true)
    mockedAuthService.getMe.mockRejectedValueOnce(new Error('Unauthorized'))

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.user).toBeNull()
    })

    expect(mockedAuthService.logout).toHaveBeenCalled()
  })
})
