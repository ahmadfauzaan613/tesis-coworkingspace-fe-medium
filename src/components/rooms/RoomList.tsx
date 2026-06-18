import { useRooms } from '../../hooks/useRooms';
import { RoomCard } from './RoomCard';
import { Room } from '../../types';

interface RoomListProps {
  onBook: (room: Room) => void;
}

export function RoomList({ onBook }: RoomListProps) {
  const { data: rooms, isLoading, error } = useRooms();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-slate-900/20 border border-slate-900 rounded-3xl h-96 animate-pulse flex flex-col p-6 space-y-4">
            <div className="bg-slate-800/50 w-full h-48 rounded-2xl" />
            <div className="bg-slate-800/50 w-3/4 h-6 rounded-md" />
            <div className="bg-slate-800/50 w-1/2 h-4 rounded-md" />
            <div className="bg-slate-800/50 w-full h-10 rounded-md mt-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-rose-950/20 border border-rose-900/50 rounded-2xl text-rose-400">
        <p className="font-semibold">Failed to load workspace rooms</p>
        <p className="text-sm mt-1">Please verify backend server connectivity.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {rooms?.map((room) => (
        <RoomCard key={room.id} room={room} onBook={onBook} />
      ))}
    </div>
  );
}
