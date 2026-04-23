import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useConfigStore } from '../store/useConfigStore';

export default function Layout() {
  const cart = useConfigStore(s => s.cart);
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#0F0F11] text-white font-sans">
      <nav className="fixed top-0 inset-x-0 z-50 h-14 bg-[#18181C]/90 backdrop-blur border-b border-white/5 flex items-center px-8 gap-8">
        <span className="text-sm font-bold tracking-widest text-white/80 cursor-pointer" onClick={() => navigate('/')}>G‑ARCHITECT</span>
        <div className="flex-1" />
        <NavLink to="/configure" className={({ isActive }) => `text-sm transition-colors ${isActive ? 'text-white' : 'text-white/40 hover:text-white/70'}`}>Konfiguruj</NavLink>
        <NavLink to="/validate" className={({ isActive }) => `text-sm transition-colors ${isActive ? 'text-white' : 'text-white/40 hover:text-white/70'}`}>Walidacja</NavLink>
        <NavLink to="/cart" className={({ isActive }) => `relative text-sm transition-colors ${isActive ? 'text-white' : 'text-white/40 hover:text-white/70'}`}>
          Koszyk
          {cart.length > 0 && <span className="absolute -top-1 -right-3 w-4 h-4 rounded-full bg-white text-[#0F0F11] text-[10px] font-bold grid place-items-center">{cart.length}</span>}
        </NavLink>
      </nav>
      <main className="pt-14"><Outlet /></main>
    </div>
  );
}
