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
import { formatCurrency } from '../lib/utils';
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
    <div className="p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors mb-2 text-sm"
          >
            <ChevronLeft size={16} /> Voltar ao Dashboard
          </button>
          <h1 className="text-3xl font-black tracking-tighter neon-text uppercase">FINANCEIRO</h1>
          <p className="text-gray-400">Controle total de receitas, pagamentos e relatórios.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 glass border-white/10 hover:bg-white/5 rounded-xl text-sm font-bold flex items-center gap-2">
            <Filter size={18} /> Filtrar
          </button>
          <button className="px-4 py-2 bg-neon text-black rounded-xl text-sm font-bold neon-shadow flex items-center gap-2">
            <Download size={18} /> Relatório PDF
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="bg-neon/5 border-neon/20">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-neon/10 rounded-xl text-neon">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="text-sm text-gray-400 mb-1">Receita Mensal</div>
          <div className="text-3xl font-black tracking-tight">{formatCurrency(stats.monthlyRevenue)}</div>
        </GlassCard>

        <GlassCard>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <CreditCard size={24} />
            </div>
          </div>
          <div className="text-sm text-gray-400 mb-1">Ticket Médio</div>
          <div className="text-3xl font-black tracking-tight">{formatCurrency(stats.averageTicket)}</div>
        </GlassCard>

        <GlassCard>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
              <Smartphone size={24} />
            </div>
          </div>
          <div className="text-sm text-gray-400 mb-1">Pagamentos Pendentes</div>
          <div className="text-3xl font-black tracking-tight">{formatCurrency(stats.pendingPayments)}</div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 h-[400px]">
          <h3 className="text-xl font-bold mb-8">Evolução de Receita</h3>
          <div className="flex items-center justify-center h-[280px] text-gray-500 text-sm italic">
            Aguardando primeiras transações para gerar gráfico...
          </div>
        </GlassCard>

        <GlassCard className="h-[400px] flex flex-col">
          <h3 className="text-xl font-bold mb-4">Métodos de Pagamento</h3>
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm italic text-center px-4">
            Dados de pagamento aparecerão aqui após as primeiras vendas.
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="text-xl font-bold mb-6">Transações Recentes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-gray-500 text-sm">
                <th className="pb-4 font-medium">ID</th>
                <th className="pb-4 font-medium">Cliente</th>
                <th className="pb-4 font-medium">Método</th>
                <th className="pb-4 font-medium">Data</th>
                <th className="pb-4 font-medium">Valor</th>
                <th className="pb-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((tx) => (
                <tr key={tx.id} className="group hover:bg-white/5 transition-colors">
                  <td className="py-4 text-sm text-gray-400">#{tx.id.slice(0, 8)}</td>
                  <td className="py-4 font-bold">{tx.userName}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Smartphone size={16} className="text-neon" /> {tx.method}
                    </div>
                  </td>
                  <td className="py-4 text-sm text-gray-400">{tx.createdAt?.toDate().toLocaleDateString()}</td>
                  <td className="py-4 font-bold text-neon">{formatCurrency(tx.amount)}</td>
                  <td className="py-4">
                    <span className={cn(
                      "px-2 py-1 text-[10px] font-bold uppercase rounded-full",
                      tx.status === 'confirmed' ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                    )}>
                      {tx.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    Nenhuma transação registrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
