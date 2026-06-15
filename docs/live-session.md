# Bronze IQ — Fase 15: Sesión en directo

## Objetivo

La pieza "wow": un cronómetro en tiempo real del **reloj de piel** durante la
exposición, con **alerta de seguridad prioritaria** y recordatorios de giro.

## Principio de diseño (no negociable)

> La alerta principal es **de seguridad**: avisa al alcanzar la dosis segura
> ('caution') y, de forma más contundente, en el umbral de quemadura
> ('danger'). El recordatorio de giro es una comodidad secundaria. Nunca anima a
> prolongar la exposición.

## Módulo nuevo: `src/modules/live`

| Archivo          | Responsabilidad                                                |
| ---------------- | -------------------------------------------------------------- |
| `live.types.ts`  | `LiveStatus`, `LiveSessionInput`, `LiveSessionState`           |
| `live.rules.ts`  | Intervalo de giro por defecto, presets de SPF                  |
| `live.engine.ts` | `computeLiveSessionState` — state machine pura (sin timers)    |
| `live.labels.ts` | Etiquetas/mensajes por estado, `formatClock` (mm:ss / h:mm:ss) |

### Motor (state machine pura)

`computeLiveSessionState({ elapsedSeconds, skinType, uvIndex, spf, flipIntervalMinutes })`
calcula, a partir del motor MED de `sun`:

- `safeMinutes` (límite conservador) y `burnMinutes` (umbral de quemadura).
- `remainingSafeSeconds` y `progress` (0–1) hacia el límite seguro.
- `flipCount` (intervalos de giro completados).
- `status`:
  - `no_risk` cuando UV = 0 (sin cuenta atrás ni alertas),
  - `safe` por debajo del límite seguro,
  - `caution` al alcanzar la dosis segura,
  - `danger` en el umbral de quemadura.

No contiene temporizadores: la pantalla avanza los segundos y la llama en cada
tick, lo que la hace 100% testeable.

## Pantalla `app/(app)/live-session.tsx`

- **Cronómetro** grande con color según estado (marca / peligro).
- Selector de **SPF** (Sin protección / SPF 30 / SPF 50) que alarga el tiempo
  seguro en directo.
- **Tiempo seguro restante** + barra de progreso.
- **Alertas hápticas** (`expo-haptics`): vibración de aviso al pasar a `caution`,
  vibración fuerte en `danger`, y un toque al tocar cada giro, con banner "Date
  la vuelta".
- **Pantalla siempre activa** durante la sesión (`expo-keep-awake`).
- Controles: Empezar/Pausar/Reanudar, Finalizar y registrar (→ formulario),
  Reiniciar.
- Si no hay índice UV disponible, pide activar la ubicación en lugar de correr
  una cuenta atrás sin base de seguridad.

Acceso desde Home ("Sesión en directo", CTA principal). Ruta en
`app/(app)/_layout.tsx`.

## Dependencias nuevas

- `expo-haptics@~56` — vibración de las alertas (sin assets, sin permisos).
- `expo-keep-awake@~56` — mantiene la pantalla activa durante la sesión.

Ninguna requiere config plugin adicional en `app.config.ts`.

## Calidad

| Check                  | Resultado                            |
| ---------------------- | ------------------------------------ |
| `npm run typecheck`    | ✅ exit 0                            |
| `npm run lint`         | ✅ exit 0, cero warnings             |
| `npm test`             | ✅ 427 tests, 60 suites (+12 nuevos) |
| `npm run format:check` | ✅ exit 0                            |

## Siguientes pasos sugeridos

- Notificaciones locales (`expo-notifications`) para avisar aunque la app esté en
  segundo plano.
- Sonido opcional además de la vibración.
- Prefijar el formulario de registro con la duración de la sesión en directo.
- Persistir la sesión en directo y enlazarla con la racha/plan.
