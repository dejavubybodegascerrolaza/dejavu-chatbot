import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { Input } from '../Input'

describe('Input', () => {
  it('renders label', () => {
    render(<Input label="Alias" />)
    expect(screen.getByText('Alias')).toBeTruthy()
  })

  it('renders error message', () => {
    render(<Input label="Campo" error="Campo obligatorio" />)
    expect(screen.getByText('Campo obligatorio')).toBeTruthy()
  })

  it('renders helper message when no error', () => {
    render(<Input helper="Máximo 50 caracteres" />)
    expect(screen.getByText('Máximo 50 caracteres')).toBeTruthy()
  })

  it('hides helper when error is present', () => {
    render(<Input helper="Helper" error="Error" />)
    expect(screen.queryByText('Helper')).toBeNull()
    expect(screen.getByText('Error')).toBeTruthy()
  })
})
