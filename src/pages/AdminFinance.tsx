import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Filter,
  CreditCard,
  Smartphone,
  Banknote,
  ChevronLeft
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { GlassCard } from '../components/GlassCard';
import { formatCurrency, cn } from '../lib/utils';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';

export const AdminFinance = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    monthlyRevenue: 0,
    averageTicket: 0,
    pendingPayments: 0
  });

  useEffect(() => {
    const fetchFinanceData = async () => {
      try {
        // In a real app, we would fetch transactions and calculate stats
        // For now, we'll initialize with zero as requested for new sign-ups
        const q = query(collection(db, 'tenants', 'main-ct', 'transactions'), orderBy('createdAt', 'desc'), limit(20));
        const snapshot = await getDocs(q);
        const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTransactions(txs);
        
        // If we had real data, we'd calculate these:
        // setStats({ ... });
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'tenants/main-ct/transactions');
      } finally {
        setLoading(false);
      }
    };
    fetchFinanceData();
  }, []);

  const revenueData = [
    { name: 'Jan', value: 0 },
    { name: 'Fev', value: 0 },
    { name: 'Mar', value: 0 },
    { name: 'Abr', value: 0 },
    { name: 'Mai', value: 0 },
    { name: 'Jun', value: 0 },
  ];

  const paymentMethods = [
    { name: 'PIX', value: 0, color: '#00FF88' },
    { name: 'Cartão', value: 0, color: '#3B82F6' },
    { name: 'Dinheiro', value: 0, color: '#F59E0B' },
  ];

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors mb-2 text-xs sm:text-sm"
          >
            <ChevronLeft size={14} className="sm:w-4 sm:h-4" /> Voltar ao Dashboard
          </button>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter neon-text uppercase">FINANCEIRO</h1>
          <p className="text-gray-400 text-xs sm:text-sm md:text-base">Controle total de receitas, pagamentos e relatórios.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button className="px-4 py-2 glass border-white/10 hover:bg-white/5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
            <Filter size={16} className="sm:w-[18px] sm:h-[18px]" /> Filtrar
          </button>
          <button className="px-4 py-2 bg-neon text-black rounded-xl text-xs sm:text-sm font-bold neon-shadow flex items-center justify-center gap-2">
            <Download size={16} className="sm:w-[18px] sm:h-[18px]" /> Relatório PDF
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <GlassCard className="bg-neon/5 border-neon/20 p-4 sm:p-6">
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-neon/10 rounded-xl text-neon">
              <DollarSign size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
          <div className="text-[10px] sm:text-sm text-gray-400 mb-1">Receita Mensal</div>
          <div className="text-2xl sm:text-3xl font-black tracking-tight">{formatCurrency(stats.monthlyRevenue)}</div>
        </GlassCard>

        <GlassCard className="p-4 sm:p-6">
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <CreditCard size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
          <div className="text-[10px] sm:text-sm text-gray-400 mb-1">Ticket Médio</div>
          <div className="text-2xl sm:text-3xl font-black tracking-tight">{formatCurrency(stats.averageTicket)}</div>
        </GlassCard>

        <GlassCard className="p-4 sm:p-6">
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-purple-500/10 rounded-xl text-purple-500">
              <Smartphone size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
          <div className="text-[10px] sm:text-sm text-gray-400 mb-1">Pagamentos Pendentes</div>
          <div className="text-2xl sm:text-3xl font-black tracking-tight">{formatCurrency(stats.pendingPayments)}</div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 h-[300px] sm:h-[400px] p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold mb-6 sm:mb-8">Evolução de Receita</h3>
          <div className="flex items-center justify-center h-[200px] sm:h-[280px] text-gray-500 text-xs sm:text-sm italic">
            Aguardando primeiras transações para gerar gráfico...
          </div>
        </GlassCard>

        <GlassCard className="h-[300px] sm:h-[400px] flex flex-col p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold mb-4">Métodos de Pagamento</h3>
          <div className="flex-1 flex items-center justify-center text-gray-500 text-xs sm:text-sm italic text-center px-4">
            Dados de pagamento aparecerão aqui após as primeiras vendas.
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <h3 className="text-lg sm:text-xl font-bold p-4 sm:p-6 border-b border-white/5">Transações Recentes</h3>
        
        {/* Mobile Card View */}
        <div className="block sm:hidden divide-y divide-white/5">
          {transactions.map((tx) => (
            <div key={tx.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-sm">{tx.userName}</div>
                  <div className="text-[10px] text-gray-500">#{tx.id.slice(0, 8)}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-neon text-sm">{formatCurrency(tx.amount)}</div>
                  <div className="text-[10px] text-gray-500">{tx.createdAt?.toDate().toLocaleDateString()}</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-[10px] text-gray-300">
                  <Smartphone size={12} className="text-neon" /> {tx.method}
                </div>
                <span className={cn(
                  "px-2 py-0.5 text-[8px] font-black uppercase rounded-full border",
                  tx.status === 'confirmed' 
                    ? "bg-green-500/10 text-green-500 border-green-500/20" 
                    : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                )}>
                  {tx.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-gray-500 text-xs sm:text-sm">
                <th className="px-6 py-4 font-medium">ID</th>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Método</th>
                <th className="px-6 py-4 font-medium">Data</th>
                <th className="px-6 py-4 font-medium">Valor</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((tx) => (
                <tr key={tx.id} className="group hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-xs sm:text-sm text-gray-400">#{tx.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 font-bold text-sm">{tx.userName}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Smartphone size={16} className="text-neon" /> {tx.method}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs sm:text-sm text-gray-400">{tx.createdAt?.toDate().toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-bold text-neon text-sm">{formatCurrency(tx.amount)}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 text-[10px] font-bold uppercase rounded-full",
                      tx.status === 'confirmed' ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                    )}>
                      {tx.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && !loading && (
          <div className="px-6 py-12 text-center text-gray-500 text-sm">
            Nenhuma transação registrada ainda.
          </div>
        )}
      </GlassCard>
    </div>
  );
};
