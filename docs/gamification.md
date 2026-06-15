# Bronze IQ — Fase 14: Gamificación y rachas

## Objetivo

Añadir la capa de comportamiento que multiplica la retención: **racha de
seguridad** y **logros**, apoyándose en el plan y en el historial existentes.

## Principio de diseño (no negociable)

> Gamificamos el **comportamiento seguro y la constancia**, nunca la dosis de UV.
> La racha premia los días **sin quemarte** —y descansar también cuenta—. Nunca
> recompensamos más exposición.

Esto aplica al sol la _loss aversion_ que hace adictivo a Strava, pero en favor
de la salud: lo que el usuario teme perder es su racha de **cuidado**.

## Módulo nuevo: `src/modules/gamification`

| Archivo                  | Responsabilidad                                                  |
| ------------------------ | ---------------------------------------------------------------- |
| `gamification.types.ts`  | `Achievement`, `AchievementId`, `GamificationSummary`, inputs    |
| `gamification.rules.ts`  | Sensaciones que rompen la racha, objetivos y orden de logros     |
| `gamification.engine.ts` | `calculateSafetyStreak`, `calculateAchievements`, `buildSummary` |
| `gamification.labels.ts` | Etiquetas/descripciones en español, mensaje de racha             |

### Racha de seguridad

Días consecutivos, terminando hoy, **sin señal de quemadura**. Solo `burned` y
`slightly_red` rompen la racha; el calor leve y los días de descanso la
mantienen.

- Quemadura hoy → 0.
- Última quemadura hace N días → N.
- Sin quemaduras nunca, con sesiones → días desde la primera sesión (inclusive).
- Sin sesiones → 0.

### Logros (deterministas desde el historial)

| Logro            | Condición                       |
| ---------------- | ------------------------------- |
| Primera sesión   | ≥ 1 sesión registrada           |
| Con un plan      | Plan de bronceado creado        |
| Explorador       | ≥ 3 contextos distintos         |
| Semana protegida | Racha de seguridad ≥ 7          |
| Constante        | Sesiones en ≥ 10 días distintos |
| Mes protegido    | Racha de seguridad ≥ 30         |

Cada logro expone `current`/`target` (limitado al objetivo) para barras de
progreso, y `unlocked`.

## Integración

- **Home**: `StreakCard` (héroe de la racha) arriba, y `AchievementsCard`
  (compacta, "X/Y" + próximo logro) junto al plan. Home ahora carga el historial
  completo para que la racha y los logros sean reales.
- **Pantalla `app/(app)/achievements.tsx`** (header "Logros"): racha + lista
  completa de logros con progreso + nota sobre el principio de seguridad.
- Ruta registrada en `app/(app)/_layout.tsx`.

### Componentes nuevos

`StreakCard`, `AchievementBadge`, `AchievementsCard` en `src/components/product`.

## Utilidad nueva

`daysBetweenISODates(from, to)` en `src/utils/date.ts` (con tests).

## Calidad

| Check                  | Resultado                            |
| ---------------------- | ------------------------------------ |
| `npm run typecheck`    | ✅ exit 0                            |
| `npm run lint`         | ✅ exit 0, cero warnings             |
| `npm test`             | ✅ 415 tests, 58 suites (+28 nuevos) |
| `npm run format:check` | ✅ exit 0                            |

## Siguientes pasos sugeridos

- Persistir logros desbloqueados + celebraciones (animación al desbloquear).
- Sesión en directo (cuenta atrás, alerta de seguridad con haptics).
- Notificaciones que refuercen la racha ("no rompas tu racha de N días").
- Niveles/XP y "anillos" diarios sobre la misma base.
