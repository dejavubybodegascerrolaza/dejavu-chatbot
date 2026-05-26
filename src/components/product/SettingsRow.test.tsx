import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { SettingsRow } from './SettingsRow'

describe('SettingsRow', () => {
  it('renders title', () => {
    const { getByText } = render(<SettingsRow title="Editar perfil" onPress={jest.fn()} />)
    expect(getByText('Editar perfil')).toBeTruthy()
  })

  it('renders description when provided', () => {
    const { getByText } = render(
      <SettingsRow title="Editar perfil" description="Cambia tu alias" onPress={jest.fn()} />
    )
    expect(getByText('Cambia tu alias')).toBeTruthy()
  })

  it('does not render description when omitted', () => {
    const { queryByText } = render(<SettingsRow title="Editar perfil" onPress={jest.fn()} />)
    expect(queryByText('Cambia tu alias')).toBeNull()
  })

  it('calls onPress when pressed', () => {
    const onPress = jest.fn()
    const { getByRole } = render(<SettingsRow title="Editar perfil" onPress={onPress} />)
    fireEvent.press(getByRole('button'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('has accessibilityLabel equal to title', () => {
    const { getByLabelText } = render(
      <SettingsRow title="Solicitar eliminación" onPress={jest.fn()} variant="danger" />
    )
    expect(getByLabelText('Solicitar eliminación')).toBeTruthy()
  })
})
