import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  Calendar as CalendarIcon, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreVertical
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { GlassCard } from '../components/GlassCard';
import { formatCurrency, cn } from '../lib/utils';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';

const data = [
  { name: 'Seg', revenue: 0, bookings: 0 },
  { name: 'Ter', revenue: 0, bookings: 0 },
  { name: 'Qua', revenue: 0, bookings: 0 },
  { name: 'Qui', revenue: 0, bookings: 0 },
  { name: 'Sex', revenue: 0, bookings: 0 },
  { name: 'Sáb', revenue: 0, bookings: 0 },
  { name: 'Dom', revenue: 0, bookings: 0 },
];

export const Dashboard = () => {
  const [stats, setStats] = useState([
    { label: 'Faturamento Total', value: 'R$ 0,00', change: '0%', icon: DollarSign, positive: true },
    { label: 'Novas Reservas', value: '0', change: '0%', icon: CalendarIcon, positive: true },
    { label: 'Novos Clientes', value: '0', change: '0%', icon: Users, positive: true },
    { label: 'Ticket Médio', value: 'R$ 0,00', change: '0%', icon: TrendingUp, positive: true },
  ]);

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total bookings
        const bookingsSnap = await getDocs(collection(db, 'tenants', 'main-ct', 'bookings'));
        const totalBookings = bookingsSnap.size;
        
        // Fetch total users
        const usersSnap = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnap.size;
        
        // Calculate total revenue
        let totalRevenue = 0;
        bookingsSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.status === 'paid' || data.status === 'confirmed') {
            totalRevenue += data.totalPrice || 0;
          }
        });

        setStats([
          { label: 'Faturamento Total', value: formatCurrency(totalRevenue), change: '0%', icon: DollarSign, positive: true },
          { label: 'Novas Reservas', value: totalBookings.toString(), change: '0%', icon: CalendarIcon, positive: true },
          { label: 'Novos Clientes', value: totalUsers.toString(), change: '0%', icon: Users, positive: true },
          { label: 'Ticket Médio', value: formatCurrency(totalBookings > 0 ? totalRevenue / totalBookings : 0), change: '0%', icon: TrendingUp, positive: true },
        ]);

        // Fetch recent activity
        const recentQ = query(collection(db, 'tenants', 'main-ct', 'bookings'), orderBy('createdAt', 'desc'), limit(5));
        const recentSnap = await getDocs(recentQ);
        setRecentActivity(recentSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          time: new Date(doc.data().startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          amount: doc.data().totalPrice
        })));

      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'dashboard-stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter neon-text uppercase">DASHBOARD</h1>
          <p className="text-gray-400 text-xs sm:text-sm">Bem-vindo de volta ao seu centro esportivo.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none px-4 py-2 glass border-white/10 hover:bg-white/5 rounded-xl text-xs sm:text-sm font-bold transition-all">
            Exportar PDF
          </button>
          <button className="flex-1 sm:flex-none px-4 py-2 bg-neon text-black rounded-xl text-xs sm:text-sm font-bold neon-shadow hover:scale-105 transition-transform">
            Nova Reserva
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, i) => (
          <GlassCard key={i} className="relative overflow-hidden group p-4 sm:p-6">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-neon/10 rounded-xl text-neon group-hover:bg-neon group-hover:text-black transition-colors">
                <stat.icon size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full",
                stat.positive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
              )}>
                {stat.positive ? <ArrowUpRight size={10} className="sm:w-3 sm:h-3" /> : <ArrowDownRight size={10} className="sm:w-3 sm:h-3" />}
                {stat.change}
              </div>
            </div>
            <div className="text-[10px] sm:text-sm text-gray-400 mb-1">{stat.label}</div>
            <div className="text-xl sm:text-2xl font-black tracking-tight">{stat.value}</div>
          </GlassCard>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 h-[300px] sm:h-[400px] p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-bold">Receita Semanal</h3>
            <select className="bg-transparent border-none text-xs sm:text-sm text-gray-400 outline-none cursor-pointer">
              <option>Últimos 7 dias</option>
              <option>Último mês</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00FF88" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00FF88" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '12px' }}
                itemStyle={{ color: '#00FF88' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#00FF88" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="h-[300px] sm:h-[400px] p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-bold">Reservas por Dia</h3>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '12px' }}
                itemStyle={{ color: '#00FF88' }}
              />
              <Bar dataKey="bookings" fill="#00FF88" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Recent Activity */}
      <GlassCard className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg sm:text-xl font-bold">Atividade Recente</h3>
          <button className="text-neon text-xs sm:text-sm font-bold hover:underline">Ver todas</button>
        </div>
        <div className="space-y-3 sm:space-y-4">
          {recentActivity.map((activity, i) => (
            <div key={i} className="flex items-center justify-between p-3 sm:p-4 rounded-xl hover:bg-white/5 transition-colors group">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs sm:text-base">
                  {activity.userName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-sm sm:text-base">{activity.userName}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">{activity.courtName} • {activity.time}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="text-right">
                  <div className="font-bold text-neon text-sm sm:text-base">{formatCurrency(activity.amount)}</div>
                  <div className="text-[8px] sm:text-[10px] uppercase tracking-widest text-green-500">{activity.status}</div>
                </div>
                <button className="p-1 sm:p-2 text-gray-500 hover:text-white transition-colors">
                  <MoreVertical size={16} className="sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          ))}
          {recentActivity.length === 0 && (
            <div className="py-12 text-center text-gray-500 text-sm">
              Nenhuma atividade registrada ainda.
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
