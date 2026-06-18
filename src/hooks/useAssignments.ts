import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentService } from '../services/assignmentService';

export function useAssignments(page: number = 1, limit: number = 10) {
  const queryClient = useQueryClient();

  const assignmentsQuery = useQuery({
    queryKey: ['assignments', page, limit],
    queryFn: () => assignmentService.getAll(page, limit),
  });

  const checkoutMutation = useMutation({
    mutationFn: (data: { assetId: number; assignedTo: string; quantity: number }) =>
      assignmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    }
  });

  const returnMutation = useMutation({
    mutationFn: (id: number) => assignmentService.returnAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    }
  });

  return {
    assignmentsData: assignmentsQuery.data,
    isLoading: assignmentsQuery.isLoading,
    error: assignmentsQuery.error,
    refetch: assignmentsQuery.refetch,

    checkoutAsset: checkoutMutation.mutateAsync,
    isCheckingOut: checkoutMutation.isPending,
    checkoutError: checkoutMutation.error,

    returnAsset: returnMutation.mutateAsync,
    isReturning: returnMutation.isPending,
    returnError: returnMutation.error,
  };
}
