'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, deleteDoc, Timestamp, where, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Order, OrderItem } from '@/types/Order';
import { Restaurant } from '@/types/Restaurant';
import Link from 'next/link';
import AdminGuard from '@/components/AdminGuard';
import { useRouter } from 'next/navigation';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [prevOrdersCount, setPrevOrdersCount] = useState(0);
  const router = useRouter();

  // Som de notificação
  const playNotificationSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log("Erro ao tocar som (interação do usuário necessária):", e));
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Buscar dados do restaurante logado
        const docRef = doc(db, 'restaurants', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRestaurant({ id: docSnap.id, ...docSnap.data() } as Restaurant);
          
          // Buscar apenas os pedidos deste restaurante
          const q = query(
            collection(db, 'orders'), 
            where('restaurantId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );
          const unsubscribeOrders = onSnapshot(q, (querySnapshot) => {
            const ordersData: Order[] = [];
            querySnapshot.forEach((doc) => {
              const data = doc.data() as Order;
              
              // Lógica de auto-exclusão: se concluído e passou 20 min, apagar
              if (data.status === 'completed' && data.completedAt) {
                const now = new Date();
                const completedTime = data.completedAt.toDate();
                const diffInMinutes = (now.getTime() - completedTime.getTime()) / (1000 * 60);
                
                if (diffInMinutes >= 20) {
                  deleteDoc(doc.ref);
                  return; // Não adiciona na lista
                }
              }
              
              ordersData.push({ id: doc.id, ...data } as Order);
            });

            // Tocar som se houver um NOVO pedido (comparando com a contagem anterior)
            if (ordersData.length > prevOrdersCount && prevOrdersCount !== 0) {
              const hasNewPending = ordersData.some(o => o.status === 'pending' && !orders.find(old => old.id === o.id));
              if (hasNewPending) playNotificationSound();
            }
            
            setOrders(ordersData);
            setPrevOrdersCount(ordersData.length);
          });
          return () => unsubscribeOrders();
        }
      }
    });

    return () => unsubscribeAuth();
  }, [prevOrdersCount, orders]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleUpdateStatus = async (orderId: string, currentStatus: string) => {
    if (currentStatus === 'completed') return;

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'completed',
        completedAt: Timestamp.now() // Salva o momento da conclusão
      });
    } catch (error) {
      console.error("Error updating order status: ", error);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Tem certeza que deseja excluir este pedido permanentemente?')) return;

    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (error) {
      console.error("Error deleting order: ", error);
      alert('Erro ao excluir pedido.');
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#0f172a] text-white">
        {/* Top Navigation Bar */}
        <nav className="bg-slate-900 border-b border-slate-800 p-4 px-8 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-orange-500/20">
              {restaurant?.name?.charAt(0) || 'R'}
            </div>
            <div>
              <h2 className="text-sm font-black text-white">{restaurant?.name || 'Carregando...'}</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Painel Administrativo</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 px-4 py-2 rounded-lg transition-all font-bold"
          >
            Sair do Admin
          </button>
        </nav>

        <div className="p-8 max-w-7xl mx-auto">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
            <div>
              <h1 className="text-4xl font-black text-white italic">Painel de Pedidos</h1>
              <p className="text-slate-400 mt-1">Gerencie os pedidos em tempo real</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link href={restaurant ? `/r/${restaurant.slug}` : "/"} className="bg-slate-800 hover:bg-slate-700 text-orange-500 px-6 py-2 rounded-xl font-bold transition-all border border-slate-700 flex items-center gap-2">
                <span>🏠</span> Voltar para a Loja
              </Link>
              <Link href="/admin/products" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2">
                <span>📋</span> Gerenciar Cardápio
              </Link>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order: Order) => (
              <div key={order.id} className={`bg-slate-800/50 backdrop-blur-sm p-6 rounded-3xl border-t-4 shadow-xl flex flex-col justify-between ${
                order.status === 'pending' ? 'border-orange-500' : 'border-green-500'
              }`}>
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-slate-500 font-mono truncate">ID: {order.id}</p>
                        <button 
                          onClick={() => handleDeleteOrder(order.id!)}
                          className="text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all p-1 active:scale-90"
                          title="Excluir pedido manualmente"
                        >
                          <span className="text-xs">🗑️</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 font-bold">
                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('pt-BR') : 'Agora mesmo'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex-shrink-0 ${
                      order.status === 'pending' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {order.status === 'pending' ? 'Pendente' : 'Concluído'}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-slate-700/50 pb-2">Cliente</h3>
                    <div className="text-sm text-slate-200 bg-slate-900/50 p-3 rounded-xl border border-slate-700/30">
                      <p className="font-bold text-orange-500">{order.clientName}</p>
                      <p className="text-xs text-slate-400 mt-1">{order.clientPhone}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-slate-700/50 pb-2">Itens</h3>
                    <ul className="space-y-2">
                      {order.items.map((item: OrderItem, index: number) => (
                        <li key={index} className="flex justify-between text-sm">
                          <span className="text-slate-200">
                            <span className="font-bold text-orange-500">{item.quantity}x</span> {item.name}
                          </span>
                          <span className="text-slate-400 font-medium">R$ {(item.quantity * item.price).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2 mb-6">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-slate-700/50 pb-2">Endereço</h3>
                    <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-700/30 whitespace-pre-line">
                      {order.address}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-slate-400 font-bold">Total</span>
                    <span className="text-2xl font-black text-white">R$ {order.total.toFixed(2)}</span>
                  </div>

                  {order.status === 'pending' ? (
                    <button
                      onClick={() => handleUpdateStatus(order.id!, order.status)}
                      className="w-full bg-white text-black font-black py-3 rounded-2xl hover:bg-slate-100 transition-all active:scale-95 shadow-xl"
                    >
                      Confirmar Pedido
                    </button>
                  ) : (
                    <div className="text-center text-[10px] text-slate-500 italic">
                      Este pedido será removido automaticamente em breve.
                    </div>
                  )}
                </div>
              </div>
            ))}

            {orders.length === 0 && (
              <div className="col-span-full text-center py-20 bg-slate-800/20 rounded-3xl border border-dashed border-slate-700">
                <div className="text-5xl mb-4 opacity-20">📭</div>
                <p className="text-slate-500 font-bold text-xl">Nenhum pedido no momento.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}


