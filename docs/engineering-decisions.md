# Bronze IQ — Engineering Decisions

> Decisiones técnicas cerradas del MVP. Cambiar cualquier decisión marcada como CERRADA requiere justificación explícita.

---

## Stack

### Expo Managed Workflow — CERRADO

**Decisión:** Mantener.

**Razón:** El MVP no requiere módulos nativos fuera del SDK de Expo. No hay cámara obligatoria, no hay SDK de pagos nativos, no hay sensores UV. El workflow managed da OTA updates (EAS Update), build simplificado (EAS Build) y cero configuración nativa que mantener.

**Trigger de salida:** Si aparece un módulo nativo sin wrapper Expo-compatible.

---

### React Native — CERRADO

**Decisión:** Mantener.

**Razón:** Cross-platform iOS + Android desde un único codebase. Flutter es alternativa válida pero requiere Dart y tiene ecosistema BaaS menos maduro. El equipo trabaja con TypeScript.

---

### TypeScript strict — CERRADO Y OBLIGATORIO

**Decisión:** Activado desde el primer commit.

**Config adicional:** `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noFallthroughCasesInSwitch`.

**Razón:** Retroajustar strict mode es costoso. En una app health-adjacent, los errores de tipos en datos de perfil o recomendaciones pueden producir comportamiento incorrecto. Cero tolerancia desde el día 1.

---

### Supabase — CERRADO

**Decisión:** Mantener.

**Razón:** PostgreSQL real (no document store) + RLS a nivel de base de datos (no solo aplicación) + Auth con JWT + Storage para futuras fotos. Firebase es inferior para datos relacionales. PocketBase es más ligero pero sin soporte enterprise. Supabase Free Tier cubre el MVP.

**Limitación conocida:** Supabase no es HIPAA-compliant por defecto. Bronze IQ no es producto médico, pero hay que evitar almacenar cualquier dato que pueda interpretarse como Protected Health Information. Los datos de perfil (sensibilidad, fototipo) no son PHI.

---

### Expo Router v4 — CERRADO

**Decisión:** Usar Expo Router (ya instalado como v56.x que es el naming de Expo SDK 56).

**Razón:** File-based routing integrado con Expo managed workflow, deep links automáticos, layouts anidados con `_layout.tsx`, soporte de grupos de rutas `(group)/`.

**Alternativa descartada:** React Navigation standalone. Más verbose, menos integración con Expo.

---

### Zustand — CERRADO

**Decisión:** Un store por dominio.

```
useAuthStore       → sesión, usuario
useProfileStore    → perfil
useSessionStore    → sesiones del día, historial
useUIStore         → loading states, toasts
```

**Razón:** Context API tiene re-renders en cascada en React 19 con datos que se actualizan frecuentemente. Redux es sobreingeniería para este scope. Jotai es válido pero el modelo de slices de Zustand es más legible para equipos que crecen.

**Regla:** Stores solo en `src/modules/<feature>/store/`. Nunca importar un store directamente desde una pantalla — usar hooks como intermediario.

---

### Zod — CERRADO

**Decisión:** Schema-first. Zod es la única fuente de verdad para shapes de datos.

**Usos:**

1. Validación de formularios en runtime
2. Inferencia de tipos TypeScript (`z.infer<typeof Schema>`)
3. Validación de variables de entorno al startup
4. Parseo de respuestas de Supabase antes de confiar en ellas

**Regla:** Nunca escribir un tipo TypeScript a mano si hay un schema Zod equivalente. Siempre `z.infer<typeof Schema>`.

---

### React Hook Form — CERRADO

**Decisión:** Obligatorio para todos los formularios.

**Integración:** `@hookform/resolvers/zod` para validación.

**Razón:** Mínimos re-renders, manejo nativo de estado de formularios, integración directa con Zod.

---

### expo-secure-store — OBLIGATORIO

**Decisión:** Tokens y credenciales persistidas ÚNICAMENTE en `expo-secure-store`.

