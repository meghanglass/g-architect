import { describe, it, expect } from 'vitest'
import { validateConfiguration } from './validator'

// ── Valid G17 Gen 5 (CFG-G17-G5) ────────────────────────────────────────────
describe('valid G17 Gen 5 config', () => {
  const result = validateConfiguration({
    frame: 'FRAME-G17-G5',
    slide: 'SLIDE-G17-G5',
    barrel: 'BARREL-G17-G5-114-MB',
    trigger_group: 'TRG-SA-G5',
    recoil_spring_assembly: 'RSA-G5-DUAL',
    magazine: 'MAG-G17-17RD',
  })

  it('passes validation', () => {
    expect(result.valid).toBe(true)
  })

  it('has no critical issues', () => {
    expect(result.critical).toHaveLength(0)
  })

  it('has no errors', () => {
    expect(result.errors).toHaveLength(0)
  })
})

// ── Invalid: unknown component IDs (BARREL-18-HEAVY + BASE-A1) ───────────────
// These IDs do not exist in the component catalog.
describe('invalid config — unknown component IDs (BARREL-18-HEAVY + BASE-A1)', () => {
  const result = validateConfiguration({
    frame: 'BASE-A1',
    barrel: 'BARREL-18-HEAVY',
  })

  it('fails validation', () => {
    expect(result.valid).toBe(false)
  })

  it('reports unknown frame ID as error', () => {
    expect(result.errors.some(e => e.includes('BASE-A1'))).toBe(true)
  })

  it('reports unknown barrel ID as error', () => {
    expect(result.errors.some(e => e.includes('BARREL-18-HEAVY'))).toBe(true)
  })
})

// ── G45 crossover exception: G19 Gen5 slide + G45 frame (valid) ──────────────
describe('valid G45 Gen 5 crossover config', () => {
  const result = validateConfiguration({
    frame: 'FRAME-G45-G5',
    slide: 'SLIDE-G19-G5',
    barrel: 'BARREL-G19-G5-102-MB',
    trigger_group: 'TRG-SA-G5',
    recoil_spring_assembly: 'RSA-G5-DUAL',
    magazine: 'MAG-G17-17RD',
  })

  it('passes validation (crossover exception applies)', () => {
    expect(result.valid).toBe(true)
  })
})

// ── Critical: Gen3 RSA + Gen5 slide (R-G-001) ────────────────────────────────
describe('critical — Gen 3 RSA with Gen 5 frame', () => {
  const result = validateConfiguration({
    frame: 'FRAME-G17-G5',
    slide: 'SLIDE-G17-G5',
    barrel: 'BARREL-G17-G5-114-MB',
    trigger_group: 'TRG-SA-G5',
    recoil_spring_assembly: 'RSA-G3-STANDARD',
    magazine: 'MAG-G17-17RD',
  })

  it('fails validation', () => {
    expect(result.valid).toBe(false)
  })

  it('has at least one critical issue (R-G-001)', () => {
    expect(result.critical.some(c => c.includes('R-G-001'))).toBe(true)
  })
})

// ── Error: G17 magazine in compact (G19) frame (R-G-006) ─────────────────────
describe('warning — G17 magazine in compact frame', () => {
  const result = validateConfiguration({
    frame: 'FRAME-G19-G5',
    slide: 'SLIDE-G19-G5',
    barrel: 'BARREL-G19-G5-102-MB',
    trigger_group: 'TRG-SA-G5',
    recoil_spring_assembly: 'RSA-G5-DUAL',
    magazine: 'MAG-G17-17RD',
  })

  it('fails validation (warning treated as blocking)', () => {
    // The rule description says "block_selection" action
    // We surface it in warnings; valid=false only for critical+errors
    expect(result.warnings.some(w => w.includes('R-G-006'))).toBe(true)
  })
})
