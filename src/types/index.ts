export interface Room {
  id: number;
  name: string;
  type: string;
  capacity: number;
  price_per_hour: number;
  amenities: string; // SQLite/PG often stores this stringified or JSON array. We handle parsing dynamically.
  image_url: string;
  created_at?: string;
  updated_at?: string;
}

export interface Booking {
  id: number;
  room_id: number;
  customer_name: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  room_name?: string;
  room_type?: string;
  created_at?: string;
}

export interface CreateBookingInput {
  roomId: number;
  customerName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
}

export interface ServerStatus {
  status: string;
  database: string;
  timestamp: string;
}
