import { Users, MapPin } from 'lucide-react';
import { Room } from '../../types';
import { Button } from '../ui/button';

interface RoomCardProps {
  room: Room;
  onBook: (room: Room) => void;
}

export function RoomCard({ room, onBook }: RoomCardProps) {
  // Gracefully handle stringified JSON arrays commonly stored in PostgreSQL
  let parsedAmenities: string[] = [];
  try {
    parsedAmenities = typeof room.amenities === 'string' 
      ? JSON.parse(room.amenities) 
      : Array.isArray(room.amenities) ? room.amenities : [];
  } catch (e) {
    parsedAmenities = [];
  }

  return (
    <div className="bg-slate-900/30 border border-slate-900 rounded-3xl overflow-hidden hover:border-slate-800 transition-all group duration-300">
      <div className="h-48 overflow-hidden relative">
        <img 
          src={room.image_url} 
          alt={room.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4 bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-purple-400 border border-slate-800/80">
          {room.type}
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <h3 className="font-bold text-xl text-white group-hover:text-purple-400 transition-colors">
            {room.name}
          </h3>
          <div className="flex items-center space-x-4 mt-2 text-xs text-slate-400 font-light">
            <span className="flex items-center"><Users className="w-3.5 h-3.5 mr-1 text-purple-400" /> Max {room.capacity} pax</span>
            <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-purple-400" /> Level 3</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          {parsedAmenities.map((amenity, idx) => (
            <span key={idx} className="text-[10px] font-semibold tracking-wide bg-slate-900 text-slate-300 px-2 py-0.5 rounded-md border border-slate-800">
              {amenity}
            </span>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-900 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-light">Price per hour</span>
            <span className="font-extrabold text-lg text-white">Rp {room.price_per_hour.toLocaleString('id-ID')}</span>
          </div>
          <Button 
            onClick={() => onBook(room)}
            size="sm" 
            className="bg-slate-800 hover:bg-purple-600 hover:text-white border-0 text-slate-200 text-xs px-4 cursor-pointer transition-all"
          >
            Book Now
          </Button>
        </div>
      </div>
    </div>
  );
}
