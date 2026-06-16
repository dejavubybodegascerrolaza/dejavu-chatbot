import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button } from '@/components/ui'
import { colors, spacing } from '@/design'

export default function DisclaimerScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* What Bronze IQ does */}
        <View style={styles.block}>
          <AppText variant="bodyStrong" color="textPrimary" style={styles.blockTitle}>
            Qué hace Bronze IQ
          </AppText>
          <AppText variant="body" color="textSecondary" style={styles.paragraph}>
            Bronze IQ te ayuda a registrar y revisar tu exposición solar con estimaciones
            conservadoras orientadas al bienestar. Las recomendaciones se basan en tu perfil y las
            sesiones que registras. Son proyecciones orientativas, no garantías.
          </AppText>
        </View>

        {/* What it does not do */}
        <View style={styles.block}>
          <AppText variant="bodyStrong" color="textPrimary" style={styles.blockTitle}>
            Qué no hace Bronze IQ
          </AppText>
          <AppText variant="body" color="textSecondary" style={styles.paragraph}>
            Bronze IQ no es una herramienta médica. No diagnostica condiciones de la piel, no
            analiza lesiones y no sustituye el consejo de un profesional sanitario. Las estimaciones
            de tiempo solar no son dosis clínicas ni garantizan ausencia de daño.
          </AppText>
        </View>

        {/* When to consult a professional */}
        <View style={styles.block}>
          <AppText variant="bodyStrong" color="textPrimary" style={styles.blockTitle}>
            Cuándo consultar a un profesional
          </AppText>
          <AppText variant="body" color="textSecondary" style={styles.paragraph}>
            Consulta con un dermatólogo o médico si tienes antecedentes de cáncer de piel,
            quemaduras frecuentes, lesiones o manchas, sensibilidad elevada, o si tomas medicación
            fotosensibilizante. Bronze IQ no sustituye esa evaluación.
          </AppText>
        </View>

        <Button
          label="Entendido"
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => router.back()}
          accessibilityLabel="Cerrar el disclaimer y volver a ajustes"
          style={styles.cta}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  block: {
    gap: spacing.xs,
  },
  blockTitle: {
    marginBottom: 2,
  },
  paragraph: {
    lineHeight: 26,
  },
  cta: {
    marginTop: spacing.md,
  },
})
