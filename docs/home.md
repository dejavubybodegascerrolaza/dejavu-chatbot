# Bronze IQ — Home Screen (Fase 7)

## Objetivo

La pantalla `app/(app)/index.tsx` integra perfil, historial reciente y motor de recomendaciones para mostrar al usuario su estado del día de forma prudente y no alarmista.

---

## Datos cargados en mount

| Fuente                         | Llamada                            | Campo de estado                          |
| ------------------------------ | ---------------------------------- | ---------------------------------------- |
| Sesiones del día actual        | `loadTodaySessions(userId, today)` | `todaySessions`, `status`                |
| Sesiones de los últimos 7 días | `loadRecentSessions(userId, 7)`    | `recentSessions`, `recentSessionsStatus` |

Ambas cargas se lanzan en paralelo en el mismo `useEffect`. Cuando el componente se desmonta, `clearSessions()` limpia todo el estado (incluye `recentSessions`).

---

## Componentes y estructura

```
SafeAreaView
└── ScrollView
    ├── Header          — "Hola, [alias]" + subtexto del nivel de prudencia (LEVEL_SUBTEXTS)
    ├── RecommendationCard  — título + mensaje + razones + CTA "Registrar sesión"
    ├── WeeklySummaryCard   — resumen 7 días: sesiones, minutos, última sensación, nivel
    ├── Button          — "Registrar exposición" (CTA principal)
    ├── Sección "Hoy"   — SessionCards o EmptyState
    ├── Sección "Última sesión"  — solo si la última sesión no es de hoy
    ├── SafetyNote      — disclaimer fijo
    └── Button          — "Cerrar sesión"
```

---

## Cómo se genera la recomendación

```typescript
const recommendation = useMemo(() => {
  if (!profile) return null
  return generateRecommendation({
    profile: { mainGoal, sunSensitivity, skinType },
    sessionsLast7Days: recentSessions,
  })
}, [profile, recentSessions])
```

`generateRecommendation` es una función pura y determinista. No hace red. Recibe el perfil y el historial reciente, calcula `weeklyExposureLoad`, evalúa las sensaciones recientes y devuelve un `Recommendation` con `level`, `title`, `message`, `reasons` y `ctaLabel`.

---

## Lo que se muestra vs. lo que no

| Dato                                                        | Se muestra                 | Razón                                   |
| ----------------------------------------------------------- | -------------------------- | --------------------------------------- |
| Nivel de prudencia (low/moderate/caution/high_caution/rest) | Sí, en lenguaje humano     | Orienta el comportamiento               |
| Razones humanizadas                                         | Sí, via `getReasonLabel()` | Explica el por qué sin alarmismo        |
| Sesiones del día                                            | Sí                         | Feedback inmediato                      |
| Minutos acumulados 7 días                                   | Sí, como dato neutral      | Información, no diagnóstico             |
| `weeklyExposureLoad` (número crudo)                         | **No**                     | Podría interpretarse como umbral médico |
| SPF exacto recomendado                                      | **No**                     | Evita parecer orientación médica        |
| Índice UV calculado o externo                               | **No**                     | Sin integración UV en MVP               |

---

## Decisión: sin SPF exacto

La app usa lenguaje como "protección adecuada", "prioriza la sombra", "evita las horas de mayor intensidad". No aparecen números de SPF en los mensajes de recomendación.

Ver `docs/engineering-decisions.md` — sección Fase 7.

---

## Decisión: `weeklyExposureLoad` interno

`generateRecommendation` calcula internamente `weeklyExposureLoad` para determinar el nivel, pero ese número no se expone en la UI ni se persiste en Supabase.

---

## SafetyNote — disclaimer obligatorio

`SafetyNote` muestra siempre al final de la Home:

> "Bronze IQ ofrece orientación general, no médica. No garantiza seguridad frente a la exposición solar."

Texto fijo, sin personalización. No contiene "sin riesgo", "seguro" ni "garantizado".

---

## Checklist de test manual

- [ ] Crear cuenta nueva → Home muestra empty state en "Hoy" y recomendación basada en perfil
- [ ] Registrar sesión de hoy → aparece en sección "Hoy" inmediatamente tras volver
- [ ] Registrar sesión de ayer → aparece en "Última sesión", no en "Hoy"
- [ ] Perfil con sensibilidad alta + sesiones recientes con quemadura → nivel `rest` en RecommendationCard
- [ ] Perfil básico sin sesiones → nivel `low` con mensaje invitador
- [ ] Sin red → ErrorState con botón "Reintentar" funcional
- [ ] Logout → limpia estado y redirige a welcome
- [ ] SafetyNote visible al final del scroll en todos los casos

---

## Riesgos conocidos

| Riesgo                                                              | Mitigación                                                                               |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Usuario interpreta la recomendación como diagnóstico médico         | SafetyNote visible en Home + lenguaje no alarmista en todos los mensajes                 |
| `recentSessions` vacío al primer render (carga asíncrona)           | `useMemo` devuelve recomendación basada en `[]` sesiones → nivel conservador por defecto |
| Colisión de estado entre `loadTodaySessions` y `loadRecentSessions` | Estados independientes (`status` vs `recentSessionsStatus`)                              |
