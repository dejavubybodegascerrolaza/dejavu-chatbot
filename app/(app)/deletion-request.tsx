import React from 'react'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button } from '@/components/ui'
import { colors, spacing } from '@/design'
import { useAuthStore } from '@/modules/auth/auth.store'
import { usePrivacyStore } from '@/modules/privacy/privacy.store'

export default function DeletionRequestScreen() {
  const user = useAuthStore((s) => s.user)
  const { logout } = useAuthStore()
  const { status, requestDeletion } = usePrivacyStore()

  const isSubmitting = status === 'submitting'

  const handleRequest = () => {
    Alert.alert(
      '¿Solicitar eliminación?',
      'Registraremos una solicitud de eliminación de tus datos. Durante el MVP, el procesamiento puede requerir revisión manual.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Solicitar',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return
            await requestDeletion(user.id)
          },
        },
      ]
    )
  }

  if (status === 'success') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.centeredContent}>
          <AppText variant="title" style={styles.centeredTitle}>
            Solicitud registrada
          </AppText>
          <AppText variant="body" color="textSecondary" style={styles.centeredText}>
            Hemos guardado tu solicitud de eliminación. El procesamiento puede requerir revisión
            manual durante el MVP.
          </AppText>
          <View style={styles.successActions}>
            <Button
              label="Cerrar sesión"
              variant="ghost"
              size="md"
              fullWidth
              onPress={() => void logout()}
              accessibilityLabel="Cerrar sesión"
            />
            <Button
              label="Volver a ajustes"
              variant="secondary"
              size="md"
              fullWidth
              onPress={() => router.replace('/(app)/settings')}
              accessibilityLabel="Volver a ajustes"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <AppText variant="title">Eliminar mis datos</AppText>
        </View>

        <AppText variant="body" color="textSecondary">
          Puedes solicitar la eliminación de tus datos asociados a Bronze IQ. Durante el MVP, esta
          solicitud quedará registrada y podrá requerir revisión manual.
        </AppText>

        <AppText variant="body" color="textMuted" style={styles.notice}>
          Esta acción no elimina automáticamente tu cuenta en este momento. Registra una solicitud
          de eliminación para que pueda ser procesada conforme a la política de privacidad del
          producto.
        </AppText>

        {status === 'error' ? (
          <AppText variant="caption" color="danger" style={styles.errorText}>
            No se ha podido registrar la solicitud. Inténtalo de nuevo.
          </AppText>
        ) : null}

        <View style={styles.actions}>
          <Button
            label="Solicitar eliminación"
            variant="danger"
            size="lg"
            fullWidth
            loading={isSubmitting}
            onPress={handleRequest}
            accessibilityLabel="Solicitar eliminación de mis datos"
          />
          <Button
            label="Volver"
            variant="secondary"
            size="md"
            fullWidth
            onPress={() => router.back()}
            accessibilityLabel="Volver a ajustes"
          />
        </View>
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
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingTop: spacing.lg,
  },
  notice: {
    fontStyle: 'italic',
  },
  errorText: {
    marginTop: -spacing.sm,
  },
  actions: {
    gap: spacing.sm,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  centeredTitle: {
    textAlign: 'center',
  },
  centeredText: {
    textAlign: 'center',
    maxWidth: 280,
  },
  successActions: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
})
