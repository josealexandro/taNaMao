'use client';

import { useState, useEffect } from 'react';
import { db, auth, googleProvider } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, serverTimestamp, limit, where } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { Product } from '@/types/Product';
import { OrderItem } from '@/types/Order';
import { Restaurant } from '@/types/Restaurant';
import ProductCard from '@/components/ProductCard';
import Cart from '@/components/Cart';
import Link from 'next/link';

import { useParams } from 'next/navigation';

export default function Home() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Buscar o restaurante baseado no SLUG da URL
    const qRest = query(collection(db, 'restaurants'), where('slug', '==', slug), limit(1));
    const unsubscribeRest = onSnapshot(qRest, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const restDoc = querySnapshot.docs[0];
        const restData = { id: restDoc.id, ...restDoc.data() } as Restaurant;
        setRestaurant(restData);
        
        // Buscar produtos APENAS deste restaurante e que estejam ATIVOS
        const qProd = query(
          collection(db, 'products'),
          where('restaurantId', '==', restData.id),
          where('isActive', '==', true)
        );
        const unsubscribeProducts = onSnapshot(qProd, (querySnapshot) => {
          const productsData: Product[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.isActive !== false) {
              productsData.push({ id: doc.id, ...data } as Product);
            }
          });
          setProducts(productsData);
        });
        return () => unsubscribeProducts();
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeRest();
    };
  }, [slug]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.name === product.name);
      if (existingItem) {
        return prevCart.map((item) =>
          item.name === product.name
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { name: product.name, quantity: 1, price: product.price }];
    });
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const generateWhatsAppMessage = (items: OrderItem[], total: number, address: string) => {
    let message = `*Novo Pedido Realizado no ${restaurant?.name || 'taNaMão'}!*\n\n`;
    message += "*Itens:*\n";
    items.forEach((item) => {
      message += `- ${item.quantity}x ${item.name} (R$ ${item.price.toFixed(2)} cada)\n`;
    });
    message += `\n*Total:* R$ ${total.toFixed(2)}\n\n`;
    message += `*Endereço de Entrega:*\n${address}`;
    return encodeURIComponent(message);
  };

  const handleFinishOrder = async (address: string, clientName: string, clientPhone: string) => {
    if (cart.length === 0 || !restaurant) return;

    setLoading(true);
    const total = calculateTotal();

    try {
      // Save to Firestore
      await addDoc(collection(db, 'orders'), {
        items: cart,
        total: total,
        address: address,
        clientName: clientName,
        clientPhone: clientPhone,
        status: 'pending',
        createdAt: serverTimestamp(),
        restaurantId: restaurant.id,
      });

      // Generate WhatsApp link
      const message = generateWhatsAppMessage(cart, total, address);
      const phoneNumber = restaurant.whatsapp || "5511999999999";
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

      // Show success animation
      setShowSuccess(true);

      // Reset cart and open WhatsApp after animation
      setTimeout(() => {
        setShowSuccess(false);
        setCart([]);
        window.open(whatsappUrl, '_blank');
      }, 7500); // 7.5 seconds for even slower animation
    } catch (error) {
      console.error("Error creating order: ", error);
      alert('Erro ao realizar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-10">
      {/* Success Animation Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-500 overflow-hidden">
          <div className="text-center">
            <div className="relative inline-block">
              <div className="relative inline-block animate-bike-delivery">
                {/* Poeira atrás (posicionada na traseira da moto e invertida) */}
                <span className="absolute -left-6 bottom-8 md:-left-10 md:bottom-12 text-4xl md:text-5xl opacity-70 inline-block -scale-x-100">💨</span>
                
                {/* Imagem personalizada do entregador */}
                <img 
                  src="/entregador.png" 
                  alt="Entregador Rally" 
                  className="w-40 h-40 md:w-64 md:h-64 object-contain"
                  onError={(e) => {
                    // Fallback para o emoji caso a imagem não exista
                    (e.target as any).style.display = 'none';
                    const nextEl = (e.target as any).nextSibling;
                    if (nextEl) nextEl.style.display = 'inline';
                  }}
                />
                <span className="text-8xl md:text-9xl hidden">🏍️</span>
              </div>
              <div className="absolute -bottom-4 left-0 w-full h-2 bg-orange-500/20 blur-xl rounded-full animate-pulse"></div>
            </div>
            <h2 className="text-4xl font-black text-white mt-8 animate-bounce tracking-tight">Pedido Realizado!</h2>
            <p className="text-orange-500 font-bold mt-2 text-xl italic">Sua entrega radical está a caminho!</p>
          </div>
        </div>
      )}

      <header className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center mb-16 gap-6">
        <div className="flex flex-col items-center sm:items-start">
          <Link href="/">
            <img 
              src="/tanamao_512.png" 
              alt="taNaMão Logo" 
              className="h-24 md:h-32 lg:h-40 w-auto object-contain drop-shadow-[0_0_20px_rgba(249,115,22,0.5)]"
            />
          </Link>
          <h1 className="text-2xl font-black text-white mt-4">{restaurant?.name || 'taNaMão'}</h1>
          <p className="text-slate-400 font-medium mt-1 text-center sm:text-left italic">
            O sabor que você deseja, na velocidade que você precisa.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4 bg-slate-800/50 p-2 pl-4 rounded-full border border-slate-700">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-slate-200">{user.displayName || user.email}</span>
                <Link href="/admin" className="text-[10px] text-orange-500 font-black uppercase hover:underline">
                  Acessar Painel
                </Link>
              </div>
              <button 
                onClick={handleLogout}
                className="bg-slate-700 hover:bg-red-900/30 text-slate-300 hover:text-red-400 p-2 rounded-full transition-all"
                title="Sair"
              >
                <span className="text-sm">🚪</span>
              </button>
              {user.photoURL && <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border-2 border-orange-500" />}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button 
                onClick={handleLogin}
                className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-full text-white font-bold transition-all shadow-lg shadow-orange-500/20 active:scale-95 flex items-center gap-2 text-sm"
              >
                <span>Login Cliente</span>
                <span className="text-lg">👤</span>
              </button>
              <Link 
                href="/login"
                className="bg-slate-800/50 hover:bg-slate-700 px-6 py-3 rounded-full text-white font-bold transition-all border border-slate-700 active:scale-95 flex items-center gap-2 text-sm"
              >
                <span>Sou Restaurante</span>
                <span className="text-lg">🏪</span>
              </Link>
            </div>
          )}
        </div>
      </header>


      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-8 w-1.5 bg-orange-500 rounded-full"></div>
            <h2 className="text-3xl font-black text-white italic tracking-tight">Nosso Cardápio</h2>
          </div>
          
          <div className="space-y-16">
            {Array.from(new Set(products.map(p => p.category))).map(cat => (
              <div key={cat} className="space-y-8">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-black text-orange-500 uppercase tracking-[0.2em]">{cat}</h3>
                  <div className="flex-1 h-[1px] bg-slate-800"></div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {products.filter(p => p.category === cat).map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={addToCart}
                    />
                  ))}
                </div>
              </div>
            ))}
            
            {products.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-800/20 rounded-3xl border border-dashed border-slate-700">
                <div className="text-5xl mb-4 animate-pulse">🍳</div>
                <p className="text-slate-500 font-bold">Aguardando cardápio...</p>
              </div>
            )}
          </div>
        </div>

        {/* Lado do Carrinho */}
        <aside className="hidden md:block lg:col-span-4">
          <div className="sticky top-10">
            <Cart
              items={cart}
              total={calculateTotal()}
              onFinishOrder={handleFinishOrder}
              loading={loading}
            />
          </div>
        </aside>

        {/* Carrinho Mobile */}
        <div className="md:hidden">
          <Cart
            items={cart}
            total={calculateTotal()}
            onFinishOrder={handleFinishOrder}
            loading={loading}
          />
        </div>
      </div>

      <footer className="max-w-7xl mx-auto mt-20 pt-10 border-t border-slate-800/50 text-center">
        <p className="text-slate-500 text-sm font-medium">© 2024 taNaMão Delivery. Sistema Multi-Restaurantes.</p>
      </footer>
    </main>
  );
}
