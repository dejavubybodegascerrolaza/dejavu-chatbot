# Bronze IQ — Fase 12: Núcleo UV real, reloj de piel y vitamina D

## Objetivo

Sustituir el proxy de "hora del día" por **datos UV reales y geolocalizados**, y construir sobre ellos dos motores científicos transparentes: tiempo de exposición seguro ("reloj de piel") y estimación de vitamina D. Es el salto que convierte la recomendación en una herramienta real.

---

## Módulos nuevos

### `src/modules/uv` — datos de índice UV

Capa de datos sobre la API gratuita y sin clave [Open-Meteo](https://open-meteo.com).

| Archivo            | Responsabilidad                                                         |
| ------------------ | ----------------------------------------------------------------------- |
| `uv.types.ts`      | `Coordinates`, `UvReading`, `UvForecast`, `UvCategory`, `UvPeakWindow`  |
| `uv.rules.ts`      | Clasificación WHO (`classifyUv`), ventana de pico (`computePeakWindow`) |
| `uv.labels.ts`     | Etiquetas y consejos en español por categoría, formato de ventana       |
| `uv.schema.ts`     | Validación Zod de la respuesta de Open-Meteo                            |
| `uv.mapper.ts`     | Respuesta API → `UvForecast` (filtra al día actual, recorta negativos)  |
| `uv.repository.ts` | `fetchUvForecast(coords)` con `fetch`, errores en español               |
| `uv.service.ts`    | Orquestación (`loadUvForecast`)                                         |
| `uv.store.ts`      | Zustand: `status`, `forecast`, `error`, `loadForecast`, `clearUv`       |

Categorías WHO: `low` (0–2), `moderate` (3–5), `high` (6–7), `very_high` (8–10), `extreme` (11+).

### `src/modules/location` — geolocalización

Envoltura fina de `expo-location` (instalado, compatible con SDK 56).

- `getCurrentCoordinates()` pide permiso en primer plano y devuelve coordenadas, o lanza `LocationPermissionError` si se deniega.
- `useLocationStore` expone `status` (`idle | requesting | ready | denied | error`), `coordinates`, `requestLocation`, `clearLocation`.
- El permiso degrada con elegancia: si se deniega, Home muestra un aviso y sigue funcionando sin UV en tiempo real.

### `src/modules/sun` — motores científicos puros

Sin dependencias de red ni de React; 100% testeables offline.

#### Tiempo de quemado (`sun.burn-time.ts`)

Modelo basado en la **Dosis Eritematosa Mínima (MED)** por fototipo Fitzpatrick:

```
tiempo a 1 MED (min) = MED (J/m²) × SPF / (índice UV × 1.5 J/m²/min)
```

- 1 unidad de índice UV = 0.025 W/m² de irradiancia eritemática = 1.5 J/m²/min.
- MED por fototipo (J/m²): I=200, II=250, III=350, IV=450, V=600, VI=1000.
- `safeMinutes` = tiempo a 0.6 MED (límite conservador antes del umbral de quemadura).
- UV 0 → sin riesgo eritemático (`null`).

#### Vitamina D (`sun.vitamin-d.ts`)

```
IU = 20.000 × fracciónDosis × factorPiel × fracciónCuerpoExpuesto
fracciónDosis = min(dosis UV / dosis de saturación, 1)
```

- La síntesis necesita UVB y se satura en torno a 1–2 SED (≈200 J/m²).
- Piel más oscura sintetiza menos por dosis (la melanina absorbe UVB): factores I/II=1.0 … VI=0.35.
- Fracción de cuerpo: cara/manos 0.1, brazos/piernas 0.3, gran parte 0.6, completo 0.9.

> Ambos motores son **estimaciones orientativas de bienestar, no mediciones clínicas ni diagnóstico**. Cualquier funcionalidad de diagnóstico (p. ej. análisis de lunares) sería producto sanitario regulado y queda fuera de este alcance.

---

## Integración

- **Motor de recomendaciones**: `RecommendationInput.today.uvIndexNow` recibe el UV real y tiene prioridad sobre el manual. La regla de UV ≥ 8 (mínimo `high_caution`) ahora se dispara con datos reales.
- **Home**: al montar, pide ubicación → carga el pronóstico UV. Muestra `UvIndexCard` (UV actual + categoría + ventana de pico), `BurnTimeCard` (reloj de piel) y `VitaminDCard` (a partir de los minutos registrados hoy). Pull-to-refresh recarga también el UV.

### Componentes nuevos

`UvIndexCard`, `BurnTimeCard`, `VitaminDCard` en `src/components/product`, todos sobre tokens del design system.

---

## Privacidad y seguridad

- La ubicación se usa **solo en memoria** para consultar el UV; no se persiste ni se envía a Supabase.
- Open-Meteo no requiere clave; no se añade ningún secreto al cliente.
- Texto de permiso de ubicación en `app.config.ts` (`expo-location`).

---

## Resultados de calidad

| Check                  | Resultado                            |
| ---------------------- | ------------------------------------ |
| `npm run typecheck`    | ✅ exit 0                            |
| `npm run lint`         | ✅ exit 0, cero warnings             |
| `npm test`             | ✅ 350 tests, 48 suites (+62 nuevos) |
| `npm run format:check` | ✅ exit 0                            |

---

## Siguientes pasos sugeridos

- Notificaciones push basadas en la ventana de pico UV y en "reaplica protector".
- Pronóstico UV multi-día (premium) — Open-Meteo ya lo soporta con `forecast_days`.
- Caché del pronóstico con expiración para reducir llamadas.
- App de Apple Watch con el UV y el reloj de piel glanceables.
