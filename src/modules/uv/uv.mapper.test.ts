import { mapOpenMeteoToForecast } from './uv.mapper'
import type { OpenMeteoResponse } from './uv.schema'

const FETCHED_AT = '2026-06-15T10:05:00.000Z'
const COORDS = { latitude: 40.4, longitude: -3.7 }

function buildResponse(overrides?: Partial<OpenMeteoResponse>): OpenMeteoResponse {
  return {
    latitude: 40.4,
    longitude: -3.7,
    current: { time: '2026-06-15T10:00', uv_index: 6.24 },
    hourly: {
      time: ['2026-06-15T09:00', '2026-06-15T13:00', '2026-06-16T09:00'],
      uv_index: [3.1, 9.4, 2.0],
    },
    ...overrides,
  }
}

describe('mapOpenMeteoToForecast', () => {
  it('keeps only the hourly readings for the current day', () => {
    const forecast = mapOpenMeteoToForecast(buildResponse(), COORDS, FETCHED_AT)
    expect(forecast.hourly).toHaveLength(2)
    expect(forecast.hourly.every((r) => r.time.startsWith('2026-06-15'))).toBe(true)
  })

  it('rounds the current reading to one decimal', () => {
    const forecast = mapOpenMeteoToForecast(buildResponse(), COORDS, FETCHED_AT)
    expect(forecast.current.uvIndex).toBe(6.2)
  })

  it('computes the daily max and peak window from same-day readings', () => {
    const forecast = mapOpenMeteoToForecast(buildResponse(), COORDS, FETCHED_AT)
    expect(forecast.maxToday).toBe(9.4)
    expect(forecast.peakWindow).toEqual({ startHour: 13, endHour: 13, maxUvIndex: 9.4 })
  })

  it('clamps negative UV readings to zero', () => {
    const response = buildResponse({
      current: { time: '2026-06-15T06:00', uv_index: -0.5 },
    })
    const forecast = mapOpenMeteoToForecast(response, COORDS, FETCHED_AT)
    expect(forecast.current.uvIndex).toBe(0)
  })

  it('records the requested coordinates and fetch time', () => {
    const forecast = mapOpenMeteoToForecast(buildResponse(), COORDS, FETCHED_AT)
    expect(forecast.coordinates).toEqual(COORDS)
    expect(forecast.fetchedAt).toBe(FETCHED_AT)
  })
})
