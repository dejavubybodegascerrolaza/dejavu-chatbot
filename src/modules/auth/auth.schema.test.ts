import { loginSchema, registerSchema } from './auth.schema'

describe('loginSchema', () => {
  it('passes with valid email and password', () => {
    expect(
      loginSchema.safeParse({ email: 'user@example.com', password: 'password123' }).success
    ).toBe(true)
  })

  it('fails with invalid email', () => {
    const result = loginSchema.safeParse({ email: 'notanemail', password: 'password123' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Introduce un email válido.')
    }
  })

  it('fails with empty email', () => {
    expect(loginSchema.safeParse({ email: '', password: 'password123' }).success).toBe(false)
  })

  it('fails with password shorter than 8 characters', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'short' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'La contraseña debe tener al menos 8 caracteres.'
      )
    }
  })

  it('passes with exactly 8 character password', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: '12345678' }).success).toBe(
      true
    )
  })
})

describe('registerSchema', () => {
  const valid = {
    email: 'user@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  }

  it('passes with valid input', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('fails with invalid email', () => {
    const result = registerSchema.safeParse({ ...valid, email: 'notanemail' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message === 'Introduce un email válido.')).toBe(true)
    }
  })

  it('fails with password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: 'short',
      confirmPassword: 'short',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some(
          (i) => i.message === 'La contraseña debe tener al menos 8 caracteres.'
        )
      ).toBe(true)
    }
  })

  it('fails when passwords do not match', () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: 'different123' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const confirmError = result.error.issues.find((i) => i.path.includes('confirmPassword'))
      expect(confirmError?.message).toBe('Las contraseñas no coinciden.')
    }
  })

  it('fails when confirmPassword is empty', () => {
    expect(registerSchema.safeParse({ ...valid, confirmPassword: '' }).success).toBe(false)
  })
})
