import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Dribbble, ArrowRight, Shield, Zap, Calendar } from 'lucide-react';
import { doc, getDoc, collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../firebase';
import { Tenant } from '../types';

const VolleyballIcon = ({ className, size = 24 }: { className?: string, size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a10 10 0 0 1 10 10" />
    <path d="M2 12a10 10 0 0 1 10-10" />
    <path d="M12 22a10 10 0 0 1-10-10" />
    <path d="M22 12a10 10 0 0 1-10 10" />
  </svg>
);

export const Landing = () => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const tenantDoc = await getDoc(doc(db, 'tenants', 'main-ct'));
        if (tenantDoc.exists()) {
          setTenant({ id: tenantDoc.id, ...tenantDoc.data() } as Tenant);
        } else {
          const q = query(collection(db, 'tenants'), limit(1));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const firstTenant = querySnapshot.docs[0];
            setTenant({ id: firstTenant.id, ...firstTenant.data() } as Tenant);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar dados do CT:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, []);

  return (
    <div className="min-h-screen bg-[#050a05] text-white overflow-x-hidden font-sans selection:bg-neon selection:text-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neon rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(57,255,20,0.4)]">
            <VolleyballIcon className="text-black" size={20} />
          </div>
          <span className="text-xl font-black tracking-tighter hidden sm:block">CT CROSSBOL</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-bold uppercase tracking-widest hover:text-neon transition-colors">Entrar</Link>
          <Link 
            to="/login" 
            className="px-6 py-2.5 bg-neon text-black text-xs font-black rounded-lg shadow-[0_0_20px_rgba(57,255,20,0.3)] hover:scale-105 transition-all"
          >
            RESERVAR
          </Link>
        </div>
      </nav>

      {/* Hero Section with 3D-like Background */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden pt-20">
        {/* Realistic Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1612872086822-4421f172c523?q=80&w=2000&auto=format&fit=crop" 
            alt="Vôlei de Praia Court" 
            className="w-full h-full object-cover opacity-50 scale-100"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050a05] via-transparent to-[#050a05]" />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Floating Elements for 3D Effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-[150%] w-64 h-64 bg-neon/10 blur-[100px] rounded-full animate-float pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/2 translate-x-[50%] w-96 h-96 bg-white/5 blur-[120px] rounded-full animate-float-delayed pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
              <VolleyballIcon className="text-neon w-10 h-10 sm:w-12 sm:h-12" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-6xl sm:text-8xl md:text-[10rem] font-black tracking-tighter mb-6 leading-[0.85] flex flex-col items-center">
              <span className="text-white">CT</span>
              <span className="text-neon neon-text-green">CROSSBOL</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 font-medium tracking-wider max-w-2xl mx-auto mb-12 uppercase px-4">
              A melhor experiência em <span className="text-white font-bold">Futvôlei</span>, <span className="text-white font-bold">Vôlei</span> e <span className="text-white font-bold">Beach Tennis</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link
              to="/login"
              className="group relative px-10 py-5 bg-neon text-black font-black rounded-2xl flex items-center gap-3 hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(57,255,20,0.3)] hover:shadow-[0_0_60px_rgba(57,255,20,0.5)]"
            >
              RESERVAR AGORA
              <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="px-10 py-5 glass-white border-white/20 hover:bg-white/10 text-white font-bold rounded-2xl transition-all duration-300 backdrop-blur-md"
            >
              VER QUADRAS
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-500"
        >
          <div className="w-6 h-10 border-2 border-gray-500 rounded-full flex justify-center p-1">
            <div className="w-1 h-2 bg-gray-500 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Features Section - More Professional */}
      <section className="py-32 px-6 relative bg-[#050a05]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-4 uppercase">Infraestrutura Premium</h2>
            <div className="w-24 h-1 bg-neon mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { 
                icon: <Zap className="text-neon" size={32} />, 
                title: "Reserva Instantânea", 
                desc: "Agende sua partida em menos de 1 minuto com confirmação automática via PIX." 
              },
              { 
                icon: <Shield className="text-neon" size={32} />, 
                title: "Ambiente Seguro", 
                desc: "Monitoramento 24h e infraestrutura completa para sua segurança e conforto." 
              },
              { 
                icon: <Calendar className="text-neon" size={32} />, 
                title: "Gestão de Horários", 
                desc: "Acompanhe suas reservas e histórico de partidas de forma simples e intuitiva." 
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-neon/30 transition-all duration-300"
              >
                <div className="mb-6 p-4 bg-neon/10 rounded-2xl inline-block">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-neon/5 -skew-y-3 origin-left" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { label: "Quadras", value: "03" },
            { label: "Atletas", value: "500+" },
            { label: "Partidas/Mês", value: "1.2k" },
            { label: "Avaliação", value: "4.9/5" }
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-5xl md:text-6xl font-black text-white mb-2">{stat.value}</div>
              <div className="text-neon text-sm uppercase tracking-[0.2em] font-bold">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 bg-[#020502]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-neon rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(57,255,20,0.4)]">
                <Dribbble className="text-black" size={24} />
              </div>
              <span className="text-2xl font-black tracking-tighter">CT CROSSBOL</span>
            </div>
            <div className="flex gap-12 text-sm font-bold uppercase tracking-widest text-gray-500">
              <a href="#" className="hover:text-neon transition-colors">Quadras</a>
              <a href="#" className="hover:text-neon transition-colors">Preços</a>
              <a href="#" className="hover:text-neon transition-colors">Localização</a>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-white/5 text-sm text-gray-600">
            <p>© 2026 CT CROSSBOL. TODOS OS DIREITOS RESERVADOS.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <span>DESIGNED FOR PERFORMANCE</span>
            </div>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) scale(1.05); }
          50% { transform: translateY(-30px) scale(1); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse 10s ease-in-out infinite; }
        .neon-text-green {
          text-shadow: 0 0 20px rgba(57, 255, 20, 0.5), 0 0 40px rgba(57, 255, 20, 0.3);
        }
        .glass-white {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
        }
      `}} />
    </div>
  );
};
