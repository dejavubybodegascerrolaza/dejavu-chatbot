import React from 'react'
import { StyleSheet, View } from 'react-native'
import { spacing } from '@/design'
import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/Button'

type Props = {
  title?: string
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  title = 'Algo salió mal',
  message = 'Por favor, inténtalo de nuevo.',
  onRetry,
}: Props) {
  return (
    <View style={styles.container}>
      <AppText variant="heading" color="textPrimary" align="center">
        {title}
      </AppText>
      <AppText variant="body" color="textSecondary" align="center" style={styles.message}>
        {message}
      </AppText>
      {onRetry ? (
        <Button label="Reintentar" variant="secondary" onPress={onRetry} style={styles.button} />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  message: { maxWidth: 280 },
  button: { marginTop: spacing.sm },
})
