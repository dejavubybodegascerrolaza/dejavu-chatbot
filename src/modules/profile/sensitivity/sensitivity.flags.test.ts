import { getCareFlags, getCareNotes, hasElevatedCaution } from './sensitivity.flags'
import type { SensitivityProfile } from './sensitivity.flags'

describe('getCareFlags', () => {
  it('returns no flags for an empty profile', () => {
    expect(getCareFlags({})).toEqual([])
    expect(hasElevatedCaution({})).toBe(false)
  })

  it('returns no flags for low-risk answers', () => {
    const profile: SensitivityProfile = {
      ageRange: '26_35',
      blisteringSunburns: 'none',
      tanningBedUse: 'never',
      moleCount: 'few',
    }
    expect(getCareFlags(profile)).toEqual([])
    expect(hasElevatedCaution(profile)).toBe(false)
  })

  it('flags childhood blistering sunburns', () => {
    expect(getCareFlags({ blisteringSunburns: 'childhood' })).toEqual(['childhood_burns'])
    expect(hasElevatedCaution({ blisteringSunburns: 'childhood' })).toBe(true)
  })

  it('does not flag adult-only blistering sunburns', () => {
    expect(getCareFlags({ blisteringSunburns: 'adult' })).toEqual([])
  })

  it('flags many moles and regular tanning-bed use', () => {
    expect(getCareFlags({ moleCount: 'many' })).toEqual(['many_moles'])
    expect(getCareFlags({ tanningBedUse: 'regular' })).toEqual(['regular_tanning_beds'])
  })

  it('returns all applicable flags in priority order', () => {
    const profile: SensitivityProfile = {
      blisteringSunburns: 'childhood',
      moleCount: 'many',
      tanningBedUse: 'regular',
    }
    expect(getCareFlags(profile)).toEqual(['childhood_burns', 'many_moles', 'regular_tanning_beds'])
    expect(hasElevatedCaution(profile)).toBe(true)
  })
})

describe('getCareNotes', () => {
  it('maps each flag to a non-empty guidance note', () => {
    const notes = getCareNotes({
      blisteringSunburns: 'childhood',
      moleCount: 'many',
      tanningBedUse: 'regular',
    })
    expect(notes).toHaveLength(3)
    for (const note of notes) {
      expect(note.length).toBeGreaterThan(0)
    }
  })

  it('returns an empty list when there is nothing to flag', () => {
    expect(getCareNotes({ moleCount: 'few' })).toEqual([])
  })
})