**Prohibido:** AsyncStorage para cualquier dato sensible.

**Razón:** AsyncStorage no está cifrado. Los tokens de Supabase deben estar en almacenamiento seguro del dispositivo.

---

## Arquitectura de capas

### Flujo unidireccional — CERRADO

```
Screen (app/)
  ↓  compone y muestra
Component (src/components/)
  ↓  recibe props
Hook (src/modules/<feature>/hooks/)
  ↓  coordina
Service (src/modules/<feature>/service.ts)
  ↓  lógica de negocio
Repository (src/modules/<feature>/repository.ts)
  ↓  acceso a datos
Supabase client (src/lib/supabase.ts)
  ↓
PostgreSQL + RLS
```

**Regla crítica:** Las pantallas nunca llaman a Supabase directamente. Los servicios contienen la lógica de negocio. Los repositorios contienen solo acceso a datos.

---

### Motor de recomendaciones — AISLADO

**Ubicación:** `src/modules/recommendations/`

**Restricciones:**

- Sin IA, sin LLM, sin ML
- Lógica determinista y auditable
- 100% testeable sin red
- Nunca presentar resultados como diagnóstico médico
- Disclaimer obligatorio en cada output

**Archivos:**

```
src/modules/recommendations/
  recommendation.types.ts
  recommendation.rules.ts      ← factores y umbrales
  recommendation.service.ts    ← lógica principal
  recommendation.service.test.ts
```

---

## Estructura de directorios — CERRADA

```
app/                           Expo Router routes (solo routing, sin lógica)
src/
  components/
    ui/                        Atoms reutilizables (Text, Button, Input, Card, Badge)
    product/                   Componentes de producto (RecommendationCard, SessionCard...)
    feedback/                  Estados (LoadingState, EmptyState, ErrorState)
  design/
    tokens.ts                  Colores, spacing, radii, shadows
    typography.ts
    theme.ts
  hooks/                       Hooks cross-feature (useAppState, useToast)
  lib/
    supabase.ts                 Cliente singleton
    env.ts                     Zod-validated env vars
  modules/
    auth/
      hooks/
      store/
    profile/
      hooks/
      store/
    sessions/
      hooks/
      store/
    recommendations/
      recommendation.types.ts
      recommendation.rules.ts
      recommendation.service.ts
      recommendation.service.test.ts
    history/
      hooks/
    settings/
      hooks/
    privacy/
      hooks/
  types/
    database.types.ts          Auto-generado por Supabase CLI
    schemas/                   Zod schemas (fuente de verdad)
    domain/                    Tipos inferidos de schemas
  utils/
    date.utils.ts
    format.utils.ts
supabase/
  migrations/                  SQL numerados, versionados en git
  functions/
    delete-user-data/
__tests__/
  unit/
  integration/
docs/
  product-brief.md
  mvp-spec.md
  engineering-decisions.md     ← este archivo
```

**Nota:** La Fase 0 (bootstrap) creó `src/features/` (plural) y `src/design-system/`. El directorio correcto según especificación es `src/modules/` y `src/design/`. Esta corrección se aplica antes de escribir código real.

---

## Seguridad

### Variables de entorno

- `EXPO_PUBLIC_*` — incluidas en el bundle del cliente (no son secretas)
- Solo la anon key de Supabase va en el cliente
- La service_role key NUNCA va en el cliente — solo en Edge Functions
- `src/lib/env.ts` valida todas las variables con Zod al startup

### Logs

- Prohibido `console.log` con datos de usuario en builds de producción
- Usar `if (__DEV__) console.log(...)` si es necesario depurar
- Los error boundaries loguean tipo de error, nunca datos del usuario

### RLS

- RLS activado en todas las tablas antes del primer INSERT
- Test obligatorio en Fase 2: JWT del usuario B no puede leer datos del usuario A

---

## Testing

### Prioridades

