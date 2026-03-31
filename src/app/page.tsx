'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, serverTimestamp } from 'firebase/firestore';
import { Product } from '@/types/Product';
import { OrderItem } from '@/types/Order';
import ProductCard from '@/components/ProductCard';
import Cart from '@/components/Cart';
import Link from 'next/link';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const productsData: Product[] = [];
      querySnapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(productsData);
    });

    return () => unsubscribe();
  }, []);

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

  const generateWhatsAppMessage = (items: OrderItem[], total: number) => {
    let message = "*Novo Pedido Realizado!*\n\n";
    message += "*Itens:*\n";
    items.forEach((item) => {
      message += `- ${item.quantity}x ${item.name} (R$ ${item.price.toFixed(2)} cada)\n`;
    });
    message += `\n*Total:* R$ ${total.toFixed(2)}`;
    return encodeURIComponent(message);
  };

  const handleFinishOrder = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    const total = calculateTotal();

    try {
      // Save to Firestore
      await addDoc(collection(db, 'orders'), {
        items: cart,
        total: total,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // Generate WhatsApp link
      const message = generateWhatsAppMessage(cart, total);
      const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5511999999999";
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

      // Reset cart and open WhatsApp
      setCart([]);
      window.open(whatsappUrl, '_blank');
      alert('Pedido realizado com sucesso! Você será redirecionado para o WhatsApp.');
    } catch (error) {
      console.error("Error creating order: ", error);
      alert('Erro ao realizar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-10">
      <header className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center mb-16 gap-6">
        <div className="flex flex-col items-center sm:items-start">
          <h1 className="text-6xl font-black tracking-tighter italic text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]">
            taNaMão
          </h1>
          <p className="text-slate-400 font-medium mt-1">O sabor que você deseja, na velocidade que você precisa.</p>
        </div>
        <Link 
          href="/admin" 
          className="bg-slate-800/50 hover:bg-slate-700/50 px-6 py-2 rounded-full border border-slate-700 text-sm font-bold transition-all"
        >
          Painel Admin
        </Link>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-8 w-1.5 bg-orange-500 rounded-full"></div>
            <h2 className="text-3xl font-black text-white">Cardápio Especial</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
            {products.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-800/20 rounded-3xl border border-dashed border-slate-700">
                <div className="text-5xl mb-4 animate-pulse">🍳</div>
                <p className="text-slate-500 font-bold">Preparando o cardápio...</p>
              </div>
            )}
          </div>
        </div>

        <aside className="lg:col-span-4">
          <div className="sticky top-10">
            <Cart
              items={cart}
              total={calculateTotal()}
              onFinishOrder={handleFinishOrder}
              loading={loading}
            />
          </div>
        </aside>
      </div>

      <footer className="max-w-7xl mx-auto mt-20 pt-10 border-t border-slate-800/50 text-center">
        <p className="text-slate-500 text-sm font-medium">© 2024 taNaMão Delivery. Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}
