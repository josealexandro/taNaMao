import { OrderItem } from '@/types/Order';

interface CartProps {
  items: OrderItem[];
  total: number;
  onFinishOrder: () => void;
  loading: boolean;
}

export default function Cart({ items, total, onFinishOrder, loading }: CartProps) {
  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-md border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">Carrinho</h2>
      
      {items.length === 0 ? (
        <p className="text-gray-400 text-center py-8">Seu carrinho está vazio.</p>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between items-center border-b border-gray-700 pb-2">
                <div>
                  <h4 className="font-semibold text-gray-200">{item.name}</h4>
                  <p className="text-sm text-gray-400">{item.quantity}x R$ {item.price.toFixed(2)}</p>
                </div>
                <p className="font-bold text-white">R$ {(item.quantity * item.price).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mb-8 border-t border-gray-700 pt-4">
            <span className="text-xl font-bold text-white">Total:</span>
            <span className="text-2xl font-extrabold text-green-400">R$ {total.toFixed(2)}</span>
          </div>

          <button
            onClick={onFinishOrder}
            disabled={loading}
            className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition-colors shadow-lg flex items-center justify-center disabled:opacity-50"
          >
            {loading ? (
              <span>Processando...</span>
            ) : (
              <>
                <span className="mr-2">Finalizar Pedido</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.767 5.767 0 3.18 2.586 5.766 5.767 5.766 3.18 0 5.766-2.586 5.766-5.766 0-3.181-2.586-5.767-5.766-5.767zm0 1.565c2.321 0 4.201 1.88 4.201 4.202 0 2.321-1.88 4.201-4.201 4.201-2.322 0-4.202-1.88-4.202-4.201 0-2.322 1.88-4.202 4.202-4.202zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                </svg>
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
