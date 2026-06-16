import { buildSolarWindow } from './uv.window'

function reading(hour: number, uvIndex: number) {
  const h = hour < 10 ? `0${hour}` : String(hour)
  return { time: `2026-06-16T${h}:00:00`, uvIndex }
}

describe('buildSolarWindow', () => {
  it('returns insufficient_data when hourly is empty', () => {
    const result = buildSolarWindow({ hourly: [], currentHour: 12, peakWindow: null })
    expect(result.status).toBe('insufficient_data')
    expect(result.conservativeHour).toBeNull()
    expect(result.note).toBe('')
  })

  it('returns avoid_peak when current hour is inside the peak window', () => {
    const hourly = [
      reading(10, 7),
      reading(11, 8),
      reading(12, 9),
      reading(14, 7),
      reading(15, 5),
      reading(16, 3),
    ]
    const peakWindow = { startHour: 10, endHour: 14, maxUvIndex: 9 }
    const result = buildSolarWindow({ hourly, currentHour: 12, peakWindow })
    expect(result.status).toBe('avoid_peak')
    expect(result.conservativeHour).toBe(15)
  })

  it('returns better_later when future hours are in a lower WHO category', () => {
    const hourly = [
      reading(9, 5), // moderate (current)
      reading(10, 6),
      reading(11, 7),
      reading(12, 6),
      reading(17, 2), // low
      reading(18, 1), // low — best
    ]
    const result = buildSolarWindow({ hourly, currentHour: 9, peakWindow: null })
    expect(result.status).toBe('better_later')
    expect(result.conservativeHour).toBe(18)
  })

  it('returns conservative_now when current UV is already low', () => {
    const hourly = [reading(7, 1), reading(8, 2), reading(9, 2)]
    const result = buildSolarWindow({ hourly, currentHour: 7, peakWindow: null })
    expect(result.status).toBe('conservative_now')
    expect(result.conservativeHour).toBeNull()
  })

  it('returns conservative_now when there are no future readings', () => {
    const hourly = [reading(14, 4), reading(15, 4), reading(16, 3)]
    const result = buildSolarWindow({ hourly, currentHour: 18, peakWindow: null })
    expect(result.status).toBe('conservative_now')
    expect(result.conservativeHour).toBeNull()
  })

  it('returns conservative_now when future UV is in the same category', () => {
    const hourly = [
      reading(10, 5), // moderate
      reading(14, 5), // moderate — same category
    ]
    const result = buildSolarWindow({ hourly, currentHour: 10, peakWindow: null })
    expect(result.status).toBe('conservative_now')
  })

  it('returns conservative_now when future UV is higher (peak approaching)', () => {
    const hourly = [
      reading(9, 3), // moderate now
      reading(12, 7), // high — worse later
    ]
    const result = buildSolarWindow({ hourly, currentHour: 9, peakWindow: null })
    expect(result.status).toBe('conservative_now')
  })

  it('does not trigger avoid_peak when current hour is before the peak window', () => {
    const hourly = [reading(8, 4), reading(12, 8), reading(16, 4)]
    const peakWindow = { startHour: 11, endHour: 15, maxUvIndex: 8 }
    const result = buildSolarWindow({ hourly, currentHour: 8, peakWindow })
    expect(result.status).not.toBe('avoid_peak')
  })

  it('does not trigger avoid_peak when current hour is after the peak window', () => {
    const hourly = [reading(12, 8), reading(17, 3)]
    const peakWindow = { startHour: 11, endHour: 15, maxUvIndex: 8 }
    const result = buildSolarWindow({ hourly, currentHour: 17, peakWindow })
    expect(result.status).not.toBe('avoid_peak')
  })

  it('avoid_peak note includes the hour after the peak ends', () => {
    const hourly = [reading(13, 8), reading(16, 5)]
    const peakWindow = { startHour: 12, endHour: 15, maxUvIndex: 9 }
    const result = buildSolarWindow({ hourly, currentHour: 13, peakWindow })
    expect(result.note).toContain('16:00')
  })

  it('better_later note includes the calmer hour', () => {
    const hourly = [
      reading(10, 6), // high
      reading(17, 2), // low
    ]
    const result = buildSolarWindow({ hourly, currentHour: 10, peakWindow: null })
    expect(result.note).toContain('17:00')
  })

  it('note does not contain overclaim language', () => {
    const hourly = [reading(9, 5), reading(18, 1)]
    const result = buildSolarWindow({ hourly, currentHour: 9, peakWindow: null })
    const note = result.note.toLowerCase()
    expect(note).not.toMatch(/segur/)
    expect(note).not.toMatch(/sin riesgo/)
    expect(note).not.toMatch(/garantiz/)
    expect(note).not.toMatch(/sin peligro/)
  })

  it('uses the closest reading when no exact match for currentHour exists', () => {
    // Readings at 8 and 14; currentHour = 9 → closest is 8
    const hourly = [
      reading(8, 5), // moderate — closest to currentHour 9
      reading(14, 2), // low — future, better
    ]
    const result = buildSolarWindow({ hourly, currentHour: 9, peakWindow: null })
    // 8 is closest to 9; 14 (low) is better than 8's moderate → better_later
    expect(result.status).toBe('better_later')
    expect(result.conservativeHour).toBe(14)
  })
})
