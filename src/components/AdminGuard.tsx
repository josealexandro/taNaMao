'use client';

import { useEffect, useState } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const ADMIN_EMAIL = 'alexnaguibass@gmail.com';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
      alert("Falha no login. Tente novamente.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4">
        <div className="bg-slate-800/50 p-10 rounded-3xl border border-slate-700 text-center max-w-md w-full shadow-2xl">
          <h1 className="text-4xl font-black italic text-orange-500 mb-6">taNaMão Admin</h1>
          <p className="text-slate-300 mb-10">Acesso restrito. Faça login para gerenciar sua loja.</p>
          <button
            onClick={handleLogin}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-100 transition-all shadow-xl active:scale-95"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
            <span>Entrar com Google</span>
          </button>
        </div>
      </div>
    );
  }

  if (user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 text-center">
        <div className="text-6xl mb-6">🚫</div>
        <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
        <p className="text-slate-400 mb-8">Você não tem permissão para acessar esta área.</p>
        <button
          onClick={handleLogout}
          className="text-orange-500 font-bold hover:underline"
        >
          Sair e voltar ao início
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center px-8">
        <div className="flex items-center gap-4">
          <img src={user.photoURL || ''} alt="User" className="w-8 h-8 rounded-full border border-orange-500" />
          <span className="text-sm font-bold text-slate-300">{user.email}</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 px-4 py-2 rounded-lg transition-all"
        >
          Sair do Admin
        </button>
      </div>
      {children}
    </>
  );
}
