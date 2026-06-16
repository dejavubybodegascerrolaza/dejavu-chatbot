import {
  formatClock,
  getLiveRecoveryNote,
  getLiveUvWarning,
  LIVE_DISCLAIMER_NOTE,
  LIVE_DISCOMFORT_NOTE,
  LIVE_END_EARLY_NOTE,
  LIVE_STATUS_LABELS,
  LIVE_STATUS_MESSAGES,
} from './live.labels'
import type { RecoveryLevel } from '../recovery/recovery.types'
import type { UvCategory } from '../uv/uv.types'

describe('formatClock', () => {
  it('formats under a minute', () => {
    expect(formatClock(5)).toBe('00:05')
  })

  it('formats minutes and seconds', () => {
    expect(formatClock(125)).toBe('02:05')
  })

  it('formats past an hour', () => {
    expect(formatClock(3725)).toBe('1:02:05')
  })

  it('clamps negatives to zero', () => {
    expect(formatClock(-30)).toBe('00:00')
  })
})

describe('live status copy', () => {
  it('has a label and message for every status', () => {
    expect(LIVE_STATUS_LABELS.danger).toBe('Cúbrete ya')
    expect(LIVE_STATUS_MESSAGES.caution).toContain('techo estimado')
    expect(LIVE_STATUS_MESSAGES.no_risk).toContain('UV')
  })
})

describe('getLiveRecoveryNote', () => {
  it('returns null when there is no recovery signal', () => {
    expect(getLiveRecoveryNote('none')).toBeNull()
  })

  it('returns a caution note for each non-none level', () => {
    const levels: Exclude<RecoveryLevel, 'none'>[] = [
      'caution',
      'recovery_recommended',
      'avoid_direct_exposure',
    ]
    for (const level of levels) {
      const note = getLiveRecoveryNote(level)
      expect(note).not.toBeNull()
      expect((note ?? '').length).toBeGreaterThan(0)
    }
  })

  it('escalates wording for avoid_direct_exposure', () => {
    expect(getLiveRecoveryNote('avoid_direct_exposure')).toContain('evitar la exposición directa')
  })
})

describe('getLiveUvWarning', () => {
  it('returns null for low and moderate UV', () => {
    expect(getLiveUvWarning('low')).toBeNull()
    expect(getLiveUvWarning('moderate')).toBeNull()
  })

  it('returns null when the category is unknown', () => {
    expect(getLiveUvWarning(null)).toBeNull()
  })

  it('returns a warning for high, very_high and extreme UV', () => {
    const cats: UvCategory[] = ['high', 'very_high', 'extreme']
    for (const cat of cats) {
      const note = getLiveUvWarning(cat)
      expect(note).not.toBeNull()
      expect((note ?? '').length).toBeGreaterThan(0)
    }
  })
})

describe('live session copy safety', () => {
  const FORBIDDEN =
    /tiempo seguro|dosis segura|sin riesgo|puedes seguir tranquilo|seguro con spf|quema controlada|aprovecha más sol|maximiza bronceado/i

  it('no live-session copy uses risky language', () => {
    const recoveryLevels: RecoveryLevel[] = [
      'none',
      'caution',
      'recovery_recommended',
      'avoid_direct_exposure',
    ]
    const uvCats: (UvCategory | null)[] = [null, 'low', 'moderate', 'high', 'very_high', 'extreme']

    const strings: string[] = [
      ...Object.values(LIVE_STATUS_LABELS),
      ...Object.values(LIVE_STATUS_MESSAGES),
      LIVE_DISCOMFORT_NOTE,
      LIVE_END_EARLY_NOTE,
      LIVE_DISCLAIMER_NOTE,
      ...recoveryLevels.map((l) => getLiveRecoveryNote(l) ?? ''),
      ...uvCats.map((c) => getLiveUvWarning(c) ?? ''),
    ]

    for (const s of strings) {
      expect(s).not.toMatch(FORBIDDEN)
    }
  })

  it('exposes the supportive end-early and disclaimer notes', () => {
    expect(LIVE_END_EARLY_NOTE).toContain('buena decisión')
    expect(LIVE_DISCLAIMER_NOTE).toContain('No es consejo médico')
    expect(LIVE_DISCOMFORT_NOTE).toContain('termina la sesión')
  })
})
