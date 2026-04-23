import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfigStore } from '../store/useConfigStore';
import type { ComponentGroupKey } from '../store/useConfigStore';
import { validateConfiguration } from '../lib/validator';
import componentsData from '../../data/glock_components.json';

interface ComponentEntry {
  id: string; name: string;
  specs?: Record<string, unknown>;
  ui_meta?: { availability?: string };
  [key: string]: unknown;
}
interface ComponentGroup { label: string; components: ComponentEntry[]; }

const STEPS: { key: ComponentGroupKey; label: string }[] = [
  { key: 'frame',                  label: 'Baza (Frame)'            },
  { key: 'slide',                  label: 'Zamek (Slide)'           },
  { key: 'barrel',                 label: 'Lufa (Barrel)'           },
  { key: 'trigger_group',          label: 'Mechanizm spustowy'      },
  { key: 'magazine',               label: 'Magazynek'               },
  { key: 'recoil_spring_assembly', label: 'Sprężyna powrotna (RSA)' },
];

function ComponentCard({ component, isSelected, isIncompatible, reason, onSelect }: {
  component: ComponentEntry; isSelected: boolean;
  isIncompatible: boolean; reason: string; onSelect: () => void;
}) {
  return (
    <button onClick={isIncompatible ? undefined : onSelect} disabled={isIncompatible}
      className={`relative text-left rounded-xl border p-4 transition-all duration-150 w-full
        ${isIncompatible
          ? 'border-red-500/50 bg-red-500/8 opacity-70 cursor-not-allowed'
          : isSelected
            ? 'border-green-500/60 bg-green-500/8 ring-1 ring-green-500/20'
            : 'border-white/8 hover:border-white/25 hover:bg-white/3 cursor-pointer'}`}>
      <div className={`absolute top-3 right-3 w-2 h-2 rounded-full
        ${isIncompatible ? 'bg-red-500' : isSelected ? 'bg-green-500' : 'bg-white/10'}`} />
      <p className="text-sm font-bold text-white pr-5 leading-snug">{component.name}</p>
      <p className="text-[10px] font-mono text-white/20 mt-0.5">{component.id}</p>
      {component.specs && (
        <div className="mt-3 flex flex-col gap-1 border-t border-white/5 pt-3">
          {Object.entries(component.specs).slice(0, 3).map(([k, v]) => (
            <div key={k} className="flex justify-between text-[11px]">
              <span className="text-white/25">{k}</span>
              <span className="text-white/50 font-mono truncate ml-2">{String(v)}</span>
            </div>
          ))}
        </div>
      )}
      {isIncompatible && (
        <p className="mt-2 text-[10px] text-red-400/80 leading-tight border-t border-red-500/15 pt-2">
          {reason || 'Niekompatybilny z aktualną konfiguracją'}
        </p>
      )}
    </button>
  );
}

