import React, { useState } from 'react'
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native'
import { colors, radius, spacing } from '@/design'
import { AppText } from './AppText'

type Props = TextInputProps & {
  label?: string
  error?: string
  helper?: string
}

export function Input({ label, error, helper, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false)
  const hasError = Boolean(error)

  const borderColor = hasError ? colors.danger : focused ? colors.brand : colors.border

  return (
    <View style={styles.container}>
      {label ? (
        <AppText variant="label" color="textSecondary" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        style={[styles.input, { borderColor }, style]}
        placeholderTextColor={colors.textMuted}
        onFocus={(e) => {
          setFocused(true)
          rest.onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          rest.onBlur?.(e)
        }}
        accessibilityLabel={label}
        accessibilityHint={helper}
        {...rest}
      />
      {hasError ? (
        <AppText variant="caption" color="danger" style={styles.helper}>
          {error}
        </AppText>
      ) : helper ? (
        <AppText variant="caption" color="textMuted" style={styles.helper}>
          {helper}
        </AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { marginBottom: 2 },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceElevated,
  },
  helper: { marginTop: 2 },
})
