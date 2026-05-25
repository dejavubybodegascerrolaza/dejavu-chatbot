import { CONTEXT_LABELS, PROTECTION_LABELS, SENSATION_LABELS } from './session.labels'
import type { ExposureContext, ProtectionLevel, SensationAfter } from './session.types'

const ALL_CONTEXTS: ExposureContext[] = [
  'beach',
  'pool',
  'urban',
  'terrace_garden',
  'outdoor_sport',
  'other',
]

const ALL_PROTECTION_LEVELS: ProtectionLevel[] = ['unknown', 'high', 'medium', 'none', 'not_sure']

const ALL_SENSATIONS: SensationAfter[] = ['great', 'normal', 'warm_tight', 'slightly_red', 'burned']

describe('CONTEXT_LABELS', () => {
  it('has a label for every ExposureContext value', () => {
    for (const ctx of ALL_CONTEXTS) {
      expect(CONTEXT_LABELS[ctx]).toBeDefined()
      expect(typeof CONTEXT_LABELS[ctx]).toBe('string')
      expect(CONTEXT_LABELS[ctx].length).toBeGreaterThan(0)
    }
  })

  it('maps known values correctly', () => {
    expect(CONTEXT_LABELS.beach).toBe('Playa')
    expect(CONTEXT_LABELS.pool).toBe('Piscina')
    expect(CONTEXT_LABELS.urban).toBe('Ciudad / paseo')
    expect(CONTEXT_LABELS.terrace_garden).toBe('Terraza / jardín')
    expect(CONTEXT_LABELS.outdoor_sport).toBe('Deporte exterior')
    expect(CONTEXT_LABELS.other).toBe('Otro')
  })
})

describe('PROTECTION_LABELS', () => {
  it('has a label for every ProtectionLevel value', () => {
    for (const level of ALL_PROTECTION_LEVELS) {
      expect(PROTECTION_LABELS[level]).toBeDefined()
      expect(typeof PROTECTION_LABELS[level]).toBe('string')
      expect(PROTECTION_LABELS[level].length).toBeGreaterThan(0)
    }
  })

  it('maps known values correctly', () => {
    expect(PROTECTION_LABELS.unknown).toBe('No indicado')
    expect(PROTECTION_LABELS.high).toBe('Sí, protección alta')
    expect(PROTECTION_LABELS.medium).toBe('Sí, protección media')
    expect(PROTECTION_LABELS.none).toBe('No')
    expect(PROTECTION_LABELS.not_sure).toBe('No lo recuerdo')
  })
})

describe('SENSATION_LABELS', () => {
  it('has a label for every SensationAfter value', () => {
    for (const sensation of ALL_SENSATIONS) {
      expect(SENSATION_LABELS[sensation]).toBeDefined()
      expect(typeof SENSATION_LABELS[sensation]).toBe('string')
      expect(SENSATION_LABELS[sensation].length).toBeGreaterThan(0)
    }
  })

  it('maps known values correctly', () => {
    expect(SENSATION_LABELS.great).toBe('Bien')
    expect(SENSATION_LABELS.normal).toBe('Normal')
    expect(SENSATION_LABELS.warm_tight).toBe('Piel caliente o tirante')
    expect(SENSATION_LABELS.slightly_red).toBe('Ligero enrojecimiento')
    expect(SENSATION_LABELS.burned).toBe('Quemadura o molestia clara')
  })
})
