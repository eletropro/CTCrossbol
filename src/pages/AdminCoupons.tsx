import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Ticket, 
  Plus, 
  Trash2, 
  Calendar, 
  Tag, 
  CheckCircle2, 
  XCircle,
  Percent,
  DollarSign,
  ChevronLeft,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { formatCurrency } from '../lib/utils';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';

interface Coupon {
  id?: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  usageLimit: number;
  usageCount: number;
  status: 'active' | 'expired';
  expiryDate: string;
}

export const AdminCoupons = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState<Coupon>({
    code: '',
    type: 'percentage',
    value: 0,
    usageLimit: 0,
    usageCount: 0,
    status: 'active',
    expiryDate: new Date().toISOString().split('T')[0]
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'tenants', 'main-ct', 'coupons'));
      const snapshot = await getDocs(q);
      setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon)));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'tenants/main-ct/coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { id, ...couponData } = currentCoupon;
      if (id) {
        await updateDoc(doc(db, 'tenants', 'main-ct', 'coupons', id), couponData);
      } else {
        await addDoc(collection(db, 'tenants', 'main-ct', 'coupons'), {
          ...couponData,
          tenantId: 'main-ct'
        });
      }
      setIsEditing(false);
      fetchCoupons();
      alert('Cupom salvo com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'tenants/main-ct/coupons');
      alert('Erro ao salvar cupom.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este cupom?')) {
      try {
        await deleteDoc(doc(db, 'tenants', 'main-ct', 'coupons', id));
        fetchCoupons();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `tenants/main-ct/coupons/${id}`);
      }
    }
  };

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
          <h1 className="text-3xl font-black tracking-tighter neon-text uppercase">CUPONS E PROMOÇÕES</h1>
          <p className="text-gray-400">Crie incentivos para seus atletas e aumente suas reservas.</p>
        </div>
        <button 
          onClick={() => {
            setCurrentCoupon({
              code: '',
              type: 'percentage',
              value: 0,
              usageLimit: 0,
              usageCount: 0,
              status: 'active',
              expiryDate: new Date().toISOString().split('T')[0]
            });
            setIsEditing(true);
          }}
          className="px-6 py-3 bg-neon text-black rounded-xl font-bold neon-shadow flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <Plus size={20} /> Novo Cupom
        </button>
      </header>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <GlassCard className="max-w-2xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{currentCoupon.id ? 'Editar Cupom' : 'Novo Cupom'}</h2>
                <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Código do Cupom</label>
                  <input 
                    type="text" 
                    value={currentCoupon.code}
                    onChange={e => setCurrentCoupon({...currentCoupon, code: e.target.value.toUpperCase()})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-neon"
                    placeholder="Ex: VERAO20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Tipo de Desconto</label>
                  <select 
                    value={currentCoupon.type}
                    onChange={e => setCurrentCoupon({...currentCoupon, type: e.target.value as 'percentage' | 'fixed'})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-neon"
                  >
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Valor do Desconto</label>
                  <input 
                    type="number" 
                    value={currentCoupon.value}
                    onChange={e => setCurrentCoupon({...currentCoupon, value: parseFloat(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-neon"
                    placeholder="20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Limite de Uso (0 para ilimitado)</label>
                  <input 
                    type="number" 
                    value={currentCoupon.usageLimit}
                    onChange={e => setCurrentCoupon({...currentCoupon, usageLimit: parseInt(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-neon"
                    placeholder="100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Data de Expiração</label>
                  <input 
                    type="date" 
                    value={currentCoupon.expiryDate}
                    onChange={e => setCurrentCoupon({...currentCoupon, expiryDate: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-neon"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Status</label>
                  <select 
                    value={currentCoupon.status}
                    onChange={e => setCurrentCoupon({...currentCoupon, status: e.target.value as 'active' | 'expired'})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-neon"
                  >
                    <option value="active">Ativo</option>
                    <option value="expired">Expirado</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 glass border-white/10 hover:bg-white/5 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  className="px-6 py-2 bg-neon text-black rounded-xl font-bold neon-shadow flex items-center gap-2"
                >
                  <Save size={18} /> Salvar Cupom
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map((coupon) => (
          <GlassCard key={coupon.id} className="relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              {coupon.status === 'active' ? (
                <CheckCircle2 className="text-neon" size={20} />
              ) : (
                <XCircle className="text-red-500" size={20} />
              )}
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-neon/10 rounded-xl flex items-center justify-center text-neon">
                {coupon.type === 'percentage' ? <Percent size={24} /> : <DollarSign size={24} />}
              </div>
              <div>
                <div className="text-2xl font-black tracking-tighter text-white">{coupon.code}</div>
                <div className="text-xs text-gray-500 uppercase tracking-widest">
                  {coupon.type === 'percentage' ? `${coupon.value}% de desconto` : `${formatCurrency(coupon.value)} de desconto`}
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Uso</span>
                <span className="font-bold">{coupon.usageCount}/{coupon.usageLimit === 0 ? '∞' : coupon.usageLimit}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Validade</span>
                <span className="font-bold">{new Date(coupon.expiryDate).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setCurrentCoupon(coupon);
                  setIsEditing(true);
                }}
                className="flex-1 py-2 glass border-white/10 hover:bg-white/5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Edit2 size={14} /> Editar
              </button>
              <button 
                onClick={() => coupon.id && handleDelete(coupon.id)}
                className="p-2 glass border-white/10 hover:text-red-500 rounded-lg transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </GlassCard>
        ))}
        {coupons.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-gray-500">
            Nenhum cupom cadastrado.
          </div>
        )}
      </div>
    </div>
  );
};
