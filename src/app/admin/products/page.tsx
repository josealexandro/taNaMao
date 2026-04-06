'use client';

import { useState, useEffect } from 'react';
import { db, storage, auth } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, deleteDoc, doc, where, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { Product } from '@/types/Product';
import Link from 'next/link';
import AdminGuard from '@/components/AdminGuard';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const categories = ['Pizzas', 'Lanches', 'Bebidas', 'Sobremesas', 'Outros'];

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setRestaurantId(user.uid);
        
        // Buscar o SLUG do restaurante para o link de volta
        const restRef = doc(db, 'restaurants', user.uid);
        const restSnap = await getDoc(restRef);
        if (restSnap.exists()) {
          setRestaurantSlug(restSnap.data().slug);
        }

        const q = query(
          collection(db, 'products'), 
          where('restaurantId', '==', user.uid)
        );
        const unsubscribeProducts = onSnapshot(q, (querySnapshot) => {
          const productsData: Product[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            productsData.push({ 
              id: doc.id, 
              ...data,
              isActive: data.isActive !== false // Default true
            } as Product);
          });
          setProducts(productsData);
        });
        return () => unsubscribeProducts();
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !restaurantId || !category) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = editingProduct?.image || '';

      // 1. Upload new image if provided
      if (imageFile) {
        const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      } else if (!editingProduct) {
        alert('Por favor, selecione uma imagem para o novo produto.');
        setLoading(false);
        return;
      }

      // 2. Save or Update product
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id!), {
          name,
          price: parseFloat(price),
          image: imageUrl,
          category,
        });
        alert('Produto atualizado com sucesso!');
      } else {
        await addDoc(collection(db, 'products'), {
          name,
          price: parseFloat(price),
          image: imageUrl,
          restaurantId,
          category,
          isActive: true,
        });
        alert('Produto adicionado com sucesso!');
      }

      // 3. Reset form
      setName('');
      setPrice('');
      setCategory('');
      setImageFile(null);
      setEditingProduct(null);
      const fileInput = document.getElementById('imageInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error("Error saving product: ", error);
      alert('Erro ao salvar produto.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setCategory(product.category);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setCategory('');
    setImageFile(null);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'products', id), {
        isActive: !currentStatus
      });
    } catch (error) {
      console.error("Error toggling status: ", error);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        console.error("Error deleting product: ", error);
      }
    }
  };

  return (
    <AdminGuard>
      <div className="p-8 max-w-5xl mx-auto min-h-screen bg-[#0f172a] text-white">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black text-white italic">Gerenciar Cardápio</h1>
            <p className="text-slate-400 mt-1">Adicione ou remova itens do seu restaurante</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href={restaurantSlug ? `/r/${restaurantSlug}` : "/"} className="bg-slate-800 hover:bg-slate-700 text-orange-500 px-6 py-2 rounded-xl font-bold transition-all border border-slate-700 flex items-center gap-2">
              <span>🏠</span> Voltar para a Loja
            </Link>
            <Link href="/admin" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2">
              <span>📦</span> Ver Pedidos
            </Link>
          </div>
        </header>

        <form onSubmit={handleAddProduct} className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-3xl border border-slate-700 shadow-2xl mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-orange-500">{editingProduct ? '📝' : '➕'}</span> 
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </h2>
            {editingProduct && (
              <button 
                type="button" 
                onClick={handleCancelEdit}
                className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded-lg font-bold transition-all"
              >
                Cancelar Edição
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Item</label>
              <input
                type="text"
                placeholder="Ex: X-Salada Especial"
                className="w-full bg-slate-900/50 border border-slate-700 p-3 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
              <select
                className="w-full bg-slate-900/50 border border-slate-700 p-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all appearance-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="" disabled>Selecionar...</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full bg-slate-900/50 border border-slate-700 p-3 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                {editingProduct ? 'Nova Imagem (opcional)' : 'Imagem'}
              </label>
              <input
                id="imageInput"
                type="file"
                accept="image/*"
                className="w-full bg-slate-900/50 border border-slate-700 p-2.5 rounded-xl text-slate-400 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-orange-500 file:text-white hover:file:bg-orange-600 transition-all"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                required={!editingProduct}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`mt-8 px-8 py-3 rounded-xl disabled:opacity-50 font-black transition-all shadow-lg active:scale-95 flex items-center gap-2 ${
              editingProduct 
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 text-white' 
                : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20 text-white'
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{editingProduct ? 'Salvando...' : 'Cadastrando...'}</span>
              </>
            ) : (
              <>
                <span>{editingProduct ? '💾' : '🚀'}</span>
                <span>{editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}</span>
              </>
            )}
          </button>
        </form>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-700">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                <th className="p-6 border-b border-slate-700">Imagem</th>
                <th className="p-6 border-b border-slate-700">Nome / Categoria</th>
                <th className="p-6 border-b border-slate-700">Preço</th>
                <th className="p-6 border-b border-slate-700">Status</th>
                <th className="p-6 border-b border-slate-700">Ações</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {products.map((product) => (
                <tr key={product.id} className={`hover:bg-slate-700/30 transition-colors group ${!product.isActive ? 'opacity-50' : ''}`}>
                  <td className="p-6 border-b border-slate-700">
                    <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-2xl shadow-lg border border-slate-700 group-hover:scale-110 transition-transform" />
                  </td>
                  <td className="p-6 border-b border-slate-700">
                    <p className="font-bold text-white">{product.name}</p>
                    <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-400 font-bold uppercase">{product.category}</span>
                  </td>
                  <td className="p-6 border-b border-slate-700 font-black text-orange-500 text-lg">R$ {product.price.toFixed(2)}</td>
                  <td className="p-6 border-b border-slate-700">
                    <button
                      onClick={() => handleToggleActive(product.id!, product.isActive)}
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all ${
                        product.isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-500'
                      }`}
                    >
                      {product.isActive ? 'Disponível' : 'Indisponível'}
                    </button>
                  </td>
                  <td className="p-6 border-b border-slate-700">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 p-2 rounded-lg transition-all active:scale-90"
                        title="Editar produto"
                      >
                        <span className="text-xl">📝</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id!)}
                        className="text-slate-500 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-all active:scale-90"
                        title="Excluir produto"
                      >
                        <span className="text-xl">🗑️</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center">
                    <div className="text-5xl mb-4 opacity-20">🍽️</div>
                    <p className="text-slate-500 font-bold">Nenhum produto cadastrado ainda.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminGuard>
  );
}
