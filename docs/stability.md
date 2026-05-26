# Bronze IQ — Fase 10: Estabilización MVP

## Objetivo

Convertir el MVP funcionalmente completo (Fases 0–9) en una app robusta y lista para distribución interna. No se añadieron features nuevas. No se modificó el schema, el motor de recomendaciones, ni la lógica de negocio central.

---

## Qué se estabilizó

### 1. Error Boundary global

**Patrón:** Exportación de `ErrorBoundary` desde `app/_layout.tsx`.

Expo Router v56 soporta exportar un componente `ErrorBoundary` directamente desde cualquier archivo de ruta o layout. Al exportarlo desde el root layout, cubre todos los errores no capturados en cualquier pantalla.

```tsx
// app/_layout.tsx
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.errorContainer}>
      <ErrorState
        title="Algo salió mal"
        message="La app ha encontrado un problema inesperado."
        onRetry={() => {
          void retry()
          expoRouter.replace('/')
        }}
      />
    </View>
  )
}
```

- Usa `ErrorState` del design system existente.
- Sin dependencias externas (no Sentry, no analytics).
- El botón "Reintentar" llama a `retry()` (limpia el error state del boundary) y navega a `/` para reiniciar el flujo.

**Compatibilidad:** Confirmado con `expo-router@56.2.6`. El tipo `ErrorBoundaryProps` se importa desde `expo-router`.

---

### 2. Headers nativos en pantallas secundarias

Configurados en `app/(app)/_layout.tsx` mediante `Stack.Screen` con `headerShown: true`.

| Ruta                  | Título en header     |
| --------------------- | -------------------- |
| `history`             | Historial            |
| `settings`            | Ajustes              |
| `edit-profile`        | Editar perfil        |
| `disclaimer`          | Límites de Bronze IQ |
| `deletion-request`    | Eliminar mis datos   |
| `session-detail/[id]` | Detalle              |

**Pantallas sin header (sin cambios):**

- `index` (Home) — pantalla principal sin necesidad de back.
- `session-log` — formulario con CTA de cancelar propio.

**Estilo aplicado:**

```ts
const headerStyle = { backgroundColor: colors.background }
const headerTintColor = colors.brand
```

Todos los colores provienen de tokens del design system. No hay valores hardcodeados.

**Consecuencia:** Los títulos manuales (`<AppText variant="title">`) y los `paddingTop` compensatorios se eliminaron de las 6 pantallas afectadas. `SafeAreaView` actualizado con `edges={['left', 'right', 'bottom']}` para evitar doble inset en la parte superior.

---

### 3. Pull-to-refresh en Home

Archivo: `app/(app)/index.tsx`

- `RefreshControl` añadido al `ScrollView` existente.
- Estado local `isRefreshing: boolean` (independiente de los estados del store).
- `handleRefresh` recarga `loadTodaySessions` + `loadRecentSessions` en paralelo con `Promise.all`.
- El spinner de pull-to-refresh se controla exclusivamente por el gesto manual del usuario, sin interferir con el estado de carga inicial.

---

### 4. Pull-to-refresh en History

Archivo: `app/(app)/history.tsx`

- `RefreshControl` añadido al `ScrollView` existente.
- Estado local `isRefreshing: boolean`.
- `handleRefresh` recarga `loadHistorySessions`.
- Mismo patrón que Home para consistencia.

---

### 5. Warning RHF corregido

Archivo: `src/components/product/SessionForm.tsx`

**Antes:**

```ts
const { watch, ... } = useForm<SessionFormValues>(...)
const durationText = watch('durationText')
```

**Después:**

```ts
import { useForm, Controller, useWatch } from 'react-hook-form'
// watch eliminado de useForm destructuring
const durationText = useWatch({ control, name: 'durationText' })
```

`useWatch` es el hook dedicado de RHF para suscripciones a valores individuales, compatible con React Compiler. El comportamiento funcional es idéntico.

**Resultado:** `npm run lint` termina con exit 0 y **cero warnings**.

---

### 6. Stubs vacíos eliminados

Los siguientes 14 archivos contenían únicamente comentarios sin código y no estaban importados desde ningún lugar:

```
src/repositories/interfaces/index.ts
src/repositories/mock/index.ts
src/services/index.ts
src/modules/auth/hooks/index.ts
src/modules/history/hooks/index.ts
src/modules/privacy/hooks/index.ts
src/modules/profile/hooks/index.ts
src/modules/sessions/hooks/index.ts
src/modules/settings/hooks/index.ts
src/modules/profile/store/index.ts
src/modules/auth/store/index.ts
src/modules/sessions/store/index.ts
src/types/domain/index.ts
src/types/schemas/index.ts
```

Verificado con `grep` antes de eliminar: ninguno tenía imports en el codebase.

---

## Resultados de calidad

| Check                  | Resultado                               |
| ---------------------- | --------------------------------------- |
| `npm run typecheck`    | ✅ exit 0, sin errores                  |
| `npm run lint`         | ✅ exit 0, **cero warnings**            |
| `npm test`             | ✅ 288 tests, 35 suites, todos en verde |
| `npm run format:check` | ✅ exit 0                               |

---

## Prueba manual recomendada

1. Abrir app → sin sesión → va a `/(auth)/welcome`. ✓
2. Autenticarse y completar onboarding → va a Home. ✓
3. Home carga recomendación y sesiones de hoy. ✓
4. Pull-to-refresh en Home → recarga sin romper estado. ✓
5. Navegar a Historial → header "Historial" visible con back button nativo. ✓
6. Pull-to-refresh en Historial → recarga la lista. ✓
7. Pulsar una sesión → pantalla de Detalle con header "Detalle". ✓
8. Swipe back (iOS) o hardware back (Android) → vuelve sin problemas. ✓
9. Abrir Ajustes → header "Ajustes" visible. ✓
10. Abrir Editar perfil → header "Editar perfil" visible. ✓
11. Abrir Disclaimer → header "Límites de Bronze IQ" visible. ✓
12. Abrir Eliminar mis datos → header "Eliminar mis datos" visible. ✓
13. `npm run lint` → exit 0, zero warnings. ✓
14. Confirmar que no hay features nuevas. ✓

---

## Qué NO se implementó en esta fase

- Tabs navigator
- Paginación en historial
- Filtros o calendario
- Reset de contraseña
- Magic link
- Skeleton screens
- Edge Functions / eliminación real de datos
- Notificaciones push
- EAS Build
- Splash screen personalizada
- Tests de integración RLS
- E2E tests

---

## Riesgos pendientes para próximas fases

| Riesgo                            | Detalle                                                                                                   |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **RLS sin test automatizado**     | Las políticas SQL existen pero no hay test que verifique JWT de usuario B vs usuario A                    |
| **EAS Build**                     | Sin `eas.json`, sin build de distribución configurado                                                     |
| **Eliminación real de datos**     | `deletion_requests` registra la intención; no hay Edge Function con `service_role` que ejecute el borrado |
| **Pruebas en dispositivo físico** | Solo simulador/emulador hasta ahora                                                                       |
| **App Store / Google Play**       | Sin Privacy Nutrition Label, sin iconos definitivos, sin splash screen                                    |
| **Historial sin paginación**      | `getSessionsByUserId` carga todas las sesiones sin límite                                                 |
| **`consent_log` no implementado** | El consentimiento se guarda en `profiles.disclaimer_accepted_at` pero no en tabla append-only separada    |
