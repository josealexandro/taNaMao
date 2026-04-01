'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Order } from '@/types/Order';
import Link from 'next/link';
import AdminGuard from '@/components/AdminGuard';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
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
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, []);

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

  return (
    <AdminGuard>
      <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-900 text-white">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black text-white italic">Painel de Pedidos</h1>
            <p className="text-slate-400 mt-1">Gerencie os pedidos em tempo real</p>
          </div>
          <Link href="/admin/products" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20">
            Gerenciar Produtos
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div key={order.id} className={`bg-slate-800/50 backdrop-blur-sm p-6 rounded-3xl border-t-4 shadow-xl flex flex-col justify-between ${
              order.status === 'pending' ? 'border-orange-500' : 'border-green-500'
            }`}>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="overflow-hidden">
                    <p className="text-[10px] text-slate-500 font-mono truncate">ID: {order.id}</p>
                    <p className="text-xs text-slate-400 font-bold">
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('pt-BR') : 'Agora mesmo'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    order.status === 'pending' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'
                  }`}>
                    {order.status === 'pending' ? 'Pendente' : 'Concluído'}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-slate-700/50 pb-2">Itens</h3>
                  <ul className="space-y-2">
                    {order.items.map((item, index) => (
                      <li key={index} className="flex justify-between text-sm">
                        <span className="text-slate-200">
                          <span className="font-bold text-orange-500">{item.quantity}x</span> {item.name}
                        </span>
                        <span className="text-slate-400 font-medium">R$ {(item.quantity * item.price).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
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
        
        <div className="mt-12 text-center">
          <Link href="/" className="text-slate-500 hover:text-white transition-colors font-medium">← Voltar para a Loja</Link>
        </div>
      </div>
    </AdminGuard>
  );
}


