import componentsData from '../../data/glock_components.json'
import rulesData from '../../data/glock_compatibility_rules.json'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Configuration {
  frame?: string
  slide?: string
  barrel?: string
  trigger_group?: string
  recoil_spring_assembly?: string
  magazine?: string
}

export interface ValidationIssue {
  rule_id: string
  name: string
  message: string
  affected_groups: string[]
}

export interface ValidationResult {
  valid: boolean
  critical: ValidationIssue[]
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
}

interface ComponentBase {
  id: string
  compatible_generations?: number[]
  compatible_models?: string[]
}

interface FrameComponent extends ComponentBase {
  model: string
  generation: number
  size_class: string
}

interface SlideComponent extends ComponentBase {
  compatible_models: string[]
  compatible_generations: number[]
}

interface BarrelComponent extends ComponentBase {
  compatible_models: string[]
  compatible_generations: number[]
}

interface TriggerComponent extends ComponentBase {
  compatible_generations: number[]
  compatible_models: string[]
}

interface MagazineComponent extends ComponentBase {
  specs: { fits_in_frame: string[] }
}

interface RSAComponent extends ComponentBase {
  compatible_generations: number[]
}

// ─── Build flat lookup map ────────────────────────────────────────────────────

type AnyComponent = FrameComponent | SlideComponent | BarrelComponent | TriggerComponent | MagazineComponent | RSAComponent

function buildLookup(): Map<string, AnyComponent> {
  const map = new Map<string, AnyComponent>()
  const groups = componentsData.component_groups as Record<string, { components: AnyComponent[] }>
  for (const group of Object.values(groups)) {
    for (const c of group.components) {
      map.set(c.id, c)
    }
  }
  return map
}

const lookup = buildLookup()

function get<T extends AnyComponent>(id: string | undefined): T | null {
  if (!id) return null
  return (lookup.get(id) as T) ?? null
}

// ─── Rule helpers ─────────────────────────────────────────────────────────────

function generationsOverlap(a: number[], b: number[]): boolean {
  return a.some(g => b.includes(g))
}

// ─── Validator ────────────────────────────────────────────────────────────────

