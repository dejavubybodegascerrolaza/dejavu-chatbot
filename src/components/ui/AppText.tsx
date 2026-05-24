import React from 'react'
import { Text, TextProps, TextStyle } from 'react-native'
import { colors, getTextStyle, TextVariant } from '@/design'

type Props = TextProps & {
  variant?: TextVariant
  color?: keyof typeof colors
  align?: TextStyle['textAlign']
}

export function AppText({ variant = 'body', color = 'textPrimary', align, style, ...rest }: Props) {
  return (
    <Text
      style={[getTextStyle(variant), { color: colors[color], textAlign: align }, style]}
      {...rest}
    />
  )
}
