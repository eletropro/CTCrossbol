import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile } from '../types';
import { motion } from 'motion/react';
import { Save, LogOut, Building, User as UserIcon, Phone, MapPin, FileText, CheckCircle2, Fuel, Navigation, Map as MapIcon, ArrowRight, Loader2 } from 'lucide-react';
import { calculateRoute, RouteResult } from '../services/routeService';

export default function Profile({ user }: { user: User }) {
  const [profile, setProfile] = useState<UserProfile>({
    uid: user.uid,
    companyName: '',
    ownerName: '',
    email: user.email || '',
    phone: '',
    address: '',
    contractClauses: '',
    monthlyGoal: 10000
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Route Calculator State
  const [destination, setDestination] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user.uid]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await setDoc(doc(db, 'users', user.uid), profile);
    setSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  if (loading) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10 sm:pb-0">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Configurações</h2>
          <p className="text-zinc-400 text-xs sm:text-sm">Personalize sua empresa e documentos.</p>
        </div>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100"
          >
            <CheckCircle2 size={16} /> Salvo com sucesso!
          </motion.div>
        )}
      </header>

      <form onSubmit={handleSave} className="space-y-6 sm:space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
          <div className="card-saas p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 text-emerald-500 font-bold text-sm mb-2">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Building size={20} />
              </div>
              Dados da Empresa
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">Nome da Empresa</label>
                <input
                  type="text"
                  value={profile.companyName}
                  onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                  className="input-saas"
                  placeholder="Ex: Eletro Soluções"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">Nome do Responsável</label>
                <input
                  type="text"
                  value={profile.ownerName}
                  onChange={(e) => setProfile({ ...profile, ownerName: e.target.value })}
                  className="input-saas"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">Meta de Faturamento Mensal (R$)</label>
                <input
                  type="number"
                  value={profile.monthlyGoal || ''}
                  onChange={(e) => setProfile({ ...profile, monthlyGoal: parseFloat(e.target.value) })}
                  className="input-saas"
                  placeholder="Ex: 10000"
                />
                <p className="text-[10px] text-zinc-500 mt-1">Esta meta será exibida no seu Dashboard principal.</p>
              </div>
            </div>
          </div>

          <div className="card-saas p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 text-emerald-500 font-bold text-sm mb-2">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Phone size={20} />
              </div>
              Contato e Localização
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">WhatsApp Business</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="input-saas py-3"
                  placeholder="5511999999999"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">Endereço Fiscal (Origem)</label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="input-saas py-3"
                  placeholder="Rua, Número, Bairro, Cidade"
                />
              </div>
            </div>
          </div>

          <div className="card-saas p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 text-emerald-500 font-bold text-sm mb-2">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Fuel size={20} />
              </div>
              Configuração de Combustível
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">Preço do Litro (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={profile.fuelPrice || ''}
                  onChange={(e) => setProfile({ ...profile, fuelPrice: parseFloat(e.target.value) })}
                  className="input-saas py-3"
                  placeholder="Ex: 5.89"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">Consumo Médio (KM/L)</label>
                <input
                  type="number"
                  step="0.1"
                  value={profile.fuelConsumption || ''}
                  onChange={(e) => setProfile({ ...profile, fuelConsumption: parseFloat(e.target.value) })}
                  className="input-saas py-3"
                  placeholder="Ex: 12.5"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Route Calculator Section */}
        <div className="card-saas p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 text-emerald-500 font-bold text-sm mb-2">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Navigation size={20} />
            </div>
            Calculadora de Deslocamento
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-xs text-zinc-400">Calcule a distância e o custo de combustível até o cliente usando o Google Maps.</p>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">Endereço do Cliente</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="input-saas flex-1"
                    placeholder="Digite o endereço do cliente..."
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!profile.address || !destination) return;
                      setCalculating(true);
                      try {
                        const res = await calculateRoute(
                          profile.address,
                          destination,
                          profile.fuelPrice || 0,
                          profile.fuelConsumption || 1
                        );
                        setRouteResult(res);
                      } catch (error) {
                        console.error(error);
                      } finally {
                        setCalculating(false);
                      }
                    }}
                    disabled={calculating || !profile.address || !destination}
                    className="btn-primary px-6"
                  >
                    {calculating ? <Loader2 className="animate-spin" size={20} /> : 'Calcular'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-3xl p-6 border border-zinc-800 flex flex-col justify-center">
              {routeResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Distância</p>
                      <p className="text-xl font-bold text-white">{routeResult.distanceKm} km</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Tempo Est.</p>
                      <p className="text-xl font-bold text-white">{routeResult.durationText}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-zinc-700">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Custo de Combustível</p>
                    <p className="text-2xl font-bold text-emerald-500">R$ {routeResult.fuelCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <a
                    href={routeResult.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-xs font-bold transition-all mt-2"
                  >
                    <MapIcon size={16} /> Ver no Google Maps <ArrowRight size={14} />
                  </a>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Navigation className="text-zinc-700 mx-auto mb-2" size={32} />
                  <p className="text-zinc-500 text-xs">Insira o endereço do cliente para calcular.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card-saas p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 text-emerald-500 font-bold text-sm mb-2">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <FileText size={20} />
            </div>
            Cláusulas e Termos do Contrato
          </div>
          <textarea
            value={profile.contractClauses}
            onChange={(e) => setProfile({ ...profile, contractClauses: e.target.value })}
            className="input-saas min-h-[200px] py-3"
            placeholder="Digite aqui as cláusulas que serão impressas nos seus contratos em PDF..."
          />
          <p className="text-[10px] text-zinc-500 italic">Essas cláusulas serão incluídas automaticamente na geração de contratos PDF.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 btn-primary py-4 sm:py-5 text-lg shadow-xl shadow-brand-500/20"
          >
            <Save size={22} /> {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>

          <button
            type="button"
            onClick={() => auth.signOut()}
            className="w-full sm:w-48 bg-rose-500/10 text-rose-500 font-bold py-4 sm:py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-rose-500/20 active:scale-95 transition-all border border-rose-500/20"
          >
            <LogOut size={20} /> Sair
          </button>
        </div>
      </form>
    </div>
  );
}