export function validateConfiguration(config: Configuration): ValidationResult {
  const critical: ValidationIssue[] = []
  const errors: ValidationIssue[] = []
  const warnings: ValidationIssue[] = []

  const frame = get<FrameComponent>(config.frame)
  const slide = get<SlideComponent>(config.slide)
  const barrel = get<BarrelComponent>(config.barrel)
  const trigger = get<TriggerComponent>(config.trigger_group)
  const rsa = get<RSAComponent>(config.recoil_spring_assembly)
  const magazine = get<MagazineComponent>(config.magazine)

  // Unknown component IDs → invalid immediately
  if (config.frame && !frame) errors.push({ rule_id: 'R-UNKNOWN', name: 'Nieznany komponent', message: `Nieznany komponent ramki: ${config.frame}`, affected_groups: ['frame'] })
  if (config.slide && !slide) errors.push({ rule_id: 'R-UNKNOWN', name: 'Nieznany komponent', message: `Nieznany komponent zamka: ${config.slide}`, affected_groups: ['slide'] })
  if (config.barrel && !barrel) errors.push({ rule_id: 'R-UNKNOWN', name: 'Nieznany komponent', message: `Nieznany komponent lufy: ${config.barrel}`, affected_groups: ['barrel'] })
  if (config.trigger_group && !trigger) errors.push({ rule_id: 'R-UNKNOWN', name: 'Nieznany komponent', message: `Nieznany mechanizm spustowy: ${config.trigger_group}`, affected_groups: ['trigger_group'] })
  if (config.recoil_spring_assembly && !rsa) errors.push({ rule_id: 'R-UNKNOWN', name: 'Nieznany komponent', message: `Nieznany RSA: ${config.recoil_spring_assembly}`, affected_groups: ['recoil_spring_assembly'] })
  if (config.magazine && !magazine) errors.push({ rule_id: 'R-UNKNOWN', name: 'Nieznany komponent', message: `Nieznany magazynek: ${config.magazine}`, affected_groups: ['magazine'] })

  // ── R-G-001: RSA inter-generational lockout (critical) ────────────────────
  if (rsa && frame) {
    const rsaGens = rsa.compatible_generations ?? []
    if (!rsaGens.includes(frame.generation)) {
      critical.push({
        rule_id: 'R-G-001',
        name: 'Blokada międzygeneracyjna RSA',
        message: `RSA (Gen ${rsaGens.join('/')}) niekompatybilna z ramką Gen ${frame.generation}. Ryzyko awarii.`,
        affected_groups: ['recoil_spring_assembly', 'frame'],
      })
    }
  }

  // ── R-G-002: Generation mismatch across all components (critical) ─────────
  if (frame) {
    const frameGen = frame.generation
    const mismatched: string[] = []
    const affectedGroups: string[] = ['frame']

    if (slide && !slide.compatible_generations.includes(frameGen)) {
      mismatched.push(`zamek (Gen ${slide.compatible_generations.join('/')})`)
      affectedGroups.push('slide')
    }
    if (barrel && !barrel.compatible_generations.includes(frameGen)) {
      mismatched.push(`lufa (Gen ${barrel.compatible_generations.join('/')})`)
      affectedGroups.push('barrel')
    }
    if (trigger && !trigger.compatible_generations.includes(frameGen)) {
      mismatched.push(`mechanizm spustowy (Gen ${trigger.compatible_generations.join('/')})`)
      affectedGroups.push('trigger_group')
    }
    if (rsa && !(rsa.compatible_generations ?? []).includes(frameGen)) {
      mismatched.push(`RSA (Gen ${(rsa.compatible_generations ?? []).join('/')})`)
      affectedGroups.push('recoil_spring_assembly')
    }

    if (mismatched.length > 0) {
      critical.push({
        rule_id: 'R-G-002',
        name: 'Niezgodność generacji komponentów',
        message: `Ramka Gen ${frameGen} niekompatybilna z: ${mismatched.join(', ')}. Wymagana jednolita generacja.`,
        affected_groups: affectedGroups,
      })
    }
  }

  // ── R-G-007: G45 Gen 5 only (critical) ───────────────────────────────────
  const frameAsAny = frame as (FrameComponent & { model?: string }) | null
  if (frameAsAny?.model === 'G45') {
    const nonGen5: string[] = []
    const affectedGroups: string[] = ['frame']
    if (slide && !slide.compatible_generations.includes(5)) { nonGen5.push('zamek'); affectedGroups.push('slide') }
    if (barrel && !barrel.compatible_generations.includes(5)) { nonGen5.push('lufa'); affectedGroups.push('barrel') }
    if (trigger && !trigger.compatible_generations.includes(5)) { nonGen5.push('mechanizm spustowy'); affectedGroups.push('trigger_group') }
    if (rsa && !(rsa.compatible_generations ?? []).includes(5)) { nonGen5.push('RSA'); affectedGroups.push('recoil_spring_assembly') }
    if (nonGen5.length > 0) {
      critical.push({
        rule_id: 'R-G-007',
        name: 'Glock 45 — tylko Gen 5',
        message: `Glock 45 wymaga wyłącznie Gen 5. Niezgodne: ${nonGen5.join(', ')}.`,
        affected_groups: affectedGroups,
      })
    }
  }

  // ── R-G-003: Slide–frame model compatibility (error) ─────────────────────
  if (slide && frame) {
    const slideModels = slide.compatible_models ?? []
    const isG45CrossoverException =
      config.slide === 'SLIDE-G19-G5' && config.frame === 'FRAME-G45-G5'

    if (!isG45CrossoverException && !slideModels.includes(frame.model)) {
      errors.push({
        rule_id: 'R-G-003',
        name: 'Niezgodność modelu zamka z ramką',
        message: `Zamek kompatybilny z [${slideModels.join(', ')}], nie pasuje do ramki ${frame.model}.`,
        affected_groups: ['slide', 'frame'],
      })
    }
  }

  // ── R-G-004: Barrel–slide generation & model match (error) ───────────────
  if (barrel && slide) {
    const genOk = generationsOverlap(barrel.compatible_generations, slide.compatible_generations)
    const modelOk = (barrel.compatible_models ?? []).some(m => (slide.compatible_models ?? []).includes(m))

    if (!genOk) {
      errors.push({
        rule_id: 'R-G-004',
        name: 'Niezgodność generacji lufy i zamka',
        message: `Lufa Gen ${barrel.compatible_generations.join('/')} niekompatybilna z zamkiem Gen ${slide.compatible_generations.join('/')}.`,
        affected_groups: ['barrel', 'slide'],
      })
    } else if (!modelOk) {
      errors.push({
        rule_id: 'R-G-004',
        name: 'Niezgodność modelu lufy i zamka',
        message: `Lufa dla modeli [${(barrel.compatible_models ?? []).join(', ')}] niekompatybilna z zamkiem dla [${(slide.compatible_models ?? []).join(', ')}].`,
        affected_groups: ['barrel', 'slide'],
      })
    }
  }

  // ── R-G-005: Trigger bar generation lockout (error) ───────────────────────
  if (trigger && frame) {
    if (!trigger.compatible_generations.includes(frame.generation)) {
      errors.push({
        rule_id: 'R-G-005',
        name: 'Niezgodność generacji mechanizmu spustowego',
        message: `Mechanizm spustowy Gen ${trigger.compatible_generations.join('/')} niekompatybilny z ramką Gen ${frame.generation}.`,
        affected_groups: ['trigger_group', 'frame'],
      })
    }
  }

  // ── R-G-006: G17 magazine in compact frame (warning) ─────────────────────
  if (magazine && frame) {
    if (config.magazine === 'MAG-G17-17RD' && frame.size_class === 'compact') {
      warnings.push({
        rule_id: 'R-G-006',
        name: 'Magazynek G17 w compact frame',
        message: `Magazynek G17 (17 naboi) nie pasuje do compact frame. Użyj MAG-G19-15RD.`,
        affected_groups: ['magazine', 'frame'],
      })
    }
  }

  // ── R-G-008: RSA Gen4/5 visual similarity reminder (warning) ─────────────
  if (rsa && frame) {
    const rsaId = config.recoil_spring_assembly
    if ((rsaId === 'RSA-G4-DUAL' || rsaId === 'RSA-G5-DUAL') &&
        (rsa.compatible_generations ?? []).includes(frame.generation)) {
      warnings.push({
        rule_id: 'R-G-008',
        name: 'RSA Gen 4/5 — ryzyko pomyłki',
        message: `RSA Gen 4 i Gen 5 wyglądają identycznie — zweryfikuj oznaczenia na RSA.`,
        affected_groups: ['recoil_spring_assembly'],
      })
    }
  }

  const valid = critical.length === 0 && errors.length === 0

  return { valid, critical, errors, warnings }
}

export { rulesData }
