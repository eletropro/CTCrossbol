import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, onSnapshot, doc, deleteDoc, getDocs, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Trash2, Mail, Shield, Search, X, AlertTriangle, Building, Calendar } from 'lucide-react';

export default function Admin({ user }: { user: User }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Hardcoded Admin Check
  const isAdmin = user.email?.toLowerCase() === 'duhgostozo@gmail.com';

  useEffect(() => {
    if (!isAdmin) return;

    const path = 'users';
    const q = query(collection(db, path));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir os DADOS de ${userEmail}? Isso não removerá o acesso dele ao login, apenas os dados do perfil no banco de dados.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      alert('Dados do usuário excluídos com sucesso.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-[2rem] flex items-center justify-center mb-6">
          <Shield size={40} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Acesso Negado</h2>
        <p className="text-zinc-500 max-w-md">
          Você não tem permissão para acessar esta área administrativa.
        </p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10 sm:pb-0">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Painel Administrativo</h2>
          <p className="text-zinc-400 text-xs sm:text-sm">Gerencie os usuários e empresas cadastradas no MetaCash.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar usuário..."
            className="input-saas pr-12 py-2.5 text-sm"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
        </div>
      </header>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 flex gap-4 items-start">
        <div className="p-3 bg-amber-500/20 text-amber-500 rounded-2xl shrink-0">
          <AlertTriangle size={24} />
        </div>
        <div>
          <h4 className="font-bold text-amber-500 mb-1">Nota Importante</h4>
          <p className="text-xs text-amber-500/80 leading-relaxed">
            A exclusão aqui remove apenas os dados do perfil no Firestore. Para impedir que o usuário faça login ou para excluir a conta dele permanentemente do sistema de autenticação, você deve acessar o <strong>Console do Firebase &gt; Authentication</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="card-saas p-6 h-48 animate-pulse bg-white/5" />
          ))
        ) : filteredUsers.map((u) => (
          <motion.div
            key={u.id}
            layout
            className="card-saas p-6 flex flex-col justify-between group"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-brand-500/10 text-brand-500 rounded-2xl flex items-center justify-center">
                  <Users size={24} />
                </div>
                <button 
                  onClick={() => handleDeleteUser(u.id, u.email)}
                  className="p-2 text-zinc-600 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <div>
                <h3 className="font-bold text-white truncate">{u.companyName || 'Empresa não configurada'}</h3>
                <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                  <Mail size={12} />
                  <span className="truncate">{u.email}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-[10px] text-zinc-400 uppercase font-bold tracking-widest">
                  <Building size={12} />
                  <span>{u.ownerName || 'Responsável não informado'}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-400 uppercase font-bold tracking-widest">
                  <Calendar size={12} />
                  <span>Cadastrado em: {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {!loading && filteredUsers.length === 0 && (
        <div className="text-center py-20">
          <p className="text-zinc-500">Nenhum usuário encontrado.</p>
        </div>
      )}
    </div>
  );
}
