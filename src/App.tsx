import { useState } from 'react'
import { Room } from './types'
import { Header } from './components/layout/Header'
import { Hero } from './components/layout/Hero'
import { Footer } from './components/layout/Footer'
import { RoomList } from './components/rooms/RoomList'
import { BookingForm } from './components/bookings/BookingForm'
import { BookingList } from './components/bookings/BookingList'
import { MapPin, Server } from 'lucide-react'

function App() {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
    // Smooth scroll to booking form
    const bookingFormEl = document.getElementById('booking-section');
    if (bookingFormEl) {
      bookingFormEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleClearSelection = () => {
    setSelectedRoom(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-purple-500 selection:text-white antialiased">
      {/* Dynamic Header */}
      <Header />

      {/* Hero Header Banner */}
      <Hero />

      {/* Main Workspace Rooms Grid */}
      <section id="spaces" className="max-w-7xl mx-auto px-6 py-12 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">Available Workspace Rooms</h2>
            <p className="text-slate-400 font-light">Choose from our dynamic shared desks, office rooms, or high-tech meeting rooms.</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <div className="text-xs font-semibold text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center">
              <MapPin className="w-3.5 h-3.5 text-purple-400 mr-1.5" />
              Jakarta, City Center
            </div>
          </div>
        </div>

        {/* RoomList component handles loading, error, and rendering */}
        <RoomList onBook={handleRoomSelect} />
      </section>

      {/* Booking Form and Recent Bookings Dashboard Section */}
      <section id="booking-section" className="max-w-7xl mx-auto px-6 py-12 w-full border-t border-slate-900">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Booking Form Panel */}
          <div className="lg:col-span-5">
            <BookingForm 
              selectedRoom={selectedRoom} 
              onClearSelection={handleClearSelection} 
            />
          </div>

          {/* Booking Records Log Panel */}
          <div id="bookings" className="lg:col-span-7 bg-slate-900/40 border border-slate-900 p-8 rounded-3xl space-y-6">
            <div>
              <h3 className="font-extrabold text-xl text-white">Live Booking Activity</h3>
              <p className="text-slate-400 text-xs mt-1 font-light">
                Recent workspace room reservations synchronized in real time with our PostgreSQL database.
              </p>
            </div>
            <BookingList />
          </div>

        </div>
      </section>

      {/* Tech Info Panel */}
      <section id="api" className="bg-slate-950 border-t border-slate-900 py-12 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-white text-center">Backend API & Database Connection</h2>
          <div className="bg-slate-900/50 border border-slate-900 p-6 rounded-2xl space-y-4">
            <div className="flex items-center space-x-3 text-purple-400 font-semibold">
              <Server className="w-5 h-5" />
              <span>System Integration Details</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed font-light">
              The backend is configured in the <span className="text-purple-300 font-medium">/Backend</span> directory. Once running, it will automatically connect to your PostgreSQL database using the credentials from the local <code className="text-purple-300">.env</code> configuration file and host an interactive Swagger documentation page at <a href="http://localhost:5000/api-docs" target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">http://localhost:5000/api-docs</a>.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono pt-2">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/60">
                <span className="text-purple-400 font-bold block mb-1">API Endpoints (Axios):</span>
                <span className="text-emerald-400 font-semibold">GET</span> /api/status - Status check<br />
                <span className="text-emerald-400 font-semibold">GET</span> /api/rooms - Get all workspace rooms<br />
                <span className="text-purple-400 font-semibold">POST</span> /api/rooms - Create space room<br />
                <span className="text-emerald-400 font-semibold">GET</span> /api/bookings - Get user bookings<br />
                <span className="text-purple-400 font-semibold">POST</span> /api/bookings - Create new booking
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/60">
                <span className="text-purple-400 font-bold block mb-1">Stack Components:</span>
                • Node.js & Express Server<br />
                • Knex.js / PostgreSQL Query Builder<br />
                • Swagger Documentation (swagger-ui-express)<br />
                • Axios HTTP client & TanStack Query State Manager
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Footer */}
      <Footer />
    </div>
  )
}

export default App
