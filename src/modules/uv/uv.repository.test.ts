import { fetchUvForecast } from './uv.repository'

const COORDS = { latitude: 40.4, longitude: -3.7 }

const VALID_BODY = {
  latitude: 40.4,
  longitude: -3.7,
  current: { time: '2026-06-15T10:00', uv_index: 6.2 },
  hourly: {
    time: ['2026-06-15T10:00', '2026-06-15T13:00'],
    uv_index: [6.2, 9.0],
  },
}

function mockFetchOnce(impl: () => Promise<unknown>) {
  global.fetch = jest.fn(impl) as unknown as typeof fetch
}

describe('fetchUvForecast', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns a mapped forecast on a valid response', async () => {
    mockFetchOnce(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(VALID_BODY) } as Response)
    )
    const forecast = await fetchUvForecast(COORDS)
    expect(forecast.current.uvIndex).toBe(6.2)
    expect(forecast.maxToday).toBe(9)
    expect(forecast.coordinates).toEqual(COORDS)
  })

  it('requests Open-Meteo with the given coordinates', async () => {
    const spy: jest.Mock = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(VALID_BODY) } as Response)
    )
    global.fetch = spy as unknown as typeof fetch
    await fetchUvForecast(COORDS)
    const calledUrl = String(spy.mock.calls[0]?.[0])
    expect(calledUrl).toContain('latitude=40.4')
    expect(calledUrl).toContain('longitude=-3.7')
    expect(calledUrl).toContain('current=uv_index')
  })

  it('throws a connection error when fetch rejects', async () => {
    mockFetchOnce(() => Promise.reject(new Error('network down')))
    await expect(fetchUvForecast(COORDS)).rejects.toThrow('No se ha podido conectar')
  })

  it('throws an availability error on a non-ok response', async () => {
    mockFetchOnce(() => Promise.resolve({ ok: false, json: () => Promise.resolve({}) } as Response))
    await expect(fetchUvForecast(COORDS)).rejects.toThrow('no está disponible')
  })

  it('throws a validation error on a malformed response', async () => {
    mockFetchOnce(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ foo: 'bar' }) } as Response)
    )
    await expect(fetchUvForecast(COORDS)).rejects.toThrow('no es válida')
  })
})
