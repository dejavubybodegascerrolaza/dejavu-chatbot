import { Stack } from 'expo-router'
import { colors } from '@/design'

const headerStyle = { backgroundColor: colors.background }
const headerTintColor = colors.brand

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="session-log" options={{ headerShown: false }} />
      <Stack.Screen
        name="history"
        options={{ headerShown: true, title: 'Historial', headerStyle, headerTintColor }}
      />
      <Stack.Screen
        name="plan"
        options={{ headerShown: true, title: 'Mi plan', headerStyle, headerTintColor }}
      />
      <Stack.Screen
        name="achievements"
        options={{ headerShown: true, title: 'Logros', headerStyle, headerTintColor }}
      />
      <Stack.Screen
        name="settings"
        options={{ headerShown: true, title: 'Ajustes', headerStyle, headerTintColor }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{ headerShown: true, title: 'Editar perfil', headerStyle, headerTintColor }}
      />
      <Stack.Screen
        name="disclaimer"
        options={{
          headerShown: true,
          title: 'Límites de Bronze IQ',
          headerStyle,
          headerTintColor,
        }}
      />
      <Stack.Screen
        name="deletion-request"
        options={{ headerShown: true, title: 'Eliminar mis datos', headerStyle, headerTintColor }}
      />
      <Stack.Screen
        name="session-detail/[id]"
        options={{ headerShown: true, title: 'Detalle', headerStyle, headerTintColor }}
      />
    </Stack>
  )
}
