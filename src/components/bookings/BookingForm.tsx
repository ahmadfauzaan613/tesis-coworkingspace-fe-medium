import { useState, useEffect } from 'react';
import { useCreateBooking } from '../../hooks/useBookings';
import { useRooms } from '../../hooks/useRooms';
import { Room } from '../../types';
import { Button } from '../ui/button';
import { Calendar, Clock, User, CheckCircle2, AlertCircle } from 'lucide-react';

interface BookingFormProps {
  selectedRoom: Room | null;
  onClearSelection: () => void;
}

export function BookingForm({ selectedRoom, onClearSelection }: BookingFormProps) {
  const { data: rooms } = useRooms();
  const createBookingMutation = useCreateBooking();

  const [roomId, setRoomId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state if a room was selected from a RoomCard
  useEffect(() => {
    if (selectedRoom) {
      setRoomId(selectedRoom.id.toString());
    }
  }, [selectedRoom]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!roomId || !customerName || !bookingDate || !startTime || !endTime) {
      setErrorMsg('Please fill in all form fields');
      return;
    }

    createBookingMutation.mutate({
      roomId: parseInt(roomId, 10),
      customerName,
      bookingDate,
      startTime,
      endTime
    }, {
      onSuccess: (data) => {
        setSuccessMsg(`Room successfully booked for ${customerName}!`);
        setCustomerName('');
        // Clear selection parent state
        onClearSelection();
        setRoomId('');
        // Auto fade success message
        setTimeout(() => setSuccessMsg(''), 5000);
      },
      onError: (err: any) => {
        setErrorMsg(err.response?.data?.error || 'Database is offline or booking failed.');
      }
    });
  };

  return (
    <div className="bg-slate-900/40 border border-slate-900 p-8 rounded-3xl space-y-6">
      <div>
        <h3 className="font-extrabold text-xl text-white">Book a Workspace</h3>
        <p className="text-slate-400 text-xs mt-1 font-light">
          Reserve a space for your meetings, work sessions, or team workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Room Selection */}
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1.5">Select Room</label>
          <select 
            value={roomId} 
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:border-purple-600 focus:outline-none cursor-pointer"
          >
            <option value="">-- Choose a Workspace Room --</option>
            {rooms?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.type} - Rp {r.price_per_hour.toLocaleString('id-ID')}/hr)
              </option>
            ))}
          </select>
        </div>

        {/* Customer Name */}
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1.5">Customer Name</label>
          <div className="relative">
            <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Enter your name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-slate-100 text-sm focus:border-purple-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Booking Date */}
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1.5">Booking Date</label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input 
              type="date" 
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-slate-100 text-sm focus:border-purple-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Timings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">Start Time</label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input 
                type="time" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-slate-100 text-sm focus:border-purple-600 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">End Time</label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input 
                type="time" 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-slate-100 text-sm focus:border-purple-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="flex items-center space-x-2 bg-emerald-950/30 border border-emerald-900/50 p-3.5 rounded-xl text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center space-x-2 bg-rose-950/30 border border-rose-900/50 p-3.5 rounded-xl text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <Button 
          type="submit" 
          disabled={createBookingMutation.isPending}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2.5 border-0 rounded-xl cursor-pointer shadow-lg shadow-purple-900/20 disabled:opacity-50"
        >
          {createBookingMutation.isPending ? 'Processing booking...' : 'Confirm Space Booking'}
        </Button>
      </form>
    </div>
  );
}
