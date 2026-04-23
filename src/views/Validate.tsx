import { useNavigate } from 'react-router-dom';
import { useConfigStore } from '../store/useConfigStore';

const S = {
  critical: { dot: 'bg-red-500',    text: 'text-red-400',    bg: 'bg-red-500/10',    label: 'KRYTYCZNY'    },
  error:    { dot: 'bg-orange-500', text: 'text-orange-400', bg: 'bg-orange-500/10', label: 'BŁĄD'         },
  warning:  { dot: 'bg-amber-500',  text: 'text-amber-400',  bg: 'bg-amber-500/10',  label: 'OSTRZEŻENIE'  },
};

export default function Validate() {
  const navigate = useNavigate();
  const result = useConfigStore(s => s.validationResult);
  const selection = useConfigStore(s => s.selection);
  const hasSelection = Object.values(selection).some(v => v !== null);

  if (!hasSelection) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <p className="text-white/30 text-sm">Brak aktywnej konfiguracji.</p>
      <button onClick={() => navigate('/configure')} className="text-sm text-white/60 underline underline-offset-4 hover:text-white">Przejdź do konfiguratora →</button>
    </div>
  );

  const isValid = result?.valid ?? false;
  const totalIssues = (result?.critical.length ?? 0) + (result?.errors.length ?? 0);

  return (
    <div className="max-w-2xl mx-auto px-8 py-16 flex flex-col gap-8">
      <div className={`rounded-xl p-6 border ${isValid ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isValid ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-bold tracking-widest uppercase text-white/60">
            {isValid ? 'Konfiguracja poprawna' : `${totalIssues} błędy kompatybilności`}
          </span>
        </div>
        <p className="text-white/30 text-sm">{isValid ? 'Wszystkie reguły spełnione. Możesz dodać do koszyka.' : 'Popraw błędy przed dodaniem do koszyka.'}</p>
      </div>

      {(['critical','error','warning'] as const).map(sev => {
        const issues = (result?.[sev] ?? []) as any[];
        if (!issues.length) return null;
        const st = S[sev];
        return (
          <div key={sev} className="flex flex-col gap-3">
            <p className="text-[11px] tracking-widest uppercase text-white/20">{st.label}</p>
            {issues.map((i: any) => (
              <div key={i.rule_id} className={`rounded-lg p-4 ${st.bg} border border-white/5`}>
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${st.dot}`} />
                  <div>
                    <p className={`text-sm font-bold ${st.text}`}>{i.name}</p>
                    <p className="text-white/40 text-xs mt-1">{i.message}</p>
                    <p className="text-white/20 text-[10px] mt-2 font-mono">{i.rule_id}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      <div className="flex gap-4 pt-4">
        <button onClick={() => navigate('/configure')} className="px-6 py-2.5 border border-white/10 text-sm text-white/60 rounded-lg hover:border-white/20 hover:text-white/80 transition-colors">← Wróć</button>
        {isValid && <button onClick={() => navigate('/cart')} className="px-6 py-2.5 bg-white text-[#0F0F11] text-sm font-bold rounded-lg hover:bg-white/90 transition-colors">Dodaj do koszyka →</button>}
      </div>
    </div>
  );
}
