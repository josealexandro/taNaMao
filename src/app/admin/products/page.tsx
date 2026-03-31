'use client';

import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Product } from '@/types/Product';
import Link from 'next/link';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !imageFile) {
      alert('Por favor, preencha todos os campos e selecione uma imagem.');
      return;
    }

    setLoading(true);
    try {
      // 1. Upload image to Firebase Storage
      const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      const imageUrl = await getDownloadURL(storageRef);

      // 2. Save product with the image URL to Firestore
      await addDoc(collection(db, 'products'), {
        name,
        price: parseFloat(price),
        image: imageUrl,
      });

      // 3. Reset form
      setName('');
      setPrice('');
      setImageFile(null);
      const fileInput = document.getElementById('imageInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error("Error adding product: ", error);
      alert('Erro ao cadastrar produto. Verifique se o Firebase Storage está ativo e com as regras de CORS configuradas.');
    } finally {
      setLoading(false);
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
    <div className="p-8 max-w-4xl mx-auto min-h-screen bg-gray-900 text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gerenciar Produtos</h1>
        <Link href="/admin" className="text-blue-400 hover:underline">Ver Pedidos</Link>
      </div>

      <form onSubmit={handleAddProduct} className="bg-gray-800 p-6 rounded-lg shadow-md mb-8 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-white">Novo Produto</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <input
            type="text"
            placeholder="Nome do produto"
            className="border border-gray-600 p-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Preço"
            className="border border-gray-600 p-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <input
            id="imageInput"
            type="file"
            accept="image/*"
            className="border border-gray-600 p-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 font-bold"
        >
          {loading ? 'Fazendo upload...' : 'Cadastrar Produto'}
        </button>
      </form>

      <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-700">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-700 text-gray-200">
            <tr>
              <th className="p-4 border-b border-gray-600">Imagem</th>
              <th className="p-4 border-b border-gray-600">Nome</th>
              <th className="p-4 border-b border-gray-600">Preço</th>
              <th className="p-4 border-b border-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody className="text-gray-300">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-700 transition-colors">
                <td className="p-4 border-b border-gray-600">
                  <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded" />
                </td>
                <td className="p-4 border-b border-gray-600 text-white">{product.name}</td>
                <td className="p-4 border-b border-gray-600 font-bold text-green-400">R$ {product.price.toFixed(2)}</td>
                <td className="p-4 border-b border-gray-600">
                  <button
                    onClick={() => handleDeleteProduct(product.id!)}
                    className="text-red-400 hover:text-red-300 hover:underline"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">Nenhum produto cadastrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
