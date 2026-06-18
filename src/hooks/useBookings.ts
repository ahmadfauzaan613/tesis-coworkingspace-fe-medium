import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../services/bookingService';
import { CreateBookingInput } from '../types';

export function useBookings() {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: bookingService.getBookings,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: CreateBookingInput) => bookingService.createBooking(input),
    onSuccess: () => {
      // Automatically refresh bookings query cache on new booking creation
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
