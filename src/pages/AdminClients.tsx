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
    <div className="p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors mb-2 text-sm"
          >
            <ChevronLeft size={16} /> Voltar ao Dashboard
          </button>
          <h1 className="text-3xl font-black tracking-tighter neon-text uppercase">CRM DE CLIENTES</h1>
          <p className="text-gray-400">Gerencie sua base de atletas e histórico de frequência.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 glass border-white/10 hover:bg-white/5 rounded-xl text-sm font-bold flex items-center gap-2">
            <Download size={18} /> Exportar CSV
          </button>
          <button className="px-6 py-3 bg-neon text-black rounded-xl font-bold neon-shadow flex items-center gap-2 hover:scale-105 transition-transform">
            <UserPlus size={20} /> Novo Atleta
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="flex items-center gap-4">
          <div className="p-4 bg-neon/10 rounded-2xl text-neon">
            <Users size={32} />
          </div>
          <div>
            <div className="text-sm text-gray-400">Total de Atletas</div>
            <div className="text-3xl font-black">{clients.length}</div>
          </div>
        </GlassCard>
        
        <GlassCard className="flex items-center gap-4">
          <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500">
            <Star size={32} />
          </div>
          <div>
            <div className="text-sm text-gray-400">Atletas VIP</div>
            <div className="text-3xl font-black">0</div>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4">
          <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-500">
            <Calendar size={32} />
          </div>
          <div>
            <div className="text-sm text-gray-400">Ativos este mês</div>
            <div className="text-3xl font-black">0</div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome, e-mail ou telefone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-neon"
            />
          </div>
          <button className="px-4 py-3 glass border-white/10 hover:bg-white/5 rounded-xl text-sm font-bold flex items-center gap-2">
            <Filter size={18} /> Filtros Avançados
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-white/5">
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
                        <div className="font-bold">{client.displayName || 'Usuário sem nome'}</div>
                        <div className="text-xs text-gray-500">{client.role === 'admin' ? 'Administrador' : 'Atleta'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Mail size={14} className="text-gray-500" /> {client.email}
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Phone size={14} className="text-gray-500" /> {client.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-300">
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
              {filteredClients.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    Nenhum atleta encontrado.
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
