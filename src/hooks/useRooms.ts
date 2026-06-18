import { useQuery } from '@tanstack/react-query';
import { roomService } from '../services/roomService';

export function useRooms() {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: roomService.getRooms,
  });
}

export function useServerStatus() {
  return useQuery({
    queryKey: ['serverStatus'],
    queryFn: roomService.getStatus,
    refetchInterval: 5000,
    retry: 1,
  });
}