function ValidationPanel() {
  const navigate         = useNavigate();
  const selection        = useConfigStore(s => s.selection);
  const validationResult = useConfigStore(s => s.validationResult);
  const addToCart        = useConfigStore(s => s.addToCart);
  const currentStep      = useConfigStore(s => s.currentStep);

  const selectedCount = Object.values(selection).filter(Boolean).length;
  const hasCritical   = (validationResult?.critical.length ?? 0) > 0;
  const hasErrors     = (validationResult?.errors.length   ?? 0) > 0;
  const hasWarnings   = (validationResult?.warnings.length ?? 0) > 0;
  const isValid       = validationResult?.valid ?? true;
  const isBlocked     = hasCritical || hasErrors;
  const allSelected   = selectedCount === STEPS.length;

  const handleAddToCart = useCallback(() => {
    const model =
      selection.frame?.includes('G17') ? 'G17' :
      selection.frame?.includes('G19') ? 'G19' :
      selection.frame?.includes('G45') ? 'G45' : '??';
    addToCart(`Glock ${model} — konfiguracja niestandardowa`, Math.floor(Math.random() * 3000) + 2000);
    navigate('/cart');
  }, [selection, addToCart, navigate]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className={`rounded-xl p-4 border transition-colors ${
        !selectedCount ? 'border-white/5 bg-white/2'
        : isBlocked    ? 'border-red-500/20 bg-red-500/5'
        : hasWarnings  ? 'border-amber-500/15 bg-amber-500/5'
        : 'border-green-500/20 bg-green-500/5'}`}>
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className={`w-2 h-2 rounded-full shrink-0 ${
            !selectedCount ? 'bg-white/15'
            : isBlocked    ? 'bg-red-500'
            : hasWarnings  ? 'bg-amber-500'
            : 'bg-green-500'}`} />
          <span className="text-xs font-bold tracking-wider uppercase text-white/50">
            {!selectedCount ? 'Oczekiwanie'
            : isBlocked     ? `${(validationResult?.critical.length ?? 0) + (validationResult?.errors.length ?? 0)} bledy`
            : hasWarnings   ? `${validationResult?.warnings.length} ostrzezenie`
            : 'Konfiguracja OK'}
          </span>
        </div>
        <p className="text-[11px] text-white/25 leading-relaxed">
          {!selectedCount ? 'Wybierz komponenty po lewej.'
          : isBlocked     ? 'Popraw bledy aby kontynuowac.'
          : hasWarnings   ? 'Konfiguracja dopuszczalna.'
          : `Wybrano ${selectedCount} z ${STEPS.length} komponentow.`}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[10px] tracking-widest uppercase text-white/20">Postep</p>
        {STEPS.map(s => (
          <div key={s.key} className="flex items-center gap-2.5">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${selection[s.key] ? 'bg-green-500' : 'bg-white/10'}`} />
            <span className={`text-[11px] flex-1 ${selection[s.key] ? 'text-white/60' : 'text-white/20'}`}>{s.label}</span>
            {selection[s.key] && <span className="text-[9px] font-mono text-white/20 truncate max-w-[80px]">{selection[s.key]}</span>}
          </div>
        ))}
      </div>

      <div className="h-px bg-white/5" />

      {hasCritical && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] tracking-widest uppercase text-red-400/60">Krytyczne</p>
          {validationResult!.critical.map(issue => (
            <div key={issue.rule_id} className="rounded-lg p-3 bg-red-500/8 border border-red-500/15">
              <p className="text-xs font-bold text-red-400">{issue.name}</p>
              <p className="text-[11px] text-red-400/60 mt-0.5 leading-snug">{issue.message}</p>
              <p className="text-[9px] font-mono text-red-500/30 mt-1">{issue.rule_id}</p>
            </div>
          ))}
        </div>
      )}

      {hasErrors && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] tracking-widest uppercase text-orange-400/60">Bledy</p>
          {validationResult!.errors.map(issue => (
            <div key={issue.rule_id} className="rounded-lg p-3 bg-orange-500/8 border border-orange-500/15">
              <p className="text-xs font-bold text-orange-400">{issue.name}</p>
              <p className="text-[11px] text-orange-400/60 mt-0.5 leading-snug">{issue.message}</p>
              <p className="text-[9px] font-mono text-orange-500/30 mt-1">{issue.rule_id}</p>
            </div>
          ))}
        </div>
      )}

      {hasWarnings && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] tracking-widest uppercase text-amber-400/60">Ostrzezenia</p>
          {validationResult!.warnings.map(issue => (
            <div key={issue.rule_id} className="rounded-lg p-3 bg-amber-500/8 border border-amber-500/15">
              <p className="text-xs font-bold text-amber-400">{issue.name}</p>
              <p className="text-[11px] text-amber-400/60 mt-0.5 leading-snug">{issue.message}</p>
              <p className="text-[9px] font-mono text-amber-500/30 mt-1">{issue.rule_id}</p>
            </div>
          ))}
        </div>
      )}

      {isValid && !hasWarnings && selectedCount > 0 && (
        <div className="rounded-lg p-3 bg-green-500/8 border border-green-500/15">
          <p className="text-xs text-green-400">Wszystkie reguly spelnioneA</p>
        </div>
      )}

      <div className="flex-1" />

      <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
        <button onClick={() => navigate('/validate')}
          className="w-full py-2.5 border border-white/8 text-xs text-white/40 rounded-lg hover:border-white/20 hover:text-white/60 transition-colors">
          Szczegoly walidacji
        </button>
        {allSelected && (
          <button onClick={handleAddToCart} disabled={isBlocked}
            className="w-full py-2.5 bg-white text-[#0F0F11] text-xs font-bold rounded-lg hover:bg-white/90 disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
            {isBlocked ? 'Popraw bledy aby dodac' : 'Dodaj do koszyka →'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Configure() {
  const selection        = useConfigStore(s => s.selection);
  const validationResult = useConfigStore(s => s.validationResult);
  const currentStep      = useConfigStore(s => s.currentStep);
  const setComponent     = useConfigStore(s => s.setComponent);
  const validateConfig   = useConfigStore(s => s.validateConfig);
  const setStep          = useConfigStore(s => s.setStep);

  useEffect(() => {
    const result = validateConfiguration(selection);
    validateConfig(() => result);
    console.log('[Configure] selection:', selection);
    console.log('[Configure] validationResult:', result);
  }, [selection, validateConfig]);

  const groups = (componentsData as any).component_groups as Record<string, ComponentGroup>;
  const step   = STEPS[currentStep];
  const group  = groups[step.key];

  const incompatibleMap = new Map<string, string>();
  if (validationResult) {
    [...validationResult.critical, ...validationResult.errors].forEach(issue => {
      console.log('[issue]', JSON.stringify(issue));
      issue.affected_groups?.forEach((g: string) => {
        const selectedId = selection[g as ComponentGroupKey];
        if (selectedId) incompatibleMap.set(selectedId, issue.message);
      });
    });
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="border-b border-white/5 px-6 py-3 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {STEPS.map((s, i) => {
              const isDone    = selection[s.key] !== null;
              const isCurrent = i === currentStep;
              return (
                <button key={s.key} onClick={() => setStep(i)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors shrink-0
                    ${isCurrent ? 'bg-white/8 text-white' : isDone ? 'text-white/50 hover:text-white/70' : 'text-white/20 hover:text-white/40'}`}>
                  <span className={`w-4 h-4 rounded-full text-[9px] grid place-items-center shrink-0
                    ${isDone ? 'bg-green-500 text-white' : 'bg-white/8 text-white/30'}`}>
                    {isDone ? '✓' : i + 1}
                  </span>
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-base font-bold">{step.label}</h2>
            {selection[step.key] && (
              <button onClick={() => setComponent(step.key, null)}
                className="text-xs text-white/20 hover:text-white/50 transition-colors">
                Wyczysc
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {group?.components.map(component => (
              <ComponentCard key={component.id} component={component}
                isSelected={selection[step.key] === component.id}
                isIncompatible={incompatibleMap.has(component.id)}
                reason={incompatibleMap.get(component.id) ?? ''}
                onSelect={() => setComponent(step.key, component.id)}
              />
            ))}
          </div>
        </div>

        <div className="border-t border-white/5 px-6 py-3 flex justify-between shrink-0">
          <button onClick={() => setStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0}
            className="text-xs text-white/30 hover:text-white/60 disabled:opacity-20 transition-colors">
            Poprzedni krok
          </button>
          <button onClick={() => setStep(Math.min(STEPS.length - 1, currentStep + 1))} disabled={currentStep === STEPS.length - 1}
            className="text-xs text-white/30 hover:text-white/60 disabled:opacity-20 transition-colors">
            Nastepny krok
          </button>
        </div>
      </div>

      <div className="w-72 shrink-0 border-l border-white/5 px-5 py-6 overflow-y-auto">
        <p className="text-[10px] tracking-widest uppercase text-white/20 mb-4">Status walidacji</p>
        <ValidationPanel />
      </div>
    </div>
  );
}
