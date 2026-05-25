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

## Decisiones pendientes (no bloqueantes para MVP)

| Decisión                                          | Estado                                                  | Urgencia       |
| ------------------------------------------------- | ------------------------------------------------------- | -------------- |
| Fuente de texto custom (DM Sans/DM Serif Display) | Pendiente, sistema como fallback                        | Baja — Fase 11 |
| Push notifications (permisos)                     | Solo pedir permiso en onboarding, sin lógica de entrega | Baja           |
| Password reset flow                               | Placeholder en login, implementar si hay tiempo         | Media          |
| Magic link auth                                   | Pendiente, Supabase lo da sin esfuerzo                  | Baja           |
| Supabase local vs remoto para dev                 | Local (Docker) — ver README                             | Resuelto       |