1. `recommendation.service.ts` — 100% cobertura de ramas (lógica más crítica)
2. Schemas Zod — validar accept/reject de inputs válidos e inválidos
3. `date.utils.ts` — operaciones de fecha/timezone
4. RLS policies — test de aislamiento de usuarios (contra Supabase local)

### Herramientas

- Jest + jest-expo
- React Native Testing Library
- @testing-library/jest-native
- ts-node (para jest.config.ts)
- Supabase CLI local para tests de integración

### Fuera del MVP

- E2E (Detox/Maestro)
- Snapshots
- Visual regression
- Cobertura 100% obligatoria en todo el código

---

## DevOps

### EAS Build

- Tres perfiles: `development`, `preview`, `production`
- Distribución interna vía TestFlight y Play Console interno
- No configurar App Store Connect / Play Console hasta Fase 11

### Migraciones Supabase

- Cada cambio de schema = nuevo archivo SQL numerado: `YYYYMMDDHHMMSS_description.sql`
- Nunca modificar una migración ya commiteada
- Siempre crear una nueva migración para correcciones
- `supabase db reset` debe producir un estado limpio y reproducible

### Convención de commits

Conventional Commits obligatorios:

```
feat:     nueva funcionalidad
fix:      corrección de bug
chore:    mantenimiento, deps, config
docs:     documentación
test:     tests
refactor: refactorización sin cambio de comportamiento
style:    formato, sin cambio de lógica
```

---

## Fase 2 — Domain Types + Zod Schemas + Recommendation Engine

### Zod como contrato de dominio — CERRADO

**Decisión:** Los schemas Zod se definen antes de las migraciones SQL. Las migraciones se derivan de los schemas, no al revés.

**Razón:** Garantiza que los tipos TypeScript, la validación runtime y el schema de BD son consistentes. Errores de forma se detectan en tiempo de compilación, no en producción.

### Tipos en camelCase, snake_case en BD — CERRADO

**Decisión:** Los tipos de dominio TypeScript usan camelCase. Las columnas de Supabase usan snake_case. La transformación ocurre en los repositorios (capa de datos).

**Razón:** Los repositorios son el único punto de contacto con Supabase. Las pantallas y servicios no deben conocer el naming de la BD.

### Motor de recomendación antes de UI — CERRADO

**Decisión:** El motor determinista se implementa y se testea al 100% de ramas antes de construir cualquier pantalla que lo consuma.

**Razón:** La lógica de recomendación es el componente de mayor riesgo semántico del MVP. Testearla en aislamiento, sin UI, es más seguro y reproducible.

### ConsentLog fuera del MVP — CERRADO

**Decisión:** No existe tabla `consent_log` en el MVP. El consentimiento del disclaimer se registra en `profiles.disclaimer_accepted_at`.

**Razón:** `ConsentLog` no estaba en el modelo de datos aprobado. Añadir una tabla nueva sin justificación introduce complejidad y posibles implicaciones legales no evaluadas. Para el MVP, `disclaimer_accepted_at` es suficiente.

**Trigger de salida:** Si se añade soporte para múltiples versiones de disclaimer (e.g., se actualiza el texto y se necesita auditoría), crear una tabla `consent_log` append-only con `user_id`, `version`, `accepted_at`.

### `now` inyectado en el motor — CERRADO

**Decisión:** `generateRecommendation` acepta `now?: Date` (default: `new Date()`).

**Razón:** Permite tests deterministas sin mocks de `Date`. Patrón estándar para funciones que dependen del tiempo.

### Sin red en la capa de dominio — CERRADO

**Decisión:** `src/modules/recommendations/`, `src/modules/profile/`, `src/modules/sessions/`, `src/modules/privacy/` y `src/modules/shared/` no contienen llamadas de red ni efectos secundarios. Son lógica pura.

---

## Fase 3 — Supabase + Migraciones SQL + RLS + Tipos DB

### Esquema SQL derivado de los schemas Zod — CERRADO

**Decisión:** Las migraciones SQL se escriben una vez confirmados los schemas Zod de dominio.

