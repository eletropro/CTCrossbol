import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  Calendar, 
  Star,
  Download,
  ChevronLeft,
  UserPlus
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { formatCurrency, cn } from '../lib/utils';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';

export const AdminClients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        setClients(snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile)));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'users');
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const filteredClients = clients.filter(client => 
    client.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter neon-text uppercase">CRM DE CLIENTES</h1>
          <p className="text-gray-400 text-xs sm:text-sm md:text-base">Gerencie sua base de atletas e histórico de frequência.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button className="px-4 py-2 glass border-white/10 hover:bg-white/5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
            <Download size={16} className="sm:w-[18px] sm:h-[18px]" /> Exportar CSV
          </button>
          <button className="px-6 py-3 bg-neon text-black rounded-xl text-sm font-bold neon-shadow flex items-center justify-center gap-2 hover:scale-105 transition-transform">
            <UserPlus size={18} className="sm:w-5 sm:h-5" /> Novo Atleta
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <GlassCard className="flex items-center gap-4 p-4 sm:p-6">
          <div className="p-3 sm:p-4 bg-neon/10 rounded-2xl text-neon">
            <Users size={24} className="sm:w-8 sm:h-8" />
          </div>
          <div>
            <div className="text-[10px] sm:text-sm text-gray-400">Total de Atletas</div>
            <div className="text-2xl sm:text-3xl font-black">{clients.length}</div>
          </div>
        </GlassCard>
        
        <GlassCard className="flex items-center gap-4 p-4 sm:p-6">
          <div className="p-3 sm:p-4 bg-blue-500/10 rounded-2xl text-blue-500">
            <Star size={24} className="sm:w-8 sm:h-8" />
          </div>
          <div>
            <div className="text-[10px] sm:text-sm text-gray-400">Atletas VIP</div>
            <div className="text-2xl sm:text-3xl font-black">0</div>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4 p-4 sm:p-6">
          <div className="p-3 sm:p-4 bg-purple-500/10 rounded-2xl text-purple-500">
            <Calendar size={24} className="sm:w-8 sm:h-8" />
          </div>
          <div>
            <div className="text-[10px] sm:text-sm text-gray-400">Ativos este mês</div>
            <div className="text-2xl sm:text-3xl font-black">0</div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden p-0">
        <div className="p-4 sm:p-6 border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome, e-mail ou telefone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-neon text-xs sm:text-sm"
            />
          </div>
          <button className="w-full lg:w-auto px-4 py-3 glass border-white/10 hover:bg-white/5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
            <Filter size={16} className="sm:w-[18px] sm:h-[18px]" /> Filtros Avançados
          </button>
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden divide-y divide-white/5">
          {filteredClients.map((client) => (
            <div key={client.uid} className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-neon">
                    {client.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{client.displayName || 'Usuário sem nome'}</div>
                    <div className="text-[10px] text-gray-500">{client.role === 'admin' ? 'Administrador' : 'Atleta'}</div>
                  </div>
                </div>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <MoreVertical size={18} className="text-gray-500" />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <Mail size={14} className="text-gray-500" /> {client.email}
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Phone size={14} className="text-gray-500" /> {client.phone}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <Calendar size={14} className="text-gray-500" /> 
                  Cadastrado em: {client.createdAt ? new Date(client.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest border-b border-white/5">
                <th className="px-6 py-4 font-black">Atleta</th>
                <th className="px-6 py-4 font-black">Contato</th>
                <th className="px-6 py-4 font-black">Cadastro</th>
                <th className="px-6 py-4 font-black text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredClients.map((client) => (
                <tr key={client.uid} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-neon">
                        {client.displayName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{client.displayName || 'Usuário sem nome'}</div>
                        <div className="text-[10px] text-gray-500">{client.role === 'admin' ? 'Administrador' : 'Atleta'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
                        <Mail size={14} className="text-gray-500" /> {client.email}
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
                          <Phone size={14} className="text-gray-500" /> {client.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs sm:text-sm text-gray-300">
                      {client.createdAt ? new Date(client.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <MoreVertical size={18} className="text-gray-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredClients.length === 0 && !loading && (
          <div className="px-6 py-12 text-center text-gray-500 text-sm">
            Nenhum atleta encontrado.
          </div>
        )}
      </GlassCard>
    </div>
  );
};
