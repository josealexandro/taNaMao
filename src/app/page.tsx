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
      const phoneNumber = "5511999999999"; // Exemplo, você pode mudar para o seu número
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
    <main className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-12">
        <h1 className="text-4xl font-extrabold text-orange-500 tracking-tight italic">taNaMão</h1>
        <Link href="/admin" className="text-gray-400 hover:text-blue-400 font-medium">Admin</Link>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-gray-100 mb-6">Nossos Produtos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
            {products.length === 0 && (
              <p className="col-span-2 text-center text-gray-500 py-12">Carregando produtos...</p>
            )}
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-8">
            <Cart
              items={cart}
              total={calculateTotal()}
              onFinishOrder={handleFinishOrder}
              loading={loading}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}