**Razón:** Los schemas Zod son la fuente de verdad. El SQL los materializa. Evita divergencias entre lo que TypeScript valida y lo que PostgreSQL almacena.

### Nombre de tabla `deletion_requests` — CERRADO

**Decisión:** La tabla se llama `deletion_requests`, no `data_deletion_requests`.

**Razón:** Consistencia con la especificación MVP. El tipo de dominio es `DataDeletionRequest` (camelCase TypeScript), pero la tabla SQL usa el nombre corto. La tabla `data_deletion_requests` estaba en borradores previos; `deletion_requests` es el nombre definitivo.

### Tipos DB manuales en Fase 3 — CERRADO (temporal)

**Decisión:** `src/types/database.types.ts` se mantiene como tipos manuales en el MVP hasta configurar Supabase CLI.

**Razón:** Supabase CLI requiere un proyecto conectado o Docker local. Para MVP sin infraestructura configurada, los tipos manuales siguiendo el formato de la CLI permiten avanzar. Cuando se configure la CLI, sustituir con:

```bash
npx supabase gen types typescript --local > src/types/database.types.ts
```

**Regla:** Los tipos manuales deben ser idénticos a lo que generaría la CLI. Cualquier discrepancia es un bug.

### `react-native-url-polyfill` no necesario — CERRADO

**Decisión:** No instalar `react-native-url-polyfill`.

**Razón:** React Native 0.73+ incluye implementación nativa de `URL`. Este proyecto usa RN 0.85.3. El polyfill solo era necesario en versiones anteriores. Instalarlo introduciría código muerto.

### `detectSessionInUrl: false` en React Native — CERRADO

**Decisión:** El cliente Supabase se inicializa con `detectSessionInUrl: false`.

**Razón:** En React Native no hay URL del navegador para detectar sesiones OAuth. Activarlo (valor por defecto `true` en entornos web) genera errores silenciosos. OAuth redirects en mobile se manejan via deep links, no URL parsing.

### `expo-secure-store` como storage de Auth — OBLIGATORIO

**Decisión:** El cliente Supabase usa un adaptador `SecureStoreAdapter` (get/set/remove via `expo-secure-store`).

**Razón:** Supabase Auth persiste el JWT en el storage configurado. AsyncStorage no está cifrado en iOS/Android. `expo-secure-store` usa el Keychain (iOS) y EncryptedSharedPreferences (Android). El adaptador ya está en `src/lib/supabase.ts`.

**Implementación:** El adaptador está listo en Phase 3. La UI de auth (sign-up, sign-in) no existe aún — se construye en Phase 4.

### RLS — validación manual en Phase 3 — CERRADO

**Decisión:** La validación de aislamiento entre usuarios (JWT de usuario B no puede leer datos de A) se documenta como checklist manual en `docs/database.md`. No se automatiza en Phase 3.

**Razón:** Los tests de integración contra Supabase local requieren Docker y Supabase CLI. Para MVP en CI, el checklist manual es suficiente. Se automatizará cuando se configure Supabase CLI.

**Checklist:** Ver `docs/database.md` sección "Testing RLS isolation — Option B".

### `set_updated_at()` trigger — CERRADO

**Decisión:** La función `set_updated_at()` se aplica vía trigger a `profiles` y `exposure_sessions`. No se aplica a `deletion_requests`.

**Razón:** `deletion_requests` es append-only desde el cliente: solo INSERT y SELECT. No hay UPDATE de cliente. No tiene columna `updated_at`. Aplicar el trigger sería dead code.

---

## Fase 5 — Onboarding + Disclaimer + Profile Setup

### Profile se crea solo al completar onboarding — CERRADO

**Decisión:** La tabla `profiles` recibe su primer INSERT solo cuando el usuario completa el wizard de onboarding (`onboarding_completed = true`). No se crea una fila vacía al hacer sign-up.

