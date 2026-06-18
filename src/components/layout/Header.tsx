import { Building2, Server } from 'lucide-react';
import { useServerStatus } from '../../hooks/useRooms';
import { Button } from '../ui/button';

export function Header() {
  const { data: serverStatus, isLoading, error } = useServerStatus();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300 tracking-tight">
              CoSpace
            </span>
            <span className="text-xs font-semibold text-purple-400 ml-1.5 px-2 py-0.5 bg-purple-950/40 rounded-full border border-purple-900/30">
              Medium
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
          <a href="#dashboard" className="hover:text-purple-400 transition-colors">Dashboard</a>
          <a href="#spaces" className="hover:text-purple-400 transition-colors">Workspace Rooms</a>
          <a href="#bookings" className="hover:text-purple-400 transition-colors">My Bookings</a>
          <a href="#api" className="hover:text-purple-400 transition-colors">API Docs</a>
        </nav>

        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
            isLoading 
              ? 'bg-amber-950/20 border-amber-900/50 text-amber-400' 
              : error 
              ? 'bg-rose-950/20 border-rose-900/50 text-rose-400' 
              : 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400'
          }`}>
            <Server className={`w-3.5 h-3.5 ${isLoading ? 'animate-pulse' : ''}`} />
            <span>
              Backend: {isLoading ? 'Checking...' : error ? 'Offline' : serverStatus?.status || 'Online'}
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${
              isLoading ? 'bg-amber-400 animate-ping' : error ? 'bg-rose-500' : 'bg-emerald-500'
            }`} />
          </div>
          <a href="#bookings">
            <Button variant="outline" className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 cursor-pointer">
              Bookings List
            </Button>
          </a>
        </div>
      </div>
    </header>
  );
}
