import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { spacing } from '@/design'
import { AppText } from './AppText'
import { Button } from './Button'
import { Input } from './Input'
import { Card } from './Card'
import { Badge } from './Badge'
import { Divider } from './Divider'
import { Screen } from './Screen'
import { DisclaimerBox } from '@/components/feedback/DisclaimerBox'
import { LoadingState } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'

type PreviewPage = 'tokens' | 'buttons' | 'inputs' | 'cards' | 'feedback'

export function DesignSystemPreview() {
  const [page, setPage] = useState<PreviewPage>('tokens')
  const [inputValue, setInputValue] = useState('')

  return (
    <Screen scroll padded>
      <AppText variant="title" style={styles.title}>
        Bronze IQ — Design System
      </AppText>

      <View style={styles.nav}>
        {(['tokens', 'buttons', 'inputs', 'cards', 'feedback'] as PreviewPage[]).map((p) => (
          <Button
            key={p}
            label={p}
            variant={page === p ? 'primary' : 'ghost'}
            size="md"
            onPress={() => setPage(p)}
          />
        ))}
      </View>

      <Divider />

      {page === 'tokens' && <TokensPage />}
      {page === 'buttons' && <ButtonsPage />}
      {page === 'inputs' && <InputsPage value={inputValue} onChange={setInputValue} />}
      {page === 'cards' && <CardsPage />}
      {page === 'feedback' && <FeedbackPage />}
    </Screen>
  )
}

function TokensPage() {
  return (
    <View style={styles.section}>
      <AppText variant="heading">Typography</AppText>
      <AppText variant="display">Display 36</AppText>
      <AppText variant="title">Title 28</AppText>
      <AppText variant="heading">Heading 22</AppText>
      <AppText variant="body">Body 16 — texto normal de la interfaz</AppText>
      <AppText variant="bodyStrong">Body Strong 16</AppText>
      <AppText variant="label">Label 14</AppText>
      <AppText variant="caption" color="textMuted">
        Caption 13 — texto secundario
      </AppText>
    </View>
  )
}

function ButtonsPage() {
  return (
    <View style={styles.section}>
      <AppText variant="heading">Buttons</AppText>
      <Button label="Primary" variant="primary" fullWidth />
      <Button label="Secondary" variant="secondary" fullWidth />
      <Button label="Ghost" variant="ghost" fullWidth />
      <Button label="Danger" variant="danger" fullWidth />
      <Button label="Loading..." variant="primary" loading fullWidth />
      <Button label="Disabled" variant="primary" disabled fullWidth />
      <View style={styles.row}>
        <Badge level="low" />
        <Badge level="moderate" />
        <Badge level="high" />
        <Badge level="avoid" />
      </View>
    </View>
  )
}

function InputsPage({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.section}>
      <AppText variant="heading">Inputs</AppText>
      <Input label="Alias" placeholder="Tu nombre o apodo" value={value} onChangeText={onChange} />
      <Input label="Con error" placeholder="Campo con error" error="Este campo es obligatorio" />
      <Input
        label="Con helper"
        placeholder="Escribe aquí"
        helper="El alias es solo para tu uso personal"
      />
    </View>
  )
}

function CardsPage() {
  return (
    <View style={styles.section}>
      <AppText variant="heading">Cards</AppText>
      <Card variant="default">
        <AppText variant="label">Card default</AppText>
        <AppText variant="caption" color="textMuted">
          Fondo surface
        </AppText>
      </Card>
      <Card variant="elevated">
        <AppText variant="label">Card elevated</AppText>
        <AppText variant="caption" color="textMuted">
          Con sombra suave
        </AppText>
      </Card>
      <Card variant="outlined">
        <AppText variant="label">Card outlined</AppText>
        <AppText variant="caption" color="textMuted">
          Con borde
        </AppText>
      </Card>
    </View>
  )
}

function FeedbackPage() {
  const [showLoading, setShowLoading] = useState(false)

  if (showLoading) {
    return (
      <View style={{ flex: 1, minHeight: 200 }}>
        <LoadingState message="Cargando datos..." />
        <Button label="Volver" variant="ghost" onPress={() => setShowLoading(false)} />
      </View>
    )
  }

  return (
    <View style={styles.section}>
      <AppText variant="heading">Feedback</AppText>
      <DisclaimerBox compact />
      <Divider />
      <DisclaimerBox />
      <Divider />
      <Button label="Ver Loading State" variant="secondary" onPress={() => setShowLoading(true)} />
      <Divider />
      <View style={{ minHeight: 200 }}>
        <EmptyState
          title="Sin sesiones"
          description="Registra tu primera sesión de exposición solar."
          ctaLabel="Registrar sesión"
          onCta={() => undefined}
        />
      </View>
      <Divider />
      <View style={{ minHeight: 200 }}>
        <ErrorState message="No se pudo cargar el historial." onRetry={() => undefined} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.md },
  nav: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  section: { gap: spacing.md, paddingVertical: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
})
