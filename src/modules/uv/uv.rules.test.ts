import { classifyUv, computePeakWindow, maxUvOf, UV_HIGH_THRESHOLD } from './uv.rules'
import type { UvReading } from './uv.types'

describe('classifyUv', () => {
  it('maps UV index to WHO categories', () => {
    expect(classifyUv(0)).toBe('low')
    expect(classifyUv(2.9)).toBe('low')
    expect(classifyUv(3)).toBe('moderate')
    expect(classifyUv(5.9)).toBe('moderate')
    expect(classifyUv(6)).toBe('high')
    expect(classifyUv(7.9)).toBe('high')
    expect(classifyUv(8)).toBe('very_high')
    expect(classifyUv(10.9)).toBe('very_high')
    expect(classifyUv(11)).toBe('extreme')
    expect(classifyUv(13)).toBe('extreme')
  })
})

function reading(hour: number, uvIndex: number): UvReading {
  const hh = hour < 10 ? `0${hour}` : String(hour)
  return { time: `2026-06-15T${hh}:00`, uvIndex }
}

describe('computePeakWindow', () => {
  it('returns null when no hour reaches the high threshold', () => {
    const hourly = [reading(9, 2), reading(12, 5), reading(15, 4)]
    expect(computePeakWindow(hourly)).toBeNull()
  })

  it('returns the first and last high hour plus the daily max', () => {
    const hourly = [
      reading(9, 3),
      reading(11, UV_HIGH_THRESHOLD),
      reading(13, 9),
      reading(16, UV_HIGH_THRESHOLD),
      reading(18, 3),
    ]
    expect(computePeakWindow(hourly)).toEqual({ startHour: 11, endHour: 16, maxUvIndex: 9 })
  })
})

describe('maxUvOf', () => {
  it('returns the highest reading rounded to one decimal', () => {
    expect(maxUvOf([reading(10, 4.25), reading(13, 8.17), reading(16, 5)])).toBe(8.2)
  })

  it('returns 0 for an empty list', () => {
    expect(maxUvOf([])).toBe(0)
  })
})
