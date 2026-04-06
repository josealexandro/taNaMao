'use client';

import { useState, useEffect } from 'react';
import { db, auth, storage } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, deleteDoc, Timestamp, where, serverTimestamp, deleteField } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Order, OrderItem, OrderStatus } from '@/types/Order';
import { Restaurant } from '@/types/Restaurant';
import Link from 'next/link';
import AdminGuard from '@/components/AdminGuard';
import { useRouter } from 'next/navigation';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [prevOrdersCount, setPrevOrdersCount] = useState(0);
  const [isUpdatingLogo, setIsUpdatingLogo] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedWhatsapp, setEditedWhatsapp] = useState('');
  const [editedIsOpen, setEditedIsOpen] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLogoExpanded, setIsLogoExpanded] = useState(false);
  const router = useRouter();

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
    if (normalized === 'pendente') return 'bg-orange-500/20 text-orange-400';
    if (normalized === 'aceito') return 'bg-blue-500/20 text-blue-400';
    if (normalized === 'preparando') return 'bg-purple-500/20 text-purple-400';
    if (normalized === 'saiu_entrega') return 'bg-cyan-500/20 text-cyan-400';
    if (normalized === 'concluido') return 'bg-green-500/20 text-green-400';
    if (normalized === 'cancelado') return 'bg-red-500/20 text-red-400';
    return 'bg-orange-500/20 text-orange-400';
  };

  const statusBorderClass = (status: OrderStatus | undefined) => {
    const normalized = normalizeOrderStatus(status);
    if (normalized === 'pendente') return 'border-orange-500';
    if (normalized === 'aceito') return 'border-blue-500';
    if (normalized === 'preparando') return 'border-purple-500';
    if (normalized === 'saiu_entrega') return 'border-cyan-500';
    if (normalized === 'concluido') return 'border-green-500';
    if (normalized === 'cancelado') return 'border-red-500';
    return 'border-orange-500';
  };

  const playNotificationSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log("Erro ao tocar som (interação do usuário necessária):", e));
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const restRef = doc(db, 'restaurants', user.uid);
        const unsubscribeRest = onSnapshot(restRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as Restaurant;
            setRestaurant({ ...data, id: docSnap.id } as Restaurant);
          }
        });
        return () => unsubscribeRest();
      } else {
        setRestaurant(null);
        router.push('/login');
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (isSettingsOpen && restaurant) {
      setEditedName(restaurant.name);
      setEditedWhatsapp(restaurant.whatsapp.replace('55', ''));
      setEditedIsOpen(restaurant.isOpen !== false);
    }
  }, [isSettingsOpen, restaurant]);

  useEffect(() => {
    if (!restaurant?.id) return;

    const q = query(
      collection(db, 'orders'), 
      where('restaurantId', '==', restaurant.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeOrders = onSnapshot(q, (querySnapshot) => {
      const ordersData: Order[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Order;
        
        if (normalizeOrderStatus(data.status) === 'concluido' && data.completedAt && hasToDate(data.completedAt)) {
          const now = new Date();
          const completedTime = data.completedAt.toDate();
          const diffInMinutes = (now.getTime() - completedTime.getTime()) / (1000 * 60);
          
          if (diffInMinutes >= 20) {
            deleteDoc(doc.ref);
            return;
          }
        }
        
        ordersData.push({ id: doc.id, ...data } as Order);
      });

      if (ordersData.length > prevOrdersCount && prevOrdersCount !== 0) {
        const hasNewPending = ordersData.some(o => normalizeOrderStatus(o.status) === 'pendente' && !orders.find(old => old.id === o.id));
        if (hasNewPending) playNotificationSound();
      }
      
      setOrders(ordersData);
      setPrevOrdersCount(ordersData.length);
    });

    return () => unsubscribeOrders();
  }, [restaurant?.id, prevOrdersCount, orders]);

  const handleToggleStore = async () => {
    if (!restaurant) return;
    const newStatus = restaurant.isOpen === false;
    try {
      await updateDoc(doc(db, 'restaurants', restaurant.id), {
        isOpen: newStatus
      });
    } catch (error) {
      console.error("Error toggling store: ", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleUpdateLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restaurant) return;

    setIsUpdatingLogo(true);
    try {
      const storageRef = ref(storage, `restaurants/${restaurant.id}/logo_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const logoUrl = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'restaurants', restaurant.id), {
        logoUrl: logoUrl
      });

      setRestaurant({ ...restaurant, logoUrl });
      alert('Logo atualizado com sucesso!');
    } catch (error) {
      console.error("Error updating logo: ", error);
      alert('Erro ao atualizar logo.');
    } finally {
      setIsUpdatingLogo(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    setIsSavingSettings(true);
    try {
      const digitsOnly = editedWhatsapp.replace(/\D/g, '');
      if (digitsOnly.length !== 11) {
        alert('O WhatsApp deve ter 11 dígitos (DDD + número).');
        setIsSavingSettings(false);
        return;
      }
      const formattedWhatsapp = '55' + digitsOnly;

      const restRef = doc(db, 'restaurants', restaurant.id);
      await updateDoc(restRef, {
        name: editedName,
        whatsapp: formattedWhatsapp,
        isOpen: editedIsOpen
      });

      setIsSettingsOpen(false);
      alert('Configurações salvas com sucesso!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error("Error saving settings: ", error);
      alert('Erro ao salvar configurações: ' + message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSetOrderStatus = async (orderId: string, newStatus: Exclude<OrderStatus, 'pending' | 'completed'>) => {
    try {
      const payload: Record<string, unknown> = {
        status: newStatus,
        updatedAt: serverTimestamp()
      };
      if (newStatus === 'concluido') {
        payload.completedAt = Timestamp.now();
      } else {
        payload.completedAt = deleteField();
      }
      await updateDoc(doc(db, 'orders', orderId), payload);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
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
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLogoExpanded((prev) => !prev)}
                className={`w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-orange-500/20 overflow-hidden border-2 border-slate-700 transition-transform duration-200 ${
                  isLogoExpanded ? 'scale-150 ring-4 ring-orange-500/40 shadow-2xl z-50' : 'hover:scale-105 active:scale-95'
                }`}
                title="Expandir logo"
              >
                {isUpdatingLogo ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : restaurant?.logoUrl ? (
                  <img src={restaurant.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  restaurant?.name?.charAt(0) || 'R'
                )}
              </button>
              <label
                className="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-700 rounded-full w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors shadow-lg"
                title="Alterar logo"
              >
                <span className="text-xs">📷</span>
                <input type="file" accept="image/*" onChange={handleUpdateLogo} className="hidden" disabled={isUpdatingLogo} />
              </label>
            </div>
            <div>
              <h2 className="text-sm font-black text-white">{restaurant?.name || 'Carregando...'}</h2>
              <button 
                onClick={handleToggleStore}
                className="flex items-center gap-2 hover:bg-slate-800/50 p-1 px-2 rounded-lg transition-all group"
                title={restaurant?.isOpen !== false ? 'Clique para Fechar a Loja' : 'Clique para Abrir a Loja'}
              >
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest group-hover:text-slate-300">Painel Administrativo</p>
                <span className={`w-1.5 h-1.5 rounded-full ${restaurant?.isOpen !== false ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span className={`text-[8px] font-black uppercase tracking-tighter ${restaurant?.isOpen !== false ? 'text-green-500' : 'text-red-500'}`}>
                  {restaurant?.isOpen !== false ? 'Aberto' : 'Fechado'}
                </span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-orange-500 px-4 py-2 rounded-lg transition-all font-bold border border-slate-700 flex items-center gap-2"
            >
              <span>⚙️</span> Configurações
            </button>
            <button
              onClick={handleLogout}
              className="text-xs bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 px-4 py-2 rounded-lg transition-all font-bold"
            >
              Sair
            </button>
          </div>
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
              <div
                key={order.id}
                className={`bg-slate-800/50 backdrop-blur-sm p-6 rounded-3xl border-t-4 shadow-xl flex flex-col justify-between cursor-pointer hover:bg-slate-800/70 transition-colors ${
                  statusBorderClass(order.status)
                }`}
                onClick={() => setSelectedOrder(order)}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-slate-500 font-mono truncate">
                          {order.orderNumber ? `Pedido #${order.orderNumber}` : `ID: ${order.id}`}
                        </p>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteOrder(order.id!);
                          }}
                          className="text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all p-1 active:scale-90"
                          title="Excluir pedido manualmente"
                        >
                          <span className="text-xs">🗑️</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 font-bold">
                        {hasToDate(order.createdAt) ? order.createdAt.toDate().toLocaleString('pt-BR') : 'Agora mesmo'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex-shrink-0 ${statusPillClass(order.status)}`}>
                      {statusLabel(order.status)}
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

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrder(order);
                    }}
                    className="w-full bg-white text-black font-black py-3 rounded-2xl hover:bg-slate-100 transition-all active:scale-95 shadow-xl"
                  >
                    Abrir Pedido
                  </button>
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

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 w-full max-w-md rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-xl font-black text-white italic">Configurações do Perfil</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-500 hover:text-white transition-colors text-2xl">✕</button>
            </div>
            
            <form onSubmit={handleSaveSettings} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Restaurante</label>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  placeholder="Nome do seu negócio"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">WhatsApp para Pedidos</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">+55</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={editedWhatsapp}
                    onChange={(e) => setEditedWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    className="w-full bg-slate-950 border border-slate-800 p-4 pl-12 rounded-2xl text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    placeholder="DDD + Número"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-widest">Status da Loja</p>
                  <p className="text-[10px] text-slate-500 font-medium">Controla se os clientes podem pedir</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditedIsOpen(!editedIsOpen)}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 ${editedIsOpen ? 'bg-green-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 ${editedIsOpen ? 'left-8' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
                >
                  {isSavingSettings ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div
          className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-slate-900 w-full max-w-2xl rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 sm:p-8 border-b border-slate-800 flex justify-between items-start gap-6 bg-slate-900/50">
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-mono truncate">
                  {selectedOrder.orderNumber ? `Pedido #${selectedOrder.orderNumber}` : `ID: ${selectedOrder.id}`}
                </p>
                <h2 className="text-2xl font-black text-white italic mt-1 truncate">{selectedOrder.clientName}</h2>
                <p className="text-xs text-slate-400 font-bold mt-1">{selectedOrder.clientPhone}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusPillClass(selectedOrder.status)}`}>
                  {statusLabel(selectedOrder.status)}
                </span>
                <button onClick={() => setSelectedOrder(null)} className="text-slate-500 hover:text-white transition-colors text-2xl">✕</button>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Endereço</p>
                  <p className="text-sm text-slate-200 whitespace-pre-line">{selectedOrder.address}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Total</p>
                  <p className="text-3xl font-black text-white">R$ {selectedOrder.total.toFixed(2)}</p>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Itens</p>
                <ul className="space-y-2">
                  {selectedOrder.items.map((item: OrderItem, index: number) => (
                    <li key={index} className="flex justify-between text-sm">
                      <span className="text-slate-200">
                        <span className="font-black text-orange-500">{item.quantity}x</span> {item.name}
                      </span>
                      <span className="text-slate-400 font-medium">R$ {(item.quantity * item.price).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => selectedOrder.id && handleSetOrderStatus(selectedOrder.id, 'aceito')}
                  disabled={normalizeOrderStatus(selectedOrder.status) === 'aceito'}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-3 rounded-2xl transition-all"
                >
                  Aceitar
                </button>
                <button
                  onClick={() => selectedOrder.id && handleSetOrderStatus(selectedOrder.id, 'preparando')}
                  disabled={normalizeOrderStatus(selectedOrder.status) === 'preparando'}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black py-3 rounded-2xl transition-all"
                >
                  Preparando
                </button>
                <button
                  onClick={() => selectedOrder.id && handleSetOrderStatus(selectedOrder.id, 'saiu_entrega')}
                  disabled={normalizeOrderStatus(selectedOrder.status) === 'saiu_entrega'}
                  className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-black py-3 rounded-2xl transition-all"
                >
                  Saiu p/ entrega
                </button>
                <button
                  onClick={() => selectedOrder.id && handleSetOrderStatus(selectedOrder.id, 'concluido')}
                  disabled={normalizeOrderStatus(selectedOrder.status) === 'concluido'}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-black py-3 rounded-2xl transition-all sm:col-span-2"
                >
                  Concluir
                </button>
                <button
                  onClick={() => selectedOrder.id && handleSetOrderStatus(selectedOrder.id, 'cancelado')}
                  disabled={normalizeOrderStatus(selectedOrder.status) === 'cancelado'}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black py-3 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </AdminGuard>
  );
}
