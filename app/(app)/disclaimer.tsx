import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button } from '@/components/ui'
import { colors, spacing } from '@/design'

export default function DisclaimerScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <AppText variant="title">Límites de Bronze IQ</AppText>
        </View>

        <AppText variant="body" color="textSecondary" style={styles.paragraph}>
          Bronze IQ ofrece orientación general para ayudarte a registrar y revisar tu exposición
          solar. No es una herramienta médica, no diagnostica condiciones de la piel y no sustituye
          el consejo de un profesional sanitario.
        </AppText>

        <AppText variant="body" color="textSecondary" style={styles.paragraph}>
          La exposición solar puede implicar riesgos, incluso con protección. Evita excesos, usa
          protección adecuada y consulta con un profesional si tienes antecedentes, lesiones,
          quemaduras frecuentes, sensibilidad elevada, medicación fotosensibilizante o dudas sobre
          tu piel.
        </AppText>

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
  header: {
    paddingTop: spacing.lg,
  },
  paragraph: {
    lineHeight: 26,
  },
  cta: {
    marginTop: spacing.md,
  },
})
