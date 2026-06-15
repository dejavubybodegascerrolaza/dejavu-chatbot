# Bronze IQ — Fase 13: Plan de bronceado + ETA

## Objetivo

Convertir el objetivo del usuario en un **plan progresivo y seguro** y predecir
**el día exacto en que lo alcanza sin quemarse**. Es la pieza "Strava del sol":
una meta, un camino, una fecha y hitos por el camino.

## Principio de diseño (no negociable)

> El plan optimiza el **máximo moreno alcanzable SIN quemar**, nunca la dosis de
> UV. Cada sesión usa solo la dosis diaria segura (una fracción del umbral de
> quemadura), con días de descanso. El plan nunca recomienda superar ese límite.

Esto mantiene la app del lado responsable (App Store + ética + confianza) sin
renunciar a la dopamina del progreso y la meta.

## Módulo nuevo: `src/modules/plan`

| Archivo          | Responsabilidad                                                       |
| ---------------- | --------------------------------------------------------------------- |
| `plan.types.ts`  | `TanLevel`, `TanPlanInput`, `TanPlanResult`, `PlanMilestone`, estados |
| `plan.rules.ts`  | Techos y tasas de bronceado por fototipo, escala de tonos, helpers    |
| `plan.engine.ts` | `generateTanPlan` — simulación determinista día a día                 |
| `plan.labels.ts` | Etiquetas en español, formato de ETA y duración                       |
| `plan.store.ts`  | Zustand: objetivo y tono actual elegidos (sincroniza Home y pantalla) |

### Modelo (transparente y determinista)

- **Escala de tono** 0–100 con 5 niveles nombrados: Tono natural (0), Dorado
  suave (25), Dorado (45), Bronceado (65), Bronceado intenso (85).
- **Techo por fototipo** (máximo seguro): I=25, II=40, III=60, IV=80, V=95, VI=100.
  La piel clara apenas broncea; la oscura llega más lejos.
- **Progresión**: cada sesión segura cierra una fracción del hueco hasta el techo
  (`tasa` por fototipo: I=0.04 … VI=0.14), con rendimientos decrecientes.
- **Calendario**: N sesiones/semana repartidas con días de recuperación (por
  defecto 5). El motor simula día a día hasta alcanzar el objetivo → fecha ETA.
- **Techo práctico**: 95% del techo (la curva es asintótica). Si el objetivo lo
  supera, el motor devuelve `goal_exceeds_safe_ceiling` y propone la meta más
  intensa **segura** para esa piel (p. ej. fototipo III no llega a "Bronceado
  intenso"; fototipo I no broncea con seguridad → se prioriza protección).

### Salida (`TanPlanResult`)

`status`, `reachableLevel`, `etaDate`, `totalDays`, `sessionDays`,
`dailySafeMinutes` (vía el motor MED de `sun`) y `milestones[]` con fecha por
cada tono intermedio.

## Integración

- **Home**: `TanPlanCard` muestra meta, ETA y dosis diaria segura, o invita a
  crear el plan. Usa el UV máximo del día real como UV típico cuando está
  disponible.
- **Pantalla `app/(app)/plan.tsx`** (header nativo "Mi plan"): selector de
  objetivo, resultado con ETA, línea de tiempo de hitos, panel "Cómo lo
  calculamos" y CTA para registrar la sesión del día.
- Ruta registrada en `app/(app)/_layout.tsx`.

## Calidad

| Check                  | Resultado                            |
| ---------------------- | ------------------------------------ |
| `npm run typecheck`    | ✅ exit 0                            |
| `npm run lint`         | ✅ exit 0, cero warnings             |
| `npm test`             | ✅ 387 tests, 53 suites (+37 nuevos) |
| `npm run format:check` | ✅ exit 0                            |

## Siguientes pasos sugeridos

- Persistir el plan y el tono actual en Supabase + seguimiento de adherencia
  (sesiones completadas vs planificadas).
- Capa de gamificación encima: racha de adherencia, hitos celebrados, anillos.
- Reprogramación automática del ETA según las sesiones reales registradas.
- Notificación "hoy toca sesión de tu plan" (ventana óptima de UV).
