import React from 'react'
import { StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { Screen } from '@/components/ui'
import { AppText } from '@/components/ui'
import { Button } from '@/components/ui'
import { spacing } from '@/design'

export default function WelcomeScreen() {
  return (
    <Screen padded>
      <View style={styles.container}>
        <View style={styles.hero}>
          <AppText variant="display" align="center">
            Bronze IQ
          </AppText>
          <AppText variant="heading" color="textSecondary" align="center" style={styles.tagline}>
            Bronceado con cabeza.
          </AppText>
          <AppText variant="body" color="textSecondary" align="center" style={styles.description}>
            Una forma más consciente de registrar tu exposición solar, entender tu historial
            reciente y tomar decisiones prudentes.
          </AppText>
        </View>

        <View style={styles.actions}>
          <Button
            label="Crear cuenta"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => router.push('/(auth)/register')}
            accessibilityLabel="Crear cuenta nueva en Bronze IQ"
          />
          <Button
            label="Ya tengo cuenta"
            variant="secondary"
            size="lg"
            fullWidth
            onPress={() => router.push('/(auth)/login')}
            accessibilityLabel="Iniciar sesión con cuenta existente"
          />
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  tagline: {
    marginTop: spacing.sm,
  },
  description: {
    marginTop: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
  },
})
