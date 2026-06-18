import api from './api';
import { Booking, CreateBookingInput } from '../types';

export const bookingService = {
  getBookings: async (): Promise<Booking[]> => {
    const response = await api.get<Booking[]>('/bookings');
    return response.data;
  },

  createBooking: async (input: CreateBookingInput): Promise<{ message: string; booking: Booking }> => {
    const response = await api.post<{ message: string; booking: Booking }>('/bookings', input);
    return response.data;
  },
};
