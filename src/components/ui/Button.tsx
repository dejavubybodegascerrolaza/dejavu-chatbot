import React from 'react'
import { ActivityIndicator, Pressable, PressableProps, StyleSheet, ViewStyle } from 'react-native'
import { colors, radius, spacing } from '@/design'
import { AppText } from './AppText'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'lg'

type Props = PressableProps & {
  label: string
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const containerStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.brand },
  secondary: { backgroundColor: colors.brandSoft, borderWidth: 1, borderColor: colors.brand },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.danger },
}

const pressedStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.brandDark },
  secondary: { backgroundColor: colors.bronzeSoft },
  ghost: { backgroundColor: colors.backgroundMuted },
  danger: { backgroundColor: colors.dangerDark },
}

const labelColors: Record<Variant, keyof typeof colors> = {
  primary: 'white',
  secondary: 'brand',
  ghost: 'brand',
  danger: 'white',
}

const sizeStyles: Record<Size, ViewStyle> = {
  md: { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.lg },
  lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: Props) {
  const isDisabled = disabled === true || loading

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        containerStyles[variant],
        sizeStyles[size],
        pressed && !isDisabled ? pressedStyles[variant] : undefined,
        isDisabled ? styles.disabled : undefined,
        fullWidth ? styles.fullWidth : undefined,
        style as ViewStyle,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' || variant === 'ghost' ? colors.brand : colors.white}
        />
      ) : (
        <AppText variant="label" color={labelColors[variant]}>
          {label}
        </AppText>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  disabled: { opacity: 0.4 },
  fullWidth: { width: '100%' },
})
