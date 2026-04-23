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

export interface ValidationResult {
  valid: boolean
  critical: string[]
  errors: string[]
  warnings: string[]
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
  const critical: string[] = []
  const errors: string[] = []
  const warnings: string[] = []

  const frame = get<FrameComponent>(config.frame)
  const slide = get<SlideComponent>(config.slide)
  const barrel = get<BarrelComponent>(config.barrel)
  const trigger = get<TriggerComponent>(config.trigger_group)
  const rsa = get<RSAComponent>(config.recoil_spring_assembly)
  const magazine = get<MagazineComponent>(config.magazine)

  // Unknown component IDs → invalid immediately
  if (config.frame && !frame) errors.push(`Nieznany komponent ramki: ${config.frame}`)
  if (config.slide && !slide) errors.push(`Nieznany komponent zamka: ${config.slide}`)
  if (config.barrel && !barrel) errors.push(`Nieznany komponent lufy: ${config.barrel}`)
  if (config.trigger_group && !trigger) errors.push(`Nieznany mechanizm spustowy: ${config.trigger_group}`)
  if (config.recoil_spring_assembly && !rsa) errors.push(`Nieznany RSA: ${config.recoil_spring_assembly}`)
  if (config.magazine && !magazine) errors.push(`Nieznany magazynek: ${config.magazine}`)

  // ── R-G-001: RSA inter-generational lockout (critical) ────────────────────
  if (rsa && frame) {
    const rsaGens = rsa.compatible_generations ?? []
    if (!rsaGens.includes(frame.generation)) {
      critical.push(
        `[R-G-001] BŁĄD KRYTYCZNY: RSA (Gen ${rsaGens.join('/')}) niekompatybilna z ramką Gen ${frame.generation}. Ryzyko awarii.`
      )
    }
  }

  // ── R-G-002: Generation mismatch across all components (critical) ─────────
  if (frame) {
    const frameGen = frame.generation
    const mismatched: string[] = []

    if (slide && !slide.compatible_generations.includes(frameGen))
      mismatched.push(`zamek (Gen ${slide.compatible_generations.join('/')})`)
    if (barrel && !barrel.compatible_generations.includes(frameGen))
      mismatched.push(`lufa (Gen ${barrel.compatible_generations.join('/')})`)
    if (trigger && !trigger.compatible_generations.includes(frameGen))
      mismatched.push(`mechanizm spustowy (Gen ${trigger.compatible_generations.join('/')})`)
    if (rsa && !(rsa.compatible_generations ?? []).includes(frameGen))
      mismatched.push(`RSA (Gen ${(rsa.compatible_generations ?? []).join('/')})`)

    if (mismatched.length > 0) {
      critical.push(
        `[R-G-002] Ramka Gen ${frameGen} niekompatybilna z: ${mismatched.join(', ')}. Wymagana jednolita generacja.`
      )
    }
  }

  // ── R-G-007: G45 Gen 5 only (critical) ───────────────────────────────────
  const frameAsAny = frame as (FrameComponent & { model?: string }) | null
  if (frameAsAny?.model === 'G45') {
    const nonGen5: string[] = []
    if (slide && !slide.compatible_generations.includes(5)) nonGen5.push('zamek')
    if (barrel && !barrel.compatible_generations.includes(5)) nonGen5.push('lufa')
    if (trigger && !trigger.compatible_generations.includes(5)) nonGen5.push('mechanizm spustowy')
    if (rsa && !(rsa.compatible_generations ?? []).includes(5)) nonGen5.push('RSA')
    if (nonGen5.length > 0) {
      critical.push(`[R-G-007] Glock 45 wymaga wyłącznie Gen 5. Niezgodne: ${nonGen5.join(', ')}.`)
    }
  }

  // ── R-G-003: Slide–frame model compatibility (error) ─────────────────────
  if (slide && frame) {
    const slideModels = slide.compatible_models ?? []
    const isG45CrossoverException =
      config.slide === 'SLIDE-G19-G5' && config.frame === 'FRAME-G45-G5'

    if (!isG45CrossoverException && !slideModels.includes(frame.model)) {
      errors.push(
        `[R-G-003] Zamek kompatybilny z [${slideModels.join(', ')}], nie pasuje do ramki ${frame.model}.`
      )
    }
  }

  // ── R-G-004: Barrel–slide generation & model match (error) ───────────────
  if (barrel && slide) {
    const genOk = generationsOverlap(barrel.compatible_generations, slide.compatible_generations)
    const modelOk = generationsOverlap(
      barrel.compatible_models?.map(Number) ?? [],
      slide.compatible_models?.map(Number) ?? []
    ) || (barrel.compatible_models ?? []).some(m => (slide.compatible_models ?? []).includes(m))

    if (!genOk) {
      errors.push(
        `[R-G-004] Lufa Gen ${barrel.compatible_generations.join('/')} niekompatybilna z zamkiem Gen ${slide.compatible_generations.join('/')}.`
      )
    } else if (!modelOk) {
      errors.push(
        `[R-G-004] Lufa dla modeli [${(barrel.compatible_models ?? []).join(', ')}] niekompatybilna z zamkiem dla [${(slide.compatible_models ?? []).join(', ')}].`
      )
    }
  }

  // ── R-G-005: Trigger bar generation lockout (error) ───────────────────────
  if (trigger && frame) {
    if (!trigger.compatible_generations.includes(frame.generation)) {
      errors.push(
        `[R-G-005] Mechanizm spustowy Gen ${trigger.compatible_generations.join('/')} niekompatybilny z ramką Gen ${frame.generation}.`
      )
    }
  }

  // ── R-G-006: G17 magazine in compact frame (warning) ─────────────────────
  if (magazine && frame) {
    const mag = magazine as MagazineComponent
    if (config.magazine === 'MAG-G17-17RD' && frame.size_class === 'compact') {
      warnings.push(
        `[R-G-006] Magazynek G17 (17 naboi) nie pasuje do compact frame. Użyj MAG-G19-15RD.`
      )
    }
    // Suppress unused variable warning — mag used for type narrowing above
    void mag
  }

  // ── R-G-008: RSA Gen4/5 visual similarity reminder (warning) ─────────────
  if (rsa && frame) {
    const rsaId = config.recoil_spring_assembly
    if ((rsaId === 'RSA-G4-DUAL' || rsaId === 'RSA-G5-DUAL') &&
        (rsa.compatible_generations ?? []).includes(frame.generation)) {
      warnings.push(
        `[R-G-008] RSA Gen 4 i Gen 5 wyglądają identycznie — zweryfikuj oznaczenia na RSA.`
      )
    }
  }

  const valid = critical.length === 0 && errors.length === 0

  return { valid, critical, errors, warnings }
}

export { rulesData }
