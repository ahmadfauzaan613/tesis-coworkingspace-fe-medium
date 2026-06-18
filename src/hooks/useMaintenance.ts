import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceService } from '../services/maintenanceService';

export function useMaintenance(status?: string, page: number = 1, limit: number = 10) {
  const queryClient = useQueryClient();

  const maintenanceQuery = useQuery({
    queryKey: ['maintenance', status, page, limit],
    queryFn: () => maintenanceService.getAll(status || undefined, page, limit),
  });

  const logTicketMutation = useMutation({
    mutationFn: (data: {
      assetId: number;
      issueDescription: string;
      assetStatus?: 'Broken' | 'Maintenance';
    }) => maintenanceService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    }
  });

  const resolveTicketMutation = useMutation({
    mutationFn: ({
      id,
      data
    }: {
      id: number;
      data: {
        repairCost: number;
        vendorName?: string;
        restoreAssetStatus?: boolean;
      };
    }) => maintenanceService.resolveTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    }
  });

  return {
    ticketsData: maintenanceQuery.data,
    isLoading: maintenanceQuery.isLoading,
    error: maintenanceQuery.error,
    refetch: maintenanceQuery.refetch,

    logTicket: logTicketMutation.mutateAsync,
    isLoggingTicket: logTicketMutation.isPending,
    logError: logTicketMutation.error,

    resolveTicket: resolveTicketMutation.mutateAsync,
    isResolvingTicket: resolveTicketMutation.isPending,
    resolveError: resolveTicketMutation.error,
  };
}