**Razón:** Evita perfiles parciales sin consentimiento registrado. El disclaimer se acepta en el paso 3 del wizard; su timestamp (`disclaimer_accepted_at`) forma parte del INSERT. Sin disclaimer aceptado, no hay perfil.

### Onboarding después de Auth — CERRADO

**Decisión:** El flujo es: auth → detectar perfil → onboarding (si ausente/incompleto) → app.

**Guard en root layout con tres estados:**

- `unauthenticated` → `/(auth)/welcome`
- `authenticated` + `profileStatus = missing | error` → `/(onboarding)`
- `authenticated` + `profileStatus = ready` → `/(app)`

**Anti-loop:** El guard verifica el segmento actual antes de redirigir (`replace`, no `push`). El store usa `status === 'idle'` como mutex para evitar cargas duplicadas (incluye StrictMode).

### Disclaimer guardado en `profiles.disclaimer_accepted_at` — CERRADO

**Decisión:** No existe tabla `consent_log`. El timestamp de aceptación del disclaimer se guarda como columna `disclaimer_accepted_at` en `profiles`.

**Razón:** Decisión de Fase 2 confirmada. Para el MVP, una sola versión de disclaimer y su timestamp en el perfil es suficiente. Ver "ConsentLog fuera del MVP — CERRADO".

### `completeOnboarding` usa create-or-update — CERRADO

**Decisión:** `profile.service.ts::completeOnboarding` llama primero a `getProfileByUserId`. Si existe (onboarding incompleto previo), hace `updateProfile`. Si no existe, hace `createProfile`.

**Razón:** Permite re-entrada al onboarding sin crear perfiles duplicados. El RLS de Supabase bloquea cualquier INSERT con `id != auth.uid()`, pero la lógica en servicio es la primera barrera.

### `Database['public']['Views']` requerido por Supabase v2.106 — CERRADO

**Decisión:** `src/types/database.types.ts` incluye `Views: Record<string, never>` en el schema `public`.

**Razón:** `GenericSchema` en Supabase JS v2.106 requiere el campo `Views` para que `Database['public']` extienda la interfaz. Sin él, los tipos de `.insert()` y `.update()` se infieren como `never`, bloqueando TypeScript. Cada tabla incluye también `Relationships: []` por el mismo motivo (`GenericTable` requiere `Relationships: GenericRelationship[]`).

### Wizard de onboarding en ruta única — CERRADO

**Decisión:** `app/(onboarding)/index.tsx` contiene el wizard completo con estado local (`useState`). No hay una ruta por paso.

**Razón:** Con una ruta única no hay gestión de navegación entre pasos (sin back-button issues, sin stack de 8 pantallas). El estado del wizard se mantiene en memoria local. La pérdida al rotar pantalla o matar la app es aceptable para MVP.

**Trigger de salida:** Si se necesita deep-linking a un paso específico o back navigation entre pasos, migrar a rutas individuales `app/(onboarding)/step-[n].tsx`.

### Home real aplazada — CERRADO

**Decisión:** `app/(app)/index.tsx` sigue siendo placeholder tras la Fase 5. Muestra "Perfil completado" + botón de logout.

**Razón:** La Home requiere el motor de recomendaciones en UI, el historial del día y el estado de sesión. Construirla antes sería prematuro sin sesiones implementadas.

---

## Fase 6 — Sessions Module

### `exposureLoad` no persistido — CERRADO

**Decisión:** La tabla `exposure_sessions` no tiene columna `exposure_score`, `exposure_load` ni `risk_score`. No se añadirá en el MVP.

**Razón:** `weeklyExposureLoad` es un dato derivado calculado en cliente por `RecommendationService` a partir de las sesiones de los últimos 7 días. Persitirlo crearía duplicación de verdad y requeriría recalcular en cada sesión. El cálculo en cliente es trivialmente rápido y siempre consistente.

**Trigger de salida:** Si el motor de recomendaciones se mueve a un Edge Function, recalcular en servidor y persistir cache de recomendación tiene sentido. Hasta entonces, dato derivado.

