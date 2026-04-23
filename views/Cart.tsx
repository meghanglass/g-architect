import { useNavigate } from 'react-router-dom';
import { useConfigStore } from '../store/useConfigStore';
import type { CartItem } from '../store/useConfigStore';

function CartItemRow({ item, onRemove }: { item: CartItem; onRemove: () => void }) {
  const selectedIds = Object.values(item.selection).filter(Boolean);

  return (
    <div className="rounded-xl border border-white/8 bg-white/2 p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-white">{item.label}</p>
          <p className="text-xs text-white/30 mt-0.5">
            {new Date(item.addedAt).toLocaleDateString('pl-PL', {
              day: '2-digit', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>
        <p className="text-base font-bold text-white">
          {item.totalPrice.toLocaleString('pl-PL')} PLN
        </p>
      </div>

      {/* Komponenty */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(item.selection).map(([group, id]) => {
          if (!id) return null;
          return (
            <span
              key={group}
              className="text-[10px] font-mono px-2 py-1 rounded bg-white/5 text-white/40"
            >
              {id}
            </span>
          );
        })}
      </div>

      {/* Status walidacji */}
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
        <span className="text-xs text-white/30">
          Konfiguracja zwalidowana — {selectedIds.length} komponentów
        </span>
      </div>

      <button
        onClick={onRemove}
        className="self-start text-xs text-white/20 hover:text-red-400 transition-colors"
      >
        Usuń z koszyka
      </button>
    </div>
  );
}

export default function Cart() {
  const navigate       = useNavigate();
  const cart           = useConfigStore(s => s.cart);
  const removeFromCart = useConfigStore(s => s.removeFromCart);

  const total = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-white/30 text-sm">Koszyk jest pusty.</p>
        <button
          onClick={() => navigate('/configure')}
          className="text-sm text-white/60 underline underline-offset-4 hover:text-white"
        >
          Skonfiguruj swój zestaw →
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-8 py-16 flex flex-col gap-8">

      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Koszyk</h1>
        <p className="text-white/30 text-sm">{cart.length} {cart.length === 1 ? 'konfiguracja' : 'konfiguracje'}</p>
      </div>

      <div className="flex flex-col gap-4">
        {cart.map(item => (
          <CartItemRow
            key={item.id}
            item={item}
            onRemove={() => removeFromCart(item.id)}
          />
        ))}
      </div>

      {/* Podsumowanie */}
      <div className="rounded-xl border border-white/8 p-6 flex flex-col gap-4">
        <div className="flex justify-between text-sm">
          <span className="text-white/40">Suma</span>
          <span className="text-white font-bold">{total.toLocaleString('pl-PL')} PLN</span>
        </div>
        <div className="h-px bg-white/8" />
        <button
          className="w-full py-3 bg-white text-[#0F0F11] text-sm font-bold
                     rounded-lg hover:bg-white/90 transition-colors"
        >
          Złóż zamówienie
        </button>
        <button
          onClick={() => navigate('/configure')}
          className="w-full py-3 border border-white/8 text-sm text-white/40
                     rounded-lg hover:border-white/20 hover:text-white/60 transition-colors"
        >
          Dodaj kolejną konfigurację
        </button>
      </div>
    </div>
  );
}
