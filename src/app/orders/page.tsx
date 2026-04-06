'use client';

import { useEffect, useRef, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Order, OrderStatus } from '@/types/Order';
import { Restaurant } from '@/types/Restaurant';

export default function OrdersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurantsById, setRestaurantsById] = useState<Record<string, Restaurant>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const fetchedRestaurantIds = useRef<Set<string>>(new Set());
  const hasToDate = (value: unknown): value is { toDate: () => Date } => {
    if (!value || typeof value !== 'object') return false;
    if (!('toDate' in value)) return false;
    return typeof (value as { toDate?: unknown }).toDate === 'function';
  };
  const normalizeOrderStatus = (status: OrderStatus | undefined): Exclude<OrderStatus, 'pending' | 'completed'> => {
    if (status === 'pending') return 'pendente';
    if (status === 'completed') return 'concluido';
    if (!status) return 'pendente';
    return status as Exclude<OrderStatus, 'pending' | 'completed'>;
  };
  const statusLabel = (status: OrderStatus | undefined) => {
    const normalized = normalizeOrderStatus(status);
    if (normalized === 'pendente') return 'Pendente';
    if (normalized === 'aceito') return 'Aceito';
    if (normalized === 'preparando') return 'Preparando';
    if (normalized === 'saiu_entrega') return 'Saiu p/ entrega';
    if (normalized === 'concluido') return 'Concluído';
    if (normalized === 'cancelado') return 'Cancelado';
    return 'Pendente';
  };
  const statusPillClass = (status: OrderStatus | undefined) => {
    const normalized = normalizeOrderStatus(status);
    if (normalized === 'pendente') return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (normalized === 'aceito') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (normalized === 'preparando') return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (normalized === 'saiu_entrega') return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    if (normalized === 'concluido') return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (normalized === 'cancelado') return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/login?role=client');
        return;
      }
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('clientUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData: Order[] = [];
      querySnapshot.forEach((docSnap) => {
        ordersData.push({ id: docSnap.id, ...(docSnap.data() as Omit<Order, 'id'>) });
      });
      setOrders(ordersData);

      const restaurantIds = Array.from(new Set(ordersData.map((o) => o.restaurantId))).filter(Boolean);
      restaurantIds.forEach(async (restaurantId) => {
        if (fetchedRestaurantIds.current.has(restaurantId)) return;
        fetchedRestaurantIds.current.add(restaurantId);
        try {
          const restSnap = await getDoc(doc(db, 'restaurants', restaurantId));
          if (restSnap.exists()) {
            const restData = { id: restSnap.id, ...(restSnap.data() as Omit<Restaurant, 'id'>) } as Restaurant;
            setRestaurantsById((prev) => ({ ...prev, [restaurantId]: restData }));
          }
        } catch {}
      });
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login?role=client');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-10">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-white italic">Meus Pedidos</h1>
            <p className="text-slate-400 mt-2 text-sm font-medium">{user?.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/"
              className="bg-slate-800 hover:bg-slate-700 text-orange-500 px-6 py-2 rounded-xl font-bold transition-all border border-slate-700 flex items-center gap-2"
            >
              <span>🏠</span> Vitrine
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 px-4 py-2 rounded-lg transition-all font-bold"
            >
              Sair
            </button>
          </div>
        </header>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/20 rounded-3xl border border-dashed border-slate-700">
            <div className="text-5xl mb-4 opacity-20">🧾</div>
            <p className="text-slate-500 font-bold text-xl">Você ainda não tem pedidos.</p>
            <p className="text-slate-600 text-sm mt-2 font-medium">Faça um pedido em algum restaurante e ele aparecerá aqui.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const restaurant = order.restaurantId ? restaurantsById[order.restaurantId] : undefined;
              const createdAt = hasToDate(order.createdAt) ? order.createdAt.toDate().toLocaleString('pt-BR') : 'Agora mesmo';
              const pillLabel = statusLabel(order.status);
              const pillClass = statusPillClass(order.status);
              const message = encodeURIComponent(`Olá! Gostaria de saber o status do meu pedido (${order.id}).`);
              const waUrl = restaurant?.whatsapp ? `https://wa.me/${restaurant.whatsapp}?text=${message}` : null;

              return (
                <div key={order.id} className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-3xl border border-slate-700 shadow-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500 font-mono truncate">ID: {order.id}</p>
                      <h2 className="text-xl font-black text-white mt-1 truncate">
                        {restaurant?.name || 'Restaurante'}
                      </h2>
                      <p className="text-xs text-slate-400 font-bold mt-1">{createdAt}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${pillClass}`}>
                        {pillLabel}
                      </span>
                      <span className="text-2xl font-black text-white">R$ {order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-4">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Itens</h3>
                      <ul className="space-y-2">
                        {order.items.map((item, idx) => (
                          <li key={idx} className="flex justify-between text-sm">
                            <span className="text-slate-200">
                              <span className="font-black text-orange-500">{item.quantity}x</span> {item.name}
                            </span>
                            <span className="text-slate-400 font-medium">R$ {(item.quantity * item.price).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-4">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Entrega</h3>
                      <p className="text-sm text-slate-200 whitespace-pre-line">{order.address}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    {restaurant?.slug && (
                      <Link
                        href={`/r/${restaurant.slug}`}
                        className="bg-slate-900 hover:bg-slate-700 text-white font-black px-5 py-2 rounded-xl transition-all border border-slate-700 text-xs"
                      >
                        Ver Restaurante
                      </Link>
                    )}
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-green-600 hover:bg-green-700 text-white font-black px-5 py-2 rounded-xl transition-all shadow-lg shadow-green-500/20 text-xs"
                      >
                        Falar no WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
