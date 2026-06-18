import api from './api';
import { Room, ServerStatus } from '../types';

export const roomService = {
  getStatus: async (): Promise<ServerStatus> => {
    const response = await api.get<ServerStatus>('/status');
    return response.data;
  },
  
  getRooms: async (): Promise<Room[]> => {
    const response = await api.get<Room[]>('/rooms');
    return response.data;
  },
};
