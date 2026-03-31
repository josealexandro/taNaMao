'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore';
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
        ordersData.push({ id: doc.id, ...doc.data() } as Order);
      });
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (orderId: string, currentStatus: string) => {
    if (currentStatus === 'completed') return;

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'completed'
      });
    } catch (error) {
      console.error("Error updating order status: ", error);
    }
  };

  return (
    <AdminGuard>
      <div className="p-8 max-w-6xl mx-auto min-h-screen bg-gray-900 text-white">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Painel de Pedidos</h1>
          <Link href="/admin/products" className="text-blue-400 hover:underline">Gerenciar Produtos</Link>
        </div>

        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-blue-500 border-t border-r border-b border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-400">ID: {order.id}</p>
                  <p className="text-sm text-gray-400">
                    Data: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : 'Recent'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    order.status === 'pending' ? 'bg-yellow-900 text-yellow-200' : 'bg-green-900 text-green-200'
                  }`}>
                    {order.status === 'pending' ? 'Pendente' : 'Concluído'}
                  </span>
                  <p className="text-xl font-bold mt-2 text-white">Total: R$ {order.total.toFixed(2)}</p>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <h3 className="font-semibold mb-2 text-gray-200">Itens:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {order.items.map((item, index) => (
                    <li key={index} className="text-gray-300">
                      {item.quantity}x {item.name} - <span className="text-green-400">R$ {(item.quantity * item.price).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {order.status === 'pending' && (
                <button
                  onClick={() => handleUpdateStatus(order.id!, order.status)}
                  className="mt-6 w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors font-bold"
                >
                  Marcar como Concluído
                </button>
              )}
            </div>
          ))}

          {orders.length === 0 && (
            <div className="text-center py-12 bg-gray-800 rounded-lg shadow-md border border-gray-700">
              <p className="text-gray-500">Nenhum pedido encontrado.</p>
            </div>
          )}
        </div>
        
        <div className="mt-8">
          <Link href="/" className="text-gray-400 hover:text-white hover:underline">Voltar para a Loja</Link>
        </div>
      </div>
    </AdminGuard>
  );
}

