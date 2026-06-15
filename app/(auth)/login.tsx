import React from 'react'
import { StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Screen, AppText, Button, Input } from '@/components/ui'
import { colors, spacing } from '@/design'
import { loginSchema } from '@/modules/auth/auth.schema'
import type { LoginFormValues } from '@/modules/auth/auth.schema'
import { useAuthStore } from '@/modules/auth/auth.store'

export default function LoginScreen() {
  const { login, isSubmitting, error, clearError } = useAuthStore()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    clearError()
    await login(data)
  }

  return (
    <Screen scroll padded>
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant="title">Iniciar sesión</AppText>
          <AppText variant="body" color="textSecondary" style={styles.subtitle}>
            Bienvenido de nuevo.
          </AppText>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <AppText variant="caption" color="danger">
              {error}
            </AppText>
          </View>
        ) : null}

        <View style={styles.form}>
          <Controller
            name="email"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
              />
            )}
          />
          <Controller
            name="password"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Contraseña"
                placeholder="Mínimo 8 caracteres"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
              />
            )}
          />
        </View>

        <View style={styles.actions}>
          <Button
            label="Entrar"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            onPress={() => void handleSubmit(onSubmit)()}
            accessibilityLabel="Iniciar sesión"
          />
          <Button
            label="Crear cuenta"
            variant="ghost"
            size="md"
            fullWidth
            disabled={isSubmitting}
            onPress={() => router.replace('/(auth)/register')}
            accessibilityLabel="Ir a crear cuenta nueva"
          />
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.xl,
    paddingVertical: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: 8,
    padding: spacing.md,
  },
  form: {
    gap: spacing.md,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
})