### React Hook Form para formulario de sesiones — CERRADO

**Decisión:** `SessionForm.tsx` usa `react-hook-form` con `zodResolver`. Los campos numéricos (`durationMinutes`) se capturan como string en el formulario y se convierten a número en `onSubmit`. Los campos enum que no tienen pre-selección (`context`, `sensationAfter`) son `.optional()` en el schema del formulario con validación manual en `onSubmit` usando `setError`.

**Razón:** Consistencia con los formularios de auth. RHF evita re-renders innecesarios. La coerción de string → number en Zod v4 (`z.coerce.number()`) infiere tipo `unknown` en la versión actual; la validación con `.refine()` sobre strings es más compatible con `exactOptionalPropertyTypes`.

### Mini Home funcional — CERRADO

**Decisión:** `app/(app)/index.tsx` se convierte en mini Home con: header, CTA de registro, lista de sesiones del día, empty state y botón de logout. Sin recomendaciones, sin historial completo.

**Razón:** Completar el primer ciclo funcional: registrar una sesión y verla reflejada inmediatamente. La Home final (con recomendación en UI) se construye cuando el motor de recomendaciones esté integrado.

### Sesiones cargadas en mount de Home y limpiadas en unmount — CERRADO

**Decisión:** `app/(app)/index.tsx` llama a `loadTodaySessions` en `useEffect` on mount y `clearSessions` en el cleanup del mismo effect.

**Razón:** Evita mostrar datos de una sesión previa al reiniciar. El cleanup en unmount garantiza estado limpio si el componente se desmonta (e.g. en logout). La carga se hace solo cuando hay `user` disponible.

---

## Decisiones pendientes (no bloqueantes para MVP)

| Decisión                                          | Estado                                                  | Urgencia       |
| ------------------------------------------------- | ------------------------------------------------------- | -------------- |
| Fuente de texto custom (DM Sans/DM Serif Display) | Pendiente, sistema como fallback                        | Baja — Fase 11 |
| Push notifications (permisos)                     | Solo pedir permiso en onboarding, sin lógica de entrega | Baja           |
| Password reset flow                               | Placeholder en login, implementar si hay tiempo         | Media          |
| Magic link auth                                   | Pendiente, Supabase lo da sin esfuerzo                  | Baja           |
| Supabase local vs remoto para dev                 | Local (Docker) — ver README                             | Resuelto       |

---

## Fase 7 — Home real + Recomendación en UI

### Sin "SPF sugerido" como recomendación exacta — CERRADO

**Decisión:** La app no muestra "usa SPF 30" o "aplica SPF 50". Todos los mensajes de recomendación usan lenguaje genérico: "protección adecuada", "prioriza la sombra", "evita las horas de mayor intensidad".

**Razón:** Dar un número de SPF específico convierte la app en orientación médica percibida, aumenta la responsabilidad legal y puede crear falsa seguridad ("llevo SPF 50, estoy protegido"). La orientación de hábito es más útil y menos comprometida que el dato preciso de SPF.

**Trigger de salida:** Si un médico o dermatólogo co-firma el contenido y la app recibe categorización médica en App Store / Play Store.

### `weeklyExposureLoad` no expuesto como riesgo médico — CERRADO

**Decisión:** El campo `weeklyExposureLoad` del `Recommendation` object se usa internamente para calcular el nivel de recomendación, pero nunca se muestra al usuario como métrica ni como porcentaje de riesgo.

**Razón:** Mostrar "has acumulado el 78% de tu carga semanal" puede ser malinterpretado como umbral médico objetivo. El usuario ve el nivel de prudencia en lenguaje humano (`RecommendationLevel`) y las razones humanizadas. El dato numérico crudo permanece interno.

### Tabla `exposure_sessions` sin cambios — CERRADO

**Decisión:** No se añaden columnas en la Fase 7. El historial de 7 días se consulta con `.gte('session_date', fromDate)`.

