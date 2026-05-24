import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { AppText } from '../AppText'
import { colors, typographyScale } from '@/design'

describe('AppText', () => {
  it('renders children', () => {
    render(<AppText>Hola mundo</AppText>)
    expect(screen.getByText('Hola mundo')).toBeTruthy()
  })

  it('applies body variant styles by default', () => {
    render(<AppText testID="text">Texto</AppText>)
    const el = screen.getByTestId('text')
    expect(el.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ fontSize: typographyScale.body.fontSize })])
    )
  })

  it('applies display variant styles', () => {
    render(
      <AppText variant="display" testID="text">
        Display
      </AppText>
    )
    const el = screen.getByTestId('text')
    expect(el.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fontSize: typographyScale.display.fontSize }),
      ])
    )
  })

  it('applies color token', () => {
    render(
      <AppText color="danger" testID="text">
        Error
      </AppText>
    )
    const el = screen.getByTestId('text')
    expect(el.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: colors.danger })])
    )
  })
})
