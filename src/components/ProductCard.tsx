import { Product } from '@/types/Product';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden hover:shadow-orange-500/10 hover:scale-[1.02] transition-all duration-300 flex flex-col border border-slate-700/50 group">
      <div className="relative h-56 w-full overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700">
          <span className="text-orange-400 font-bold">R$ {product.price.toFixed(2)}</span>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">{product.name}</h3>
        <p className="text-sm text-slate-400 mb-6 line-clamp-2">Sabor irresistível preparado com os melhores ingredientes especialmente para você.</p>
        
        <button
          onClick={() => onAddToCart(product)}
          className="mt-auto w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95"
        >
          <span>Adicionar</span>
          <span className="text-xl">🛒</span>
        </button>
      </div>
    </div>
  );
}
