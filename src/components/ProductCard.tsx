import { Product } from '@/types/Product';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden hover:shadow-orange-500/10 md:hover:scale-[1.02] transition-all duration-300 flex flex-row md:flex-col border border-slate-700/50 group h-[140px] md:h-auto">
      {/* Imagem - Ajustada para horizontal no mobile */}
      <div className="relative w-[120px] md:w-full h-full md:h-56 overflow-hidden flex-shrink-0">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {/* Preço flutuante apenas no Desktop */}
        <div className="hidden md:block absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700">
          <span className="text-orange-400 font-bold text-sm">R$ {product.price.toFixed(2)}</span>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-3 md:p-5 flex flex-col flex-grow min-w-0">
        <h3 className="text-sm md:text-xl font-bold text-white mb-1 md:mb-2 group-hover:text-orange-400 transition-colors truncate">
          {product.name}
        </h3>
        <p className="text-[11px] md:text-sm text-slate-400 mb-2 md:mb-6 line-clamp-2 md:line-clamp-3 leading-tight md:leading-normal">
          Sabor irresistível preparado com os melhores ingredientes.
        </p>
        
        <div className="mt-auto flex items-center justify-between md:block">
          {/* Preço no Mobile */}
          <span className="md:hidden text-orange-500 font-black text-sm">
            R$ {product.price.toFixed(2)}
          </span>

          <button
            onClick={() => onAddToCart(product)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-black py-1.5 md:py-3 px-4 md:px-0 md:w-full rounded-lg md:rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 text-[11px] md:text-base"
          >
            <span>{window.innerWidth < 768 ? 'Pedir' : 'Adicionar'}</span>
            <span className="hidden md:inline text-xl">🛒</span>
          </button>
        </div>
      </div>
    </div>
  );
}
