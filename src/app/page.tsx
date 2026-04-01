'use client';

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Restaurant } from '@/types/Restaurant';
import Link from 'next/link';

export default function RootPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Verificar se o usuário já está logado e é um restaurante
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Opcional: Redirecionar para o admin se já estiver logado
        // router.push('/admin');
      }
    });

    // 2. Buscar todos os restaurantes cadastrados
    const q = query(collection(db, 'restaurants'), limit(20));
    const unsubscribeRest = onSnapshot(q, (querySnapshot) => {
      const rests: Restaurant[] = [];
      querySnapshot.forEach((doc) => {
        rests.push({ id: doc.id, ...doc.data() } as Restaurant);
      });
      setRestaurants(rests);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeRest();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 p-6 md:p-20">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-16">
          <img src="/tanamao_512.png" alt="Logo" className="h-32 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]" />
          <h1 className="text-5xl font-black text-white italic tracking-tight">Onde vamos pedir hoje?</h1>
          <p className="text-slate-400 mt-4 text-xl">Escolha seu restaurante favorito e peça agora!</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {restaurants.map((rest) => (
            <Link 
              key={rest.id} 
              href={`/r/${rest.slug}`}
              className="group bg-slate-800/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-700/50 hover:border-orange-500/50 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/10"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-lg group-hover:rotate-6 transition-transform">
                  {rest.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white group-hover:text-orange-500 transition-colors">{rest.name}</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Clique para ver o cardápio</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-orange-500 font-black text-sm">
                <span>VER MENU</span>
                <span className="group-hover:translate-x-2 transition-transform">🚀</span>
              </div>
            </Link>
          ))}

          {/* Card para novos restaurantes */}
          <Link 
            href="/login"
            className="group bg-slate-900/40 border-2 border-dashed border-slate-700 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center hover:border-orange-500/50 transition-all"
          >
            <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all">🏪</div>
            <h2 className="text-xl font-black text-white">Seu Restaurante Aqui</h2>
            <p className="text-sm text-slate-500 mt-2">Cadastre sua loja e comece a vender agora!</p>
            <span className="mt-4 text-orange-500 font-bold group-hover:underline">Cadastrar Loja →</span>
          </Link>
        </div>

        <footer className="mt-24 text-center text-slate-600 text-sm font-medium">
          © 2024 taNaMão Delivery. Sua comida favorita a um toque de distância.
        </footer>
      </div>
    </main>
  );
}