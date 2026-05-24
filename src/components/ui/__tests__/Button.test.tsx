import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Button } from '../Button'

describe('Button', () => {
  it('renders label', () => {
    render(<Button label="Continuar" />)
    expect(screen.getByText('Continuar')).toBeTruthy()
  })

  it('calls onPress when tapped', () => {
    const onPress = jest.fn()
    render(<Button label="Tap" onPress={onPress} />)
    fireEvent.press(screen.getByRole('button'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn()
    render(<Button label="Disabled" disabled onPress={onPress} />)
    fireEvent.press(screen.getByRole('button'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('shows ActivityIndicator when loading', () => {
    render(<Button label="Loading" loading />)
    expect(screen.queryByText('Loading')).toBeNull()
  })

  it('has correct accessibilityRole', () => {
    render(<Button label="Btn" />)
    expect(screen.getByRole('button')).toBeTruthy()
  })
})
