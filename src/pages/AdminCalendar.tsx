import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Dribbble,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { collection, query, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Booking, Court } from '../types';
import { formatTime, cn } from '../lib/utils';

export const AdminCalendar = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    // Real-time listener for bookings
    const q = query(collection(db, 'tenants', 'main-ct', 'bookings'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
    }, (error) => {
      console.error("Erro ao carregar reservas:", error);
    });

    // Fetch courts
    getDocs(collection(db, 'tenants', 'main-ct', 'courts')).then(snapshot => {
      setCourts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Court)));
    });

    return () => unsubscribe();
  }, []);

  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 to 22:00

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 h-screen flex flex-col overflow-hidden">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 shrink-0">
        <div className="w-full lg:w-auto">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors mb-2 text-xs sm:text-sm"
          >
            <ChevronLeft size={14} /> Voltar ao Dashboard
          </button>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter neon-text uppercase">AGENDA INTELIGENTE</h1>
          <div className="flex items-center gap-3 sm:gap-4 mt-2">
            <div className="flex items-center gap-2 glass px-2 sm:px-3 py-1 rounded-lg">
              <button 
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(selectedDate.getDate() - 1);
                  setSelectedDate(newDate);
                }} 
                className="hover:text-neon transition-colors"
              >
                <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
              <span className="text-xs sm:text-sm font-bold whitespace-nowrap">{selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</span>
              <button 
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(selectedDate.getDate() + 1);
                  setSelectedDate(newDate);
                }} 
                className="hover:text-neon transition-colors"
              >
                <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
            <button 
              onClick={() => setSelectedDate(new Date())}
              className="text-xs sm:text-sm text-neon font-bold hover:underline"
            >
              Hoje
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none min-w-[150px] sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 sm:w-[18px] sm:h-[18px]" size={16} />
            <input 
              type="text" 
              placeholder="Buscar reserva..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs sm:text-sm outline-none focus:border-neon transition-all"
            />
          </div>
          <button className="p-2 glass border-white/10 hover:text-neon transition-colors">
            <Filter size={18} className="sm:w-5 sm:h-5" />
          </button>
          <button className="flex-1 lg:flex-none px-4 sm:px-6 py-2 bg-neon text-black rounded-xl text-xs sm:text-sm font-bold neon-shadow flex items-center justify-center gap-2">
            <Plus size={18} className="sm:w-5 sm:h-5" /> <span className="hidden sm:inline">Nova Reserva</span>
            <span className="sm:hidden">Nova</span>
          </button>
        </div>
      </header>

      {/* Calendar Grid */}
      <GlassCard className="flex-1 overflow-hidden flex flex-col p-0 border-white/5">
        <div className="flex border-b border-white/10 overflow-x-auto scrollbar-hide">
          <div className="w-16 sm:w-20 border-r border-white/10 p-4 shrink-0 bg-black/20 sticky left-0 z-10"></div>
          <div className="flex-1 flex min-w-max">
            {courts.map(court => (
              <div key={court.id} className="w-[150px] sm:w-[200px] p-4 text-center border-r border-white/10 last:border-r-0">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Quadra</div>
                <div className="text-xs sm:text-sm font-bold truncate">{court.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-auto">
          <div className="min-w-max">
            {hours.map(hour => (
              <div key={hour} className="flex border-b border-white/5 group min-h-[80px]">
                <div className="w-16 sm:w-20 border-r border-white/10 p-4 shrink-0 text-[10px] sm:text-xs text-gray-500 font-mono flex flex-col justify-between bg-black/20 sticky left-0 z-10">
                  <span>{hour}:00</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">{hour}:30</span>
                </div>
                <div className="flex-1 flex">
                  {courts.map(court => {
                    const booking = bookings.find(b => {
                      const bDate = new Date(b.startTime);
                      return b.courtId === court.id && 
                             bDate.getHours() === hour && 
                             bDate.getDate() === selectedDate.getDate();
                    });

                    return (
                      <div key={court.id} className="w-[150px] sm:w-[200px] border-r border-white/5 last:border-r-0 p-1 relative group/cell hover:bg-neon/5 transition-colors cursor-pointer">
                        {booking ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={cn(
                              "absolute inset-1 rounded-lg p-2 sm:p-3 flex flex-col justify-between border-l-4 neon-shadow overflow-hidden",
                              booking.status === 'paid' ? "bg-neon/10 border-neon" : "bg-blue-500/10 border-blue-500"
                            )}
                          >
                            <div className="flex justify-between items-start gap-1">
                              <div className="text-[10px] sm:text-xs font-bold truncate">{booking.userName}</div>
                              <button className="text-gray-500 hover:text-white shrink-0"><MoreVertical size={12} /></button>
                            </div>
                            <div className="flex items-center gap-1 text-[8px] sm:text-[10px] text-gray-400">
                              <Clock size={8} /> {formatTime(booking.startTime)}
                            </div>
                          </motion.div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity">
                            <Plus size={20} className="text-neon/30" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
