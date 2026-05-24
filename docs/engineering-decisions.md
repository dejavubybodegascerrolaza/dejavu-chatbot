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

## Decisiones pendientes (no bloqueantes para MVP)

| Decisión                                          | Estado                                                  | Urgencia       |
| ------------------------------------------------- | ------------------------------------------------------- | -------------- |
| Fuente de texto custom (DM Sans/DM Serif Display) | Pendiente, sistema como fallback                        | Baja — Fase 11 |
| Push notifications (permisos)                     | Solo pedir permiso en onboarding, sin lógica de entrega | Baja           |
| Password reset flow                               | Placeholder en login, implementar si hay tiempo         | Media          |
| Magic link auth                                   | Pendiente, Supabase lo da sin esfuerzo                  | Baja           |
| Supabase local vs remoto para dev                 | Local (Docker) — ver README                             | Resuelto       |
