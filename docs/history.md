# Bronze IQ — Historial (Fase 8)

## Objetivo

Permitir al usuario revisar todas sus sesiones de exposición registradas, ver el detalle de cada una y eliminar registros erróneos. El historial refuerza el control del usuario sobre sus propios datos y mantiene la coherencia de la recomendación en Home tras cualquier eliminación.

---

## Qué datos muestra

### Pantalla Historial (`app/(app)/history.tsx`)

- Lista de todas las sesiones del usuario ordenadas por `session_date` desc, `created_at` desc
- Cada sesión se muestra con `SessionCard` (duración, contexto, sensación, protección, UV, notas)
- `SessionCard` es pulsable → navega a Detalle
- Estados: loading / error (con retry) / empty (con CTA) / lista

### Pantalla Detalle (`app/(app)/session-detail/[id].tsx`)

| Campo             | Label         | Fuente                                |
| ----------------- | ------------- | ------------------------------------- |
| Fecha             | Fecha         | `session_date` formateado DD/MM/YYYY  |
| Duración          | Duración      | `duration_minutes` + " min"           |
| Contexto          | Contexto      | `CONTEXT_LABELS[context]`             |
| Índice UV         | UV            | valor numérico o "No indicado"        |
| Protección        | Protección    | `PROTECTION_LABELS[protection_level]` |
| Sensación         | Sensación     | `SENSATION_LABELS[sensation_after]`   |
| Notas             | Notas         | texto libre o "—"                     |
| Fecha de registro | Registrado el | `created_at` formateado DD/MM/YYYY    |

---

## Cómo funciona la eliminación

1. Usuario pulsa "Eliminar sesión" en la pantalla de detalle
2. `Alert.alert` muestra confirmación: "¿Eliminar esta sesión?" / "Esta acción no se puede deshacer."
3. Si el usuario cancela → nada ocurre, la sesión permanece
4. Si el usuario confirma → `useSessionStore.deleteSession(userId, sessionId)`:
   - Llama a `SessionService.deleteExposureSession(userId, sessionId)`
   - El service delega en `SessionRepository.deleteSession(userId, sessionId)`
   - Supabase ejecuta `DELETE WHERE user_id = userId AND id = sessionId` (doble filtro + RLS)
   - El store elimina la sesión de `historySessions`, `todaySessions`, `recentSessions`, `sessions`, y limpia `selectedSession`
   - Retorna `true` en éxito, `false` en error
5. Tras éxito → `router.replace('/(app)/history')` (reemplaza la ruta de detalle)
6. Historial muestra inmediatamente la lista actualizada (sin la sesión eliminada)
7. Al volver a Home, `todaySessions` y `recentSessions` ya están actualizados en el store → la recomendación se recalcula via `useMemo`

---

## Arquitectura de capas

```
app/(app)/history.tsx
app/(app)/session-detail/[id].tsx
         ↓
SessionCard, SafetyNote (product components)
         ↓
useSessionStore (Zustand)
  - historySessions / historyStatus / historyError
  - selectedSession / selectedSessionStatus / selectedSessionError
  - loadHistorySessions, loadSessionById, deleteSession, clearSelectedSession
         ↓
session.service.ts
  - loadSessionById → SessionRepository.getSessionById
  - deleteExposureSession → SessionRepository.deleteSession
         ↓
session.repository.ts
  - getSessionById: SELECT * WHERE user_id = userId AND id = sessionId LIMIT 1
  - deleteSession:  DELETE WHERE user_id = userId AND id = sessionId
         ↓
Supabase (exposure_sessions table + RLS)
```

---

## Estado dedicado para Historial

El store expone `historySessions` / `historyStatus` / `historyError` independientes del estado de Home (`status` / `todaySessions`). Esto evita colisiones: Home y History nunca sobrescriben el estado del otro aunque ambas pantallas estén montadas en el Stack.

Patrón consistente con `recentSessions` (Fase 7).

---

## Actualización de Home tras eliminar

Cuando el usuario elimina desde Detalle:

1. El store elimina la sesión de `todaySessions` y `recentSessions` inmediatamente
2. Home sigue montada en el Stack y lee del mismo store
3. `useMemo` de recomendación recalcula desde el `recentSessions` actualizado
4. No es necesaria ninguna recarga explícita de Home

---

## Qué NO incluye todavía

- Edición de sesión (sólo eliminación)
- Filtros por fecha, contexto o sensación
- Vista de calendario
- Gráficos o tendencias
- Paginación o infinite scroll (carga completa para MVP)
- Búsqueda

---

## Prueba manual

1. Iniciar sesión con usuario onboarded
2. Registrar 2-3 sesiones desde Home
3. Tocar "Ver historial" en Home
4. Verificar que las sesiones aparecen ordenadas (más reciente primero)
5. Tocar una sesión → pantalla de detalle con todos los campos
6. Pulsar "Eliminar sesión" → aparece confirmación
7. Pulsar "Cancelar" → sesión sigue en historial
8. Pulsar "Eliminar sesión" de nuevo → confirmar eliminación
9. Volver al historial → sesión ya no aparece
10. Volver a Home → todaySessions y resumen semanal actualizados
11. Iniciar sesión con otro usuario → no ve sesiones del usuario anterior (RLS)

---

## Riesgos conocidos

| Riesgo                                                                 | Mitigación                                                                                                       |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Usuario elimina sesión por error                                       | No hay papelera/deshacer — la confirmación es la única barrera                                                   |
| RLS no implementado en tests de integración                            | Tests unitarios comprueban el doble filtro `user_id + id`; tests de integración contra Supabase local en Fase 12 |
| Historial sin filtros puede ser difícil de navegar con muchas sesiones | Aceptable para MVP; paginación/filtros en fase posterior                                                         |
| `getSessionById` usa `.single()` → PGRST116 si no hay fila             | Mapeado a `null` (status `missing`) sin propagar el error de Supabase                                            |
