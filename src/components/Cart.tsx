import { OrderItem } from '@/types/Order';
import { useState } from 'react';

interface CartProps {
  items: OrderItem[];
  total: number;
  onFinishOrder: (address: string, clientName: string, clientPhone: string) => void;
  loading: boolean;
}

export default function Cart({ items, total, onFinishOrder, loading }: CartProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [addressData, setAddressData] = useState({
    clientName: '',
    clientPhone: '',
    street: '',
    number: '',
    neighborhood: '',
    complement: '',
    reference: '',
    city: ''
  });
  
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressData(prev => ({ ...prev, [name]: value }));
  };

  const renderCartContent = () => (
    <div className="bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full border border-slate-700/50 max-h-[90vh] flex flex-col overflow-hidden">
      {/* Header Fixo */}
      <div className="p-6 md:p-8 pb-4 flex items-center justify-between border-b border-slate-700/30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🛒</span>
          <h2 className="text-2xl font-black text-white">Seu Carrinho</h2>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="md:hidden text-slate-400 hover:text-white p-2"
        >
          <span className="text-2xl">✕</span>
        </button>
      </div>
      
      {/* Conteúdo Rolável (Itens + Endereço) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 pt-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-6xl mb-4 opacity-20">🥡</div>
            <p className="text-slate-400 font-medium">Seu carrinho está vazio.</p>
            <p className="text-slate-500 text-sm mt-1">Adicione produtos deliciosos para continuar!</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6 border-b border-slate-700/50 pb-6">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-center group">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-100 group-hover:text-orange-400 transition-colors text-sm">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-slate-700 text-slate-300 text-[10px] px-1.5 py-0.5 rounded font-bold">{item.quantity}x</span>
                      <span className="text-[10px] text-slate-500">R$ {item.price.toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="font-bold text-white ml-4 text-sm">R$ {(item.quantity * item.price).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4 mb-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <span className="text-orange-500">👤</span> Seus Dados
              </h3>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-12">
                  <input
                    name="clientName"
                    value={addressData.clientName}
                    onChange={handleInputChange}
                    placeholder="Seu Nome Completo"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    required
                  />
                </div>
                <div className="col-span-12">
                  <input
                    name="clientPhone"
                    value={addressData.clientPhone}
                    onChange={handleInputChange}
                    placeholder="Seu Telefone / WhatsApp"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <span className="text-orange-500">📍</span> Endereço de Entrega
              </h3>
              
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-8">
                  <input
                    name="street"
                    value={addressData.street}
                    onChange={handleInputChange}
                    placeholder="Rua / Avenida"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    required
                  />
                </div>
                <div className="col-span-4">
                  <input
                    name="number"
                    value={addressData.number}
                    onChange={handleInputChange}
                    placeholder="Nº"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    required
                  />
                </div>
                <div className="col-span-6">
                  <input
                    name="neighborhood"
                    value={addressData.neighborhood}
                    onChange={handleInputChange}
                    placeholder="Bairro"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    required
                  />
                </div>
                <div className="col-span-6">
                  <input
                    name="complement"
                    value={addressData.complement}
                    onChange={handleInputChange}
                    placeholder="Apt / Bloco"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  />
                </div>
                <div className="col-span-12">
                  <input
                    name="reference"
                    value={addressData.reference}
                    onChange={handleInputChange}
                    placeholder="Ponto de Referência"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  />
                </div>
                <div className="col-span-12">
                  <input
                    name="city"
                    value={addressData.city}
                    onChange={handleInputChange}
                    placeholder="Cidade"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Rodapé Fixo (Total + Botão) */}
      {items.length > 0 && (
        <div className="p-6 md:p-8 pt-4 border-t border-slate-700/50 bg-slate-800/50 flex-shrink-0">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span>Subtotal</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span>Taxa de entrega</span>
              <span className="text-green-400 font-bold italic">GRÁTIS</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-lg font-bold text-white">Total:</span>
              <span className="text-2xl font-black text-orange-500">
                R$ {total.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              if (!addressData.clientName || !addressData.clientPhone || !addressData.street || !addressData.number || !addressData.neighborhood || !addressData.city) {
                alert('Por favor, preencha todos os campos obrigatórios (Nome, Telefone, Rua, Número, Bairro e Cidade).');
                return;
              }
              const addressParts = [
                `*Cliente:* ${addressData.clientName}`,
                `*WhatsApp:* ${addressData.clientPhone}`,
                `\n*Endereço:*`,
                `${addressData.street}, ${addressData.number}`,
                addressData.complement && `Comp: ${addressData.complement}`,
                `Bairro: ${addressData.neighborhood}`,
                addressData.reference && `Ref: ${addressData.reference}`,
                `Cidade: ${addressData.city}`
              ].filter(Boolean);
              
              const fullAddress = addressParts.join('\n');
              onFinishOrder(fullAddress, addressData.clientName, addressData.clientPhone);
              setIsOpen(false);
            }}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black py-4 rounded-xl transition-all duration-300 shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processando...</span>
              </div>
            ) : (
              <>
                <span className="text-base">Finalizar Pedido</span>
                <span className="text-xl animate-bounce-horizontal">🚀</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Version: Always visible */}
      <div className="hidden md:block">
        {renderCartContent()}
      </div>

      {/* Mobile Version: Floating Button */}
      <div className="md:hidden">
        {itemCount > 0 && (
          <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 bg-orange-500 text-white w-16 h-16 rounded-full shadow-2xl shadow-orange-500/40 flex items-center justify-center hover:scale-110 active:scale-90 transition-all border-4 border-slate-900 animate-in fade-in zoom-in duration-300"
          >
            <span className="text-2xl">🛒</span>
            <span className="absolute -top-1 -right-1 bg-white text-orange-600 text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md border-2 border-orange-500">
              {itemCount}
            </span>
          </button>
        )}

        {/* Mobile Modal Overlay */}
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
            <div 
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <div className="relative w-full max-w-lg animate-in slide-in-from-bottom-10 duration-300">
              {renderCartContent()}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

