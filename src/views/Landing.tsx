import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  return (
    <section className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-8 text-center gap-8">
      <p className="text-xs tracking-[0.3em] text-white/30 uppercase">Proof of Concept — Data-Driven Design</p>
      <h1 className="text-5xl font-bold leading-tight max-w-2xl">
        Precyzja zaczyna się<br />
        <span className="text-white/30">od właściwej konfiguracji</span>
      </h1>
      <p className="text-white/40 max-w-md text-base leading-relaxed">
        System modułowej konfiguracji narzędzi precyzyjnych z walidacją kompatybilności w czasie rzeczywistym. Case study: Glock G17 / G19 / G45.
      </p>
      <div className="flex gap-4">
        <button onClick={() => navigate('/configure')} className="px-8 py-3 bg-white text-[#0F0F11] text-sm font-bold rounded-lg hover:bg-white/90 transition-colors">Zacznij konfigurację</button>
        <button onClick={() => navigate('/cart')} className="px-8 py-3 border border-white/10 text-sm text-white/60 rounded-lg hover:border-white/20 hover:text-white/80 transition-colors">Koszyk</button>
      </div>
      <div className="mt-8 flex gap-6 text-[11px] text-white/20 tracking-widest uppercase">
        <span>JSON → Validator</span><span>·</span><span>GitHub → Figma</span><span>·</span><span>Zero tolerancji na błąd</span>
      </div>
    </section>
  );
}
