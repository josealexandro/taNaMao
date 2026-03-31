import { Product } from '@/types/Product';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col border border-gray-700">
      <div className="relative h-48 w-full">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-white mb-2">{product.name}</h3>
        <p className="text-xl font-bold text-green-400 mb-4">R$ {product.price.toFixed(2)}</p>
        <button
          onClick={() => onAddToCart(product)}
          className="mt-auto w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Adicionar ao carrinho
        </button>
      </div>
    </div>
  );
}
