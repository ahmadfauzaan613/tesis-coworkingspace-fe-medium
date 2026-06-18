import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { User } from '../types';

export function useAuth() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());

  const { data: profile, isLoading, refetch, error } = useQuery({
    queryKey: ['me'],
    queryFn: authService.getMe,
    enabled: authService.isAuthenticated(),
    retry: false,
  });

  // Keep state in sync with fetched profile
  useEffect(() => {
    if (profile) {
      setUser(profile);
    } else if (error) {
      authService.logout();
      setUser(null);
    }
  }, [profile, error]);

  const loginMutation = useMutation({
    mutationFn: ({ username, password }: any) => authService.login(username, password),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    }
  });

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    queryClient.clear();
  };

  return {
    user,
    isAuthenticated: !!user && authService.isAuthenticated(),
    isLoadingProfile: isLoading,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout: handleLogout,
    refetchProfile: refetch
  };
}
