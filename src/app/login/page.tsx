'use client';

import { useState } from 'react';
import { auth, db, googleProvider } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/admin');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: restaurantName });

        // Criar documento do restaurante
        const slug = restaurantName.toLowerCase().replace(/\s+/g, '-');
        await setDoc(doc(db, 'restaurants', user.uid), {
          id: user.uid,
          name: restaurantName,
          email: email,
          whatsapp: whatsapp,
          slug: slug,
          createdAt: serverTimestamp(),
        });

        router.push('/admin');
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Verificar se o restaurante já existe
      const docRef = doc(db, 'restaurants', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // Se não existir, precisamos de mais informações (nome, whatsapp)
        // Por simplicidade, criaremos com o que temos e o usuário edita depois
        const slug = user.displayName?.toLowerCase().replace(/\s+/g, '-') || user.uid;
        await setDoc(docRef, {
          id: user.uid,
          name: user.displayName || 'Meu Restaurante',
          email: user.email,
          whatsapp: '',
          slug: slug,
          createdAt: serverTimestamp(),
        });
      }

      router.push('/admin');
    } catch (error) {
      console.error("Google Login error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-700 shadow-2xl">
        <div className="text-center mb-8">
          <img 
            src="/tanamao_512.png" 
            alt="Logo" 
            className="h-24 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]" 
          />
          <h1 className="text-3xl font-black text-white italic">
            {isLogin ? 'Bem-vindo de Volta' : 'Crie sua Conta'}
          </h1>
          <p className="text-slate-400 mt-2 text-sm font-medium">
            {isLogin ? 'Acesse o painel do seu restaurante' : 'Comece a vender hoje mesmo'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Nome do Restaurante</label>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  placeholder="Ex: Pizzaria do João"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">WhatsApp para Pedidos</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  placeholder="Ex: 5511999999999"
                  required
                />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] disabled:opacity-50 mt-4"
          >
            {loading ? 'Processando...' : (isLogin ? 'Entrar no Painel' : 'Criar minha Conta')}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700/50"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
            <span className="bg-[#1e293b] px-4 text-slate-500 rounded-full border border-slate-700/50">Ou continue com</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-slate-900 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl border border-slate-700 flex items-center justify-center gap-3 transition-all active:scale-[0.98] group"
        >
          <span className="text-xl group-hover:scale-110 transition-transform">✉️</span>
          <span>Entrar com Gmail</span>
        </button>

        <p className="text-center text-slate-400 mt-8 text-sm">
          {isLogin ? 'Ainda não tem conta?' : 'Já tem uma conta?'}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-orange-500 font-bold ml-2 hover:underline"
          >
            {isLogin ? 'Criar agora' : 'Fazer login'}
          </button>
        </p>

        <div className="mt-8 text-center">
          <Link href="/" className="text-slate-500 hover:text-white transition-colors text-xs font-medium">← Voltar para a Loja</Link>
        </div>
      </div>
    </div>
  );
}