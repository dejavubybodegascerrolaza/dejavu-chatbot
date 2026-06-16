import { sanitizeContext, captureError, captureMessage, toError } from './observability'

describe('sanitizeContext', () => {
  it('passes through safe primitive keys', () => {
    const result = sanitizeContext({
      module: 'uv.repository',
      operation: 'fetchForecast',
      appVersion: '0.1.0',
      appEnv: 'development',
      retryCount: 2,
      fromCache: false,
      extra: null,
    })
    expect(result).toEqual({
      module: 'uv.repository',
      operation: 'fetchForecast',
      appVersion: '0.1.0',
      appEnv: 'development',
      retryCount: 2,
      fromCache: false,
      extra: null,
    })
  })

  it('strips userId', () => {
    const result = sanitizeContext({ userId: 'user-123', module: 'auth.store' })
    expect(result).not.toHaveProperty('userId')
    expect(result).toHaveProperty('module')
  })

  it('strips user_id (snake_case variant)', () => {
    const result = sanitizeContext({ user_id: 'user-123', module: 'session.store' })
    expect(result).not.toHaveProperty('user_id')
  })

  it('strips email', () => {
    const result = sanitizeContext({ email: 'user@example.com', module: 'auth.store' })
    expect(result).not.toHaveProperty('email')
  })

  it('strips auth token fields', () => {
    const result = sanitizeContext({
      token: 'jwt-abc',
      accessToken: 'bearer-xyz',
      refreshToken: 'refresh-xyz',
      password: 'secret',
      key: 'some-key',
      serviceRole: 'role-key',
      anonKey: 'anon-key',
    })
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('strips coordinate fields', () => {
    const result = sanitizeContext({
      latitude: 40.416,
      longitude: -3.703,
      coordinates: { lat: 40.416, lng: -3.703 },
    })
    expect(result).not.toHaveProperty('latitude')
    expect(result).not.toHaveProperty('longitude')
    expect(result).not.toHaveProperty('coordinates')
  })

  it('strips notes (free-text)', () => {
    const result = sanitizeContext({ notes: 'Felt a bit hot', module: 'session.store' })
    expect(result).not.toHaveProperty('notes')
  })

  it('strips health-like fields', () => {
    const result = sanitizeContext({
      skinType: 2,
      skin_type: 2,
      sunSensitivity: 'medium',
      sun_sensitivity: 'medium',
      spf: 30,
    })
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('strips data payload fields', () => {
    const result = sanitizeContext({
      sessions: [{ id: '1' }],
      profile: { alias: 'Test' },
      plan: { goalLevel: 'golden' },
    })
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('drops object values even when key is not blocked', () => {
    const result = sanitizeContext({ nested: { foo: 'bar' }, module: 'test' })
    expect(result).not.toHaveProperty('nested')
    expect(result).toHaveProperty('module')
  })

  it('drops array values', () => {
    const result = sanitizeContext({ items: ['a', 'b'], module: 'test' })
    expect(result).not.toHaveProperty('items')
    expect(result).toHaveProperty('module')
  })

  it('returns empty object for empty input', () => {
    expect(sanitizeContext({})).toEqual({})
  })

  it('returns empty object when all keys are blocked', () => {
    const result = sanitizeContext({ userId: 'x', email: 'y', latitude: 1, notes: 'z' })
    expect(result).toEqual({})
  })
})

describe('captureError', () => {
  it('does not throw when called without context', () => {
    expect(() => captureError(new Error('test error'))).not.toThrow()
  })

  it('does not throw when error is not an Error instance', () => {
    expect(() => captureError('string error')).not.toThrow()
    expect(() => captureError(42)).not.toThrow()
    expect(() => captureError(null)).not.toThrow()
    expect(() => captureError(undefined)).not.toThrow()
  })

  it('does not throw when called with context', () => {
    expect(() =>
      captureError(new Error('test'), { module: 'uv.repository', operation: 'fetch' })
    ).not.toThrow()
  })

  it('does not throw when called with empty context', () => {
    expect(() => captureError(new Error('test'), {})).not.toThrow()
  })
})

describe('captureMessage', () => {
  it('does not throw for any level', () => {
    expect(() => captureMessage('info msg', 'info')).not.toThrow()
    expect(() => captureMessage('warning msg', 'warning')).not.toThrow()
    expect(() => captureMessage('error msg', 'error')).not.toThrow()
  })

  it('does not throw without level or context', () => {
    expect(() => captureMessage('bare message')).not.toThrow()
  })

  it('does not throw with context', () => {
    expect(() =>
      captureMessage('msg', 'info', { module: 'test', operation: 'testing' })
    ).not.toThrow()
  })
})

describe('toError', () => {
  it('returns the same Error when given an Error', () => {
    const err = new Error('original')
    expect(toError(err)).toBe(err)
  })

  it('converts a string to an Error with that message', () => {
    const err = toError('something went wrong')
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('something went wrong')
  })

  it('converts a number to an Error', () => {
    const err = toError(500)
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('500')
  })

  it('converts null to an Error', () => {
    const err = toError(null)
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('null')
  })

  it('converts undefined to an Error', () => {
    const err = toError(undefined)
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('undefined')
  })

  it('converts a plain object to an Error', () => {
    const err = toError({ code: 500 })
    expect(err).toBeInstanceOf(Error)
  })
})
