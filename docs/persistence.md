# Bronze IQ — Fase 16: Persistencia del plan en Supabase

## Objetivo

Que el plan de bronceado **sobreviva al cierre de la app** y a cambios de
dispositivo, guardándolo en Supabase con RLS. Hasta ahora vivía solo en memoria.

## Por qué solo el plan

- **Rachas y logros** ya son duraderos: se **derivan** de `exposure_sessions`,
  que ya se persiste. No necesitan tabla propia.
- **Sesión en directo**: es efímera por naturaleza; al finalizar se registra como
  una `exposure_session` normal (ya persistida).
- **El plan** (objetivo + tono actual) era el único estado no persistido → esta
  fase lo cierra.

## Cambios

### Base de datos

- Migración `supabase/migrations/20260615120000_tanning_plans.sql`: tabla
  `tanning_plans` (una por usuario, `user_id` único), con RLS completo
  (select/insert/update/delete propios) y trigger `set_updated_at`.
- `src/types/database.types.ts`: tipos de la tabla añadidos.

### Módulo `plan`

| Archivo              | Añadido                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `plan.types.ts`      | `TanningPlan`, `TanningPlanInput`                                  |
| `plan.mapper.ts`     | row ↔ dominio, dominio → upsert                                    |
| `plan.repository.ts` | `getTanningPlanByUserId`, `upsertTanningPlan`, `deleteTanningPlan` |
| `plan.service.ts`    | `loadTanningPlan`, `saveTanningPlan`, `deleteTanningPlan`          |
| `plan.store.ts`      | reescrito: carga/persiste con estado optimista                     |

### Store

`usePlanStore` ahora:

- `loadPlan(userId)` — carga el plan persistido (status `idle/loading/ready/error`).
- `setGoal` / `setCurrentLevel` — actualizan en memoria de forma optimista y
  persisten vía upsert.
- `clearPlan` — borra la fila y resetea.
- `reset` — limpieza local en logout / cambio de usuario.

### Integración

- **Home** carga el plan al montar (`loadPlan`) y lo resetea al cambiar de
  usuario; el upsert usa `user_id` único (un plan por persona).
- La pantalla del plan persiste cada cambio de objetivo automáticamente.

## Seguridad

- Acceso restringido por RLS a `user_id = auth.uid()`. Sin `service_role` en el
  cliente. Cascade en borrado de cuenta elimina el plan sin paso server-side.

## Calidad

| Check                  | Resultado                            |
| ---------------------- | ------------------------------------ |
| `npm run typecheck`    | ✅ exit 0                            |
| `npm run lint`         | ✅ exit 0, cero warnings             |
| `npm test`             | ✅ 440 tests, 62 suites (+13 nuevos) |
| `npm run format:check` | ✅ exit 0                            |

## Siguientes pasos sugeridos

- Recalcular el ETA real según la adherencia (sesiones registradas vs plan).
- Persistir logros desbloqueados para celebraciones puntuales.
- Notificaciones inteligentes ("hoy toca sesión de tu plan", "no rompas tu racha").
