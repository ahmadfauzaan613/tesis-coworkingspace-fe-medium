import { useBookings } from '../../hooks/useBookings';
import { Calendar, Clock, User, Building, AlertCircle } from 'lucide-react';

export function BookingList() {
  const { data: bookings, isLoading, error } = useBookings();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((n) => (
          <div key={n} className="bg-slate-900/20 border border-slate-900 p-5 rounded-2xl animate-pulse h-20 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 bg-rose-950/20 border border-rose-900/50 p-4 rounded-xl text-rose-400 text-xs">
        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
        <span>Failed to fetch bookings. Database is likely offline or migration pending.</span>
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-900/20 border border-slate-900 rounded-2xl text-slate-500 text-xs font-light">
        No bookings found in PostgreSQL. Use the booking form to make a reservation!
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
      {bookings.map((booking) => {
        // Format the database date neatly
        let formattedDate = '';
        try {
          formattedDate = new Date(booking.booking_date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });
        } catch (e) {
          formattedDate = booking.booking_date;
        }

        return (
          <div key={booking.id} className="bg-slate-900/20 border border-slate-900 p-4 rounded-2xl hover:border-slate-800/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <User className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-bold text-sm text-white">{booking.customer_name}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400 font-light">
                <Building className="w-3.5 h-3.5 text-indigo-400" />
                <span>{booking.room_name} ({booking.room_type})</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-light">
              <div className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                <span>{booking.start_time} - {booking.end_time}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
