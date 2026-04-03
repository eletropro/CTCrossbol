import React, { useState } from 'react';
import { motion } from 'motion/react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Dribbble, Mail, Lock, Chrome, ArrowRight, Info } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';

export const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setError(null);
    setMessage(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const isAdminEmail = user.email === 'duhgostozo@gmail.com';
      
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: isAdminEmail ? 'admin' : 'client',
          createdAt: new Date().toISOString()
        });
      } else if (isAdminEmail && userDoc.data().role !== 'admin') {
        // Garante que o dono sempre seja admin no banco
        await setDoc(doc(db, 'users', user.uid), { role: 'admin' }, { merge: true });
      }
      navigate(isAdminEmail ? '/dashboard' : '/booking');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError('Erro de credencial. Verifique se o login com Google está ativado no Firebase Console ou tente abrir o app em uma nova aba.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('O popup de login foi bloqueado pelo navegador. Por favor, permita popups para este site.');
      } else {
        setError('Falha ao entrar com Google. Tente novamente ou use e-mail e senha.');
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Por favor, digite seu e-mail primeiro para recuperar a senha.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('Este e-mail não está cadastrado.');
      } else {
        setError('Erro ao enviar e-mail de recuperação. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (isLogin) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const isAdminEmail = result.user.email === 'duhgostozo@gmail.com';
        if (isAdminEmail) {
          await setDoc(doc(db, 'users', result.user.uid), { role: 'admin' }, { merge: true });
        }
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const isAdminEmail = result.user.email === 'duhgostozo@gmail.com';
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          displayName: email.split('@')[0],
          role: isAdminEmail ? 'admin' : 'client',
          createdAt: new Date().toISOString()
        });
      }
      const isAdmin = email === 'duhgostozo@gmail.com';
      navigate(isAdmin ? '/dashboard' : '/booking');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso. Tente fazer login.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError('Ocorreu um erro. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-neon/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-neon/10 blur-[100px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-neon rounded-2xl flex items-center justify-center mx-auto mb-4 neon-shadow">
            <Dribbble className="text-black" size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tighter mb-2">
            {isLogin ? 'BEM-VINDO DE VOLTA' : 'CRIE SUA CONTA'}
          </h1>
          <p className="text-gray-400">Acesse a melhor plataforma de gestão esportiva.</p>
        </div>

        <GlassCard className="space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium text-center">
              {error}
            </div>
          )}
          {message && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm font-medium text-center flex items-center justify-center gap-2">
              <Info size={16} />
              {message}
            </div>
          )}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:border-neon focus:ring-1 focus:ring-neon outline-none transition-all"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-400">Senha</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-neon hover:underline font-bold"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:border-neon focus:ring-1 focus:ring-neon outline-none transition-all"
                  placeholder="••••••••"
                  required={isLogin}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-neon text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform neon-shadow disabled:opacity-50"
            >
              {loading ? 'Processando...' : isLogin ? 'Entrar' : 'Cadastrar'}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black px-2 text-gray-500">Ou continue com</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full glass border-white/10 hover:bg-white/5 py-3 rounded-xl flex items-center justify-center gap-3 transition-all"
          >
            <Chrome size={18} />
            <span>Google</span>
          </button>

          <p className="text-center text-sm text-gray-400">
            {isLogin ? 'Ainda não tem conta?' : 'Já tem uma conta?'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-neon ml-1 font-bold hover:underline"
            >
              {isLogin ? 'Cadastre-se' : 'Entre agora'}
            </button>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
};
