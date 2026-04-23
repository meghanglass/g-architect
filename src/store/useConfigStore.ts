import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type ComponentGroupKey =
  | 'frame' | 'slide' | 'barrel'
  | 'trigger_group' | 'magazine' | 'recoil_spring_assembly';

export interface Selection {
  frame: string | null; slide: string | null; barrel: string | null;
  trigger_group: string | null; magazine: string | null; recoil_spring_assembly: string | null;
}

export interface ValidationIssue {
  rule_id: string; name: string; message: string; affected_groups: string[];
}

export interface ValidationResult {
  valid: boolean; critical: ValidationIssue[]; errors: ValidationIssue[]; warnings: ValidationIssue[];
}

export interface CartItem {
  id: string; selection: Selection; validationResult: ValidationResult;
  totalPrice: number; addedAt: string; label: string;
}

export interface ConfigStore {
  selection: Selection; validationResult: ValidationResult | null;
  cart: CartItem[]; currentStep: number;
  setComponent: (group: ComponentGroupKey, id: string | null) => void;
  validateConfig: (validator: (sel: Selection) => ValidationResult) => void;
  addToCart: (label: string, price: number) => void;
  removeFromCart: (id: string) => void;
  clearConfig: () => void;
  setStep: (step: number) => void;
}

const EMPTY: Selection = {
  frame: null, slide: null, barrel: null,
  trigger_group: null, magazine: null, recoil_spring_assembly: null,
};

export const useConfigStore = create<ConfigStore>()(
  devtools((set, get) => ({
    selection: { ...EMPTY }, validationResult: null, cart: [], currentStep: 0,
    setComponent: (group, id) => set(s => ({ selection: { ...s.selection, [group]: id } }), false, 'setComponent'),
    validateConfig: (validator) => set({ validationResult: validator(get().selection) }, false, 'validateConfig'),
    addToCart: (label, price) => {
      const { selection, validationResult } = get();
      if (!validationResult?.valid) return;
      set(s => ({ cart: [...s.cart, { id: crypto.randomUUID(), selection: { ...selection }, validationResult: validationResult!, totalPrice: price, addedAt: new Date().toISOString(), label }] }), false, 'addToCart');
    },
    removeFromCart: (id) => set(s => ({ cart: s.cart.filter(i => i.id !== id) }), false, 'removeFromCart'),
    clearConfig: () => set({ selection: { ...EMPTY }, validationResult: null, currentStep: 0 }, false, 'clearConfig'),
    setStep: (step) => set({ currentStep: step }, false, 'setStep'),
  }), { name: 'g-architect' })
);
