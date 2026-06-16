import {
  buildSessionSaveAcknowledgement,
  parseSessionSaveAcknowledgement,
} from './session.acknowledgement'
import type { SaveAckTone } from './session.acknowledgement'
import type { SensationAfter } from './session.types'

const ALL_SENSATIONS: SensationAfter[] = ['great', 'normal', 'warm_tight', 'slightly_red', 'burned']

// ── buildSessionSaveAcknowledgement ─────────────────────────────────────────────

describe('buildSessionSaveAcknowledgement', () => {
  const EXPECTED_TONE: Record<SensationAfter, SaveAckTone> = {
    great: 'positive',
    normal: 'positive',
    warm_tight: 'caution',
    slightly_red: 'recovery',
    burned: 'avoid',
  }

  it.each(ALL_SENSATIONS)('returns the expected tone for "%s"', (s) => {
    expect(buildSessionSaveAcknowledgement(s).tone).toBe(EXPECTED_TONE[s])
  })

  it('always includes a non-empty title and message', () => {
    for (const s of ALL_SENSATIONS) {
      const ack = buildSessionSaveAcknowledgement(s)
      expect(ack.title.length).toBeGreaterThan(0)
      expect(ack.message.length).toBeGreaterThan(0)
    }
  })

  it('positive responses reinforce logging without alarmism', () => {
    expect(buildSessionSaveAcknowledgement('great').message).toContain('ajustar')
    expect(buildSessionSaveAcknowledgement('normal').message).toContain('ajustar')
  })

  it('warm_tight says the margin will be reduced prudently', () => {
    expect(buildSessionSaveAcknowledgement('warm_tight').message).toContain('margen')
  })

  it('slightly_red prioritises recovery', () => {
    expect(buildSessionSaveAcknowledgement('slightly_red').message).toContain('recuperación')
  })

  it('burned advises pausing direct exposure and is not medical advice', () => {
    const ack = buildSessionSaveAcknowledgement('burned')
    expect(ack.message).toContain('pausa la exposición directa')
    expect(ack.message).toContain('No es consejo médico')
  })

  it('avoids medical claims and unsafe wording in all copy', () => {
    const forbidden =
      /diagn[oó]stico|tratamiento|piel da[ñn]ada|sin riesgo|garantiz|\brecuperado\b|puedes volver al sol|respuesta detectada|todo bien|\bsegur[oa]\b/i
    for (const s of ALL_SENSATIONS) {
      const ack = buildSessionSaveAcknowledgement(s)
      expect(ack.title).not.toMatch(forbidden)
      expect(ack.message).not.toMatch(forbidden)
    }
  })
})

// ── parseSessionSaveAcknowledgement ─────────────────────────────────────────────

describe('parseSessionSaveAcknowledgement', () => {
  it('parses a valid sensation param', () => {
    expect(parseSessionSaveAcknowledgement('burned')?.tone).toBe('avoid')
  })

  it('returns null for an invalid sensation value', () => {
    expect(parseSessionSaveAcknowledgement('fine')).toBeNull()
  })

  it('returns null for a missing param', () => {
    expect(parseSessionSaveAcknowledgement(undefined)).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(parseSessionSaveAcknowledgement('')).toBeNull()
  })

  it('takes the first entry of an array param', () => {
    expect(parseSessionSaveAcknowledgement(['slightly_red', 'great'])?.tone).toBe('recovery')
  })

  it('returns null for an empty array', () => {
    expect(parseSessionSaveAcknowledgement([])).toBeNull()
  })

  it('matches buildSessionSaveAcknowledgement for every valid value', () => {
    for (const s of ALL_SENSATIONS) {
      expect(parseSessionSaveAcknowledgement(s)).toEqual(buildSessionSaveAcknowledgement(s))
    }
  })
})
