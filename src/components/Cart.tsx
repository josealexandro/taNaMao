import { OrderItem } from '@/types/Order';

interface CartProps {
  items: OrderItem[];
  total: number;
  onFinishOrder: () => void;
  loading: boolean;
}

export default function Cart({ items, total, onFinishOrder, loading }: CartProps) {
  return (
    <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 w-full max-w-md border border-slate-700/50">
      <div className="flex items-center gap-3 mb-8">
        <span className="text-3xl">🛒</span>
        <h2 className="text-2xl font-black text-white">Seu Carrinho</h2>
      </div>
      
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-6xl mb-4 opacity-20">🥡</div>
          <p className="text-slate-400 font-medium">Seu carrinho está vazio.</p>
          <p className="text-slate-500 text-sm mt-1">Adicione produtos deliciosos para continuar!</p>
        </div>
      ) : (
        <>
          <div className="space-y-5 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between items-center group">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-100 group-hover:text-orange-400 transition-colors">{item.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-md font-bold">{item.quantity}x</span>
                    <span className="text-xs text-slate-500">R$ {item.price.toFixed(2)}</span>
                  </div>
                </div>
                <p className="font-black text-white ml-4">R$ {(item.quantity * item.price).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4 mb-8 border-t border-slate-700/50 pt-6">
            <div className="flex justify-between items-center text-slate-400 text-sm">
              <span>Subtotal</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400 text-sm">
              <span>Taxa de entrega</span>
              <span className="text-green-400 font-bold italic">GRÁTIS</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-xl font-bold text-white">Total:</span>
              <span className="text-3xl font-black text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]">
                R$ {total.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={onFinishOrder}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black py-5 rounded-2xl transition-all duration-300 shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processando...</span>
              </div>
            ) : (
              <>
                <span className="text-lg">Finalizar Pedido</span>
                <span className="text-2xl animate-bounce-horizontal">🚀</span>
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