**Razón:** La única necesidad nueva de datos es filtrar por fecha reciente, que es una query sobre la tabla existente. No hay nueva información que persistir.

### Recomendación calculada en `useMemo` sobre `recentSessions` — CERRADO

**Decisión:** `generateRecommendation(input)` se llama en un `useMemo` en `app/(app)/index.tsx`, recalculando únicamente cuando `profile` o `recentSessions` cambian.

**Razón:** El cálculo es síncrono y barato (reduce sobre máximo 30 sesiones). `useMemo` evita recalcular en cada render de scroll o interacción sin necesidad de moverlo a un hook separado.

### `loadRecentSessions` con estado propio en el store — CERRADO

**Decisión:** El store expone `recentSessions`, `recentSessionsStatus` y `recentSessionsError` como campos independientes de `todaySessions`/`status`/`error`.

**Razón:** Home carga dos fuentes de datos independientes en paralelo (`loadTodaySessions` + `loadRecentSessions`). Un estado compartido crearía colisiones: si la primera carga termina antes, sobrescribiría el estado de la segunda. Campos independientes permiten `isLoading = todayStatus === 'loading' || recentStatus === 'loading'` sin ambigüedad.

---

## Fase 8 — Historial + Detalle + Eliminación

### Historial construido después de Home real — CERRADO

**Decisión:** `app/(app)/history.tsx` cargado en Fase 8, después de que Home y el motor de recomendaciones estén completos.

**Razón:** El historial necesita `SessionCard`, `session.store` y la arquitectura de capas establecida en las Fases 6 y 7. Construirlo antes habría requerido mocks o duplicación.

### Eliminación de sesión permitida — CERRADO

**Decisión:** El usuario puede eliminar cualquier sesión propia desde la pantalla de detalle.

**Razón:** Control del usuario sobre sus propios datos. Necesario para casos de error al registrar (duración equivocada, contexto incorrecto). Refuerza el mensaje de privacidad del MVP.

### Edición de sesión aplazada — CERRADO

**Decisión:** La pantalla de detalle no tiene opción de editar. Solo se puede eliminar y volver a registrar.

**Razón:** La edición requiere re-validar todos los campos con el mismo formulario de `SessionForm`, gestionar estado de edición en el store y manejar la transición entre "modo vista" y "modo edición". El esfuerzo no está justificado para MVP cuando el usuario puede eliminar y crear de nuevo.

### Filtros y calendario aplazados — CERRADO

**Decisión:** El historial carga todas las sesiones sin filtro ni paginación.

**Razón:** Para MVP el número de sesiones es pequeño. Filtros y paginación son mejoras de usabilidad que no son bloqueantes para validar el producto.

### delete siempre filtrado por user_id — CERRADO

**Decisión:** `SessionRepository.deleteSession(userId, sessionId)` siempre incluye `.eq('user_id', userId)` además de `.eq('id', sessionId)`.

**Razón:** Defensa en profundidad. RLS ya protege el acceso, pero el doble filtro en la query asegura que no hay bug de aplicación que permita borrar la sesión de otro usuario aunque RLS fallara.

### Estado `historyStatus`/`historySessions` independiente — CERRADO

**Decisión:** El store expone campos dedicados `historySessions`, `historyStatus`, `historyError` para la pantalla de historial, separados del `status`/`todaySessions` que usa Home.

**Razón:** Home y History están montadas simultáneamente en el Stack navigator. Un estado compartido crearía colisiones cuando History carga sus sesiones mientras Home sigue visible en el fondo. Patrón consistente con `recentSessions` (Fase 7).

### No cambios de schema — CERRADO

**Decisión:** No se añaden columnas ni tablas en la Fase 8. `getSessionById` usa `.eq('id', sessionId)` sobre la tabla existente. `deleteSession` usa `.delete().eq().eq()`.

**Razón:** El historial es una operación de lectura/eliminación sobre datos ya existentes. No hay información nueva que persistir.
