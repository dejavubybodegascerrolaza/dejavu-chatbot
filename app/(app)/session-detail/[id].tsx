import React, { useEffect } from 'react'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, Card } from '@/components/ui'
import { ErrorState, LoadingState } from '@/components/feedback'
import { SafetyNote } from '@/components/product'
import { colors, spacing } from '@/design'
import { useAuthStore } from '@/modules/auth/auth.store'
import { useSessionStore } from '@/modules/sessions/session.store'
import {
  CONTEXT_LABELS,
  PROTECTION_LABELS,
  SENSATION_LABELS,
} from '@/modules/sessions/session.labels'
import { formatDisplayDate } from '@/utils/date'

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="caption" color="textMuted" style={styles.rowLabel}>
        {label}
      </AppText>
      <AppText variant="body" color="textPrimary" style={styles.rowValue}>
        {value}
      </AppText>
    </View>
  )
}

export default function SessionDetailScreen() {
  const user = useAuthStore((s) => s.user)
  const userId = user?.id

  const rawId = useLocalSearchParams<{ id: string }>().id
  const sessionId = typeof rawId === 'string' ? rawId : ''

  const {
    selectedSession,
    selectedSessionStatus,
    selectedSessionError,
    loadSessionById,
    deleteSession,
    clearSelectedSession,
  } = useSessionStore()

  useEffect(() => {
    if (!userId || !sessionId) return
    void loadSessionById(userId, sessionId)
    return () => {
      clearSelectedSession()
    }
  }, [userId, sessionId, loadSessionById, clearSelectedSession])

  const handleDelete = () => {
    Alert.alert('¿Eliminar esta sesión?', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          if (!userId || !sessionId) return
          const success = await deleteSession(userId, sessionId)
          if (success) {
            router.replace('/(app)/history')
          }
        },
      },
    ])
  }

  const handleBack = () => {
    router.back()
  }

  if (selectedSessionStatus === 'loading' || selectedSessionStatus === 'idle') {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <LoadingState message="Cargando sesión…" />
      </SafeAreaView>
    )
  }

  if (selectedSessionStatus === 'missing') {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <View style={styles.centeredContent}>
          <AppText variant="body" color="textSecondary" style={styles.missingText}>
            Esta sesión ya no está disponible.
          </AppText>
          <Button
            label="Volver"
            variant="secondary"
            size="md"
            onPress={handleBack}
            accessibilityLabel="Volver a la pantalla anterior"
          />
        </View>
      </SafeAreaView>
    )
  }

  if (selectedSessionStatus === 'error') {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <ErrorState
          message={
            selectedSessionError ?? 'No se ha podido cargar esta sesión. Inténtalo de nuevo.'
          }
          onRetry={() => {
            if (userId && sessionId) void loadSessionById(userId, sessionId)
          }}
        />
      </SafeAreaView>
    )
  }

  if (!selectedSession) return null

  const session = selectedSession

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="outlined" style={styles.detailCard}>
          <DetailRow label="Fecha" value={formatDisplayDate(session.sessionDate)} />
          <DetailRow label="Duración" value={`${session.durationMinutes} min`} />
          <DetailRow label="Contexto" value={CONTEXT_LABELS[session.context]} />
          <DetailRow
            label="UV"
            value={session.uvIndexManual !== null ? String(session.uvIndexManual) : 'No indicado'}
          />
          <DetailRow label="Protección" value={PROTECTION_LABELS[session.protectionLevel]} />
          <DetailRow label="Sensación" value={SENSATION_LABELS[session.sensationAfter]} />
          <DetailRow label="Notas" value={session.notes ?? '—'} />
          <DetailRow
            label="Registrado el"
            value={formatDisplayDate(session.createdAt.slice(0, 10))}
          />
        </Card>

        <SafetyNote />

        <View style={styles.actions}>
          <Button
            label="Volver"
            variant="secondary"
            size="md"
            fullWidth
            onPress={handleBack}
            accessibilityLabel="Volver a la pantalla anterior"
          />
          <Button
            label="Eliminar sesión"
            variant="ghost"
            size="md"
            fullWidth
            onPress={handleDelete}
            accessibilityLabel="Eliminar esta sesión de exposición"
            style={styles.deleteButton}
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
  detailCard: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  rowLabel: {
    flex: 1,
  },
  rowValue: {
    flex: 2,
    textAlign: 'right',
  },
  actions: {
    gap: spacing.sm,
  },
  deleteButton: {
    borderColor: colors.danger,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.lg,
  },
  missingText: {
    textAlign: 'center',
  },
})
