import React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { colors, spacing } from '@/design'
import { AppText } from '@/components/ui/AppText'

type Props = {
  message?: string
}

export function LoadingState({ message }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.brand} />
      {message ? (
        <AppText variant="caption" color="textMuted" style={styles.message}>
          {message}
        </AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  message: { textAlign: 'center' },
})
