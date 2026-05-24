import React from 'react'
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native'
import { colors, radius, shadows, spacing } from '@/design'

type Variant = 'default' | 'elevated' | 'outlined'

type Props = ViewProps & {
  variant?: Variant
  padding?: keyof typeof spacing
}

const variantStyles: Record<Variant, ViewStyle> = {
  default: { backgroundColor: colors.surface },
  elevated: {
    backgroundColor: colors.surfaceElevated,
    ...shadows.soft,
  },
  outlined: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
}

export function Card({ variant = 'default', padding = 'md', style, children, ...rest }: Props) {
  return (
    <View
      style={[styles.base, variantStyles[variant], { padding: spacing[padding] }, style]}
      {...rest}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
  },
})
