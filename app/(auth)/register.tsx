import React from 'react'
import { StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Screen, AppText, Button, Input } from '@/components/ui'
import { colors, spacing } from '@/design'
import { registerSchema } from '@/modules/auth/auth.schema'
import type { RegisterFormValues } from '@/modules/auth/auth.schema'
import { useAuthStore } from '@/modules/auth/auth.store'

export default function RegisterScreen() {
  const {
    register,
    isSubmitting,
    error,
    clearError,
    pendingEmailConfirmation,
    clearPendingEmailConfirmation,
  } = useAuthStore()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormValues) => {
    clearError()
    clearPendingEmailConfirmation()
    await register(data)
  }

  if (pendingEmailConfirmation) {
    return (
      <Screen padded>
        <View style={styles.confirmationContainer}>
          <AppText variant="title" align="center">
            Revisa tu email
          </AppText>
          <AppText
            variant="body"
            color="textSecondary"
            align="center"
            style={styles.confirmationText}
          >
            Hemos enviado un enlace de confirmación a tu email. Confirma tu cuenta antes de iniciar
            sesión.
          </AppText>
          <Button
            label="Ir a iniciar sesión"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => {
              clearPendingEmailConfirmation()
              router.replace('/(auth)/login')
            }}
            accessibilityLabel="Ir a la pantalla de inicio de sesión"
          />
        </View>
      </Screen>
    )
  }

  return (
    <Screen scroll padded>
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant="title">Crear cuenta</AppText>
          <AppText variant="body" color="textSecondary" style={styles.subtitle}>
            Comienza a registrar tu exposición solar de forma responsable.
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
                testID="register-email-input"
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
                testID="register-password-input"
              />
            )}
          />
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirmar contraseña"
                placeholder="Repite tu contraseña"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
                testID="register-confirm-password-input"
              />
            )}
          />
        </View>

        <View style={styles.actions}>
          <Button
            label="Crear cuenta"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            onPress={() => void handleSubmit(onSubmit)()}
            accessibilityLabel="Crear cuenta nueva"
            testID="register-submit"
          />
          <Button
            label="Ya tengo cuenta"
            variant="ghost"
            size="md"
            fullWidth
            disabled={isSubmitting}
            onPress={() => router.replace('/(auth)/login')}
            accessibilityLabel="Ir a iniciar sesión"
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
  confirmationContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xl,
  },
  confirmationText: {
    marginTop: spacing.sm,
  },
})
