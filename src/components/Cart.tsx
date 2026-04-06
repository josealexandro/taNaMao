import { OrderItem } from '@/types/Order';
import { useState } from 'react';

interface CartProps {
  items: OrderItem[];
  total: number;
  onFinishOrder: (address: string, clientName: string, clientPhone: string) => void;
  loading: boolean;
  isStoreOpen?: boolean;
}

export default function Cart({ items, total, onFinishOrder, loading, isStoreOpen = true }: CartProps) {
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
    let finalValue = value;

    // Auto-formatar WhatsApp do cliente: apenas números e max 11 dígitos
    if (name === 'clientPhone') {
      finalValue = value.replace(/\D/g, '').slice(0, 11);
    }

    setAddressData(prev => ({ ...prev, [name]: finalValue }));
  };

  const renderCartContent = () => (
    <div className="bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full border border-slate-700/50 max-h-[90vh] flex flex-col overflow-hidden">
      {/* Header Fixo */}
      <div className="p-4 md:p-6 pb-2 flex items-center justify-between border-b border-slate-700/30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛒</span>
          <h2 className="text-xl font-black text-white italic">Seu Carrinho</h2>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="md:hidden text-slate-400 hover:text-white p-1"
        >
          <span className="text-xl">✕</span>
        </button>
      </div>
      
      {/* Conteúdo Rolável (Itens + Endereço) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 pt-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-5xl mb-3 opacity-20">🥡</div>
            <p className="text-slate-400 font-medium text-sm">Seu carrinho está vazio.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-4 border-b border-slate-700/50 pb-4">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-center group">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-100 group-hover:text-orange-400 transition-colors text-[13px]">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="bg-slate-700 text-slate-300 text-[9px] px-1.5 py-0.5 rounded font-bold">{item.quantity}x</span>
                      <span className="text-[9px] text-slate-500">R$ {item.price.toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="font-bold text-white ml-4 text-[13px]">R$ {(item.quantity * item.price).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 mb-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="text-orange-500">👤</span> Seus Dados
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-1">
                  <input
                    name="clientName"
                    value={addressData.clientName}
                    onChange={handleInputChange}
                    placeholder="Nome"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-[11px] text-white placeholder-slate-600 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                    required
                  />
                </div>
                <div className="col-span-1">
                  <input
                    name="clientPhone"
                    value={addressData.clientPhone}
                    onChange={handleInputChange}
                    placeholder="DDD + Número"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-[11px] text-white placeholder-slate-600 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="text-orange-500">📍</span> Endereço
              </h3>
              
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-9">
                  <input
                    name="street"
                    value={addressData.street}
                    onChange={handleInputChange}
                    placeholder="Rua / Av"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-[11px] text-white placeholder-slate-600 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                    required
                  />
                </div>
                <div className="col-span-3">
                  <input
                    name="number"
                    value={addressData.number}
                    onChange={handleInputChange}
                    placeholder="Nº"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-[11px] text-white placeholder-slate-600 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                    required
                  />
                </div>
                <div className="col-span-6">
                  <input
                    name="neighborhood"
                    value={addressData.neighborhood}
                    onChange={handleInputChange}
                    placeholder="Bairro"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-[11px] text-white placeholder-slate-600 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                    required
                  />
                </div>
                <div className="col-span-6">
                  <input
                    name="complement"
                    value={addressData.complement}
                    onChange={handleInputChange}
                    placeholder="Apt/Bloco"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-[11px] text-white placeholder-slate-600 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                  />
                </div>
                <div className="col-span-7">
                  <input
                    name="reference"
                    value={addressData.reference}
                    onChange={handleInputChange}
                    placeholder="Referência"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-[11px] text-white placeholder-slate-600 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                  />
                </div>
                <div className="col-span-5">
                  <input
                    name="city"
                    value={addressData.city}
                    onChange={handleInputChange}
                    placeholder="Cidade"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-[11px] text-white placeholder-slate-600 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
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
        <div className="p-4 md:p-6 pt-2 border-t border-slate-700/50 bg-slate-800/50 flex-shrink-0">
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-black text-white italic">Total:</span>
            <span className="text-2xl font-black text-orange-500">
              R$ {total.toFixed(2)}
            </span>
          </div>

          <button
            onClick={() => {
              if (!isStoreOpen) {
                alert('A loja está fechada no momento. Tente novamente mais tarde.');
                return;
              }

              if (!addressData.clientName || !addressData.clientPhone || !addressData.street || !addressData.number || !addressData.neighborhood || !addressData.city) {
                alert('Preencha os campos obrigatórios!');
                return;
              }

              // Validação do Telefone (11 dígitos)
              const digitsOnly = addressData.clientPhone.replace(/\D/g, '');
              if (digitsOnly.length !== 11) {
                alert('O Telefone deve ter exatamente 11 dígitos (DDD + número).');
                return;
              }

              const formattedPhone = '55' + digitsOnly;

              const addressParts = [
                `*Cliente:* ${addressData.clientName}`,
                `*WhatsApp:* ${formattedPhone}`,
                `\n*Endereço:*`,
                `${addressData.street}, ${addressData.number}`,
                addressData.complement && `Comp: ${addressData.complement}`,
                `Bairro: ${addressData.neighborhood}`,
                addressData.reference && `Ref: ${addressData.reference}`,
                `Cidade: ${addressData.city}`
              ].filter(Boolean);
              
              const fullAddress = addressParts.join('\n');
              onFinishOrder(fullAddress, addressData.clientName, formattedPhone);
              setIsOpen(false);
            }}
            disabled={loading || !isStoreOpen}
            className={`w-full font-black py-3 rounded-xl transition-all duration-300 shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 ${
              isStoreOpen 
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white' 
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="text-sm">{isStoreOpen ? 'Finalizar Pedido' : 'Loja Fechada'}</span>
                <span className="text-xl">{isStoreOpen ? '🚀' : '🌙'}</span>
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

