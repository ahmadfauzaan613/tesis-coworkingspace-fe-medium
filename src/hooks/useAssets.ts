import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetService, AssetFilterParams } from '../services/assetService';

export function useAssets(filterParams: AssetFilterParams = {}) {
  const queryClient = useQueryClient();

  const assetsQuery = useQuery({
    queryKey: ['assets', filterParams],
    queryFn: () => assetService.getAll(filterParams),
  });

  const createMutation = useMutation({
    mutationFn: (data: {
      categoryId: number;
      name: string;
      sku?: string;
      description?: string;
      initialStock?: number;
      location?: string;
      status?: string;
    }) => assetService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => assetService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    }
  });

  const adjustStockMutation = useMutation({
    mutationFn: ({
      id,
      data
    }: {
      id: number;
      data: {
        changeQty: number;
        changeType: 'ADDITION' | 'DEDUCTION' | 'DAMAGE' | 'AUDIT';
        remarks?: string;
      };
    }) => assetService.adjustStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['globalHistory'] });
      queryClient.invalidateQueries({ queryKey: ['assetHistory'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => assetService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    }
  });

  return {
    assetsData: assetsQuery.data,
    isLoading: assetsQuery.isLoading,
    error: assetsQuery.error,
    refetch: assetsQuery.refetch,

    createAsset: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    updateAsset: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    adjustStock: adjustStockMutation.mutateAsync,
    isAdjusting: adjustStockMutation.isPending,
    adjustError: adjustStockMutation.error,

    deleteAsset: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  };
}

export function useStockHistory(page: number = 1, limit: number = 10, assetId?: number) {
  return useQuery({
    queryKey: assetId ? ['assetHistory', assetId, page, limit] : ['globalHistory', page, limit],
    queryFn: () => assetId 
      ? assetService.getAssetHistory(assetId, page, limit) 
      : assetService.getGlobalHistory(page, limit),
  });
}
