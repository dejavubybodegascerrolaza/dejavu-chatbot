# Evaluación del fototipo (escala de Fitzpatrick) — base científica

Este documento explica **qué** mide el test de fototipo de Bronze IQ, **cómo** lo
puntúa y **en qué evidencia** se apoya. El código vive en
`src/modules/profile/fitzpatrick/`.

## Qué es la escala de Fitzpatrick

La clasificación de Fitzpatrick (Thomas B. Fitzpatrick, 1975; revisada en 1988)
ordena la piel humana en **seis fototipos (I–VI)** según su reacción
constitucional a la radiación ultravioleta: tendencia a **quemarse** y capacidad
de **broncearse**. Es la referencia estándar en dermatología, fotoprotección y
medicina estética para estimar la sensibilidad de una piel al sol.

> Fitzpatrick TB. _The validity and practicality of sun-reactive skin types I
> through VI._ Arch Dermatol. 1988;124(6):869–871.

## Por qué un cuestionario y no "elige tu tipo"

Pedir al usuario que se autoasigne un tipo I–VI a ojo es poco fiable: la mayoría
juzga su piel por su estado **ya bronceado** y se clasifica mal. El instrumento
validado evita ese sesgo preguntando por **rasgos no expuestos al sol** y por la
**reacción real** de la piel, y deriva el tipo de una **puntuación objetiva**.

## Los tres dominios (las variables que de verdad intervienen)

El test recoge las tres familias de variables que determinan la respuesta de una
piel a la radiación UV:

1. **Constitución genética** (rasgos hereditarios, fijos): color de ojos, color
   natural del pelo, color de la piel en zonas no expuestas y pecas. Definen la
   cantidad y el tipo de melanina basal — la protección "de fábrica".
2. **Reacción al sol** (fotorreactividad): qué ocurre tras una exposición larga,
   grado y velocidad de bronceado, y sensibilidad facial. Es el indicador más
   directo de la sensibilidad real.
3. **Hábitos / estado actual** (comportamiento): cuándo fue la última exposición
   y con qué frecuencia se expone la zona. Calibra la estimación al momento
   concreto de la persona.

Estas tres dimensiones son exactamente las del cuestionario de autoevaluación de
Fitzpatrick ampliamente usado en la práctica clínica y en dispositivos láser/IPL.

## Puntuación

- **10 preguntas**, cada una con 5 opciones puntuadas **0–4**
  (0 = máxima sensibilidad → extremo Tipo I; 4 = máxima resistencia → extremo
  Tipo VI).
- Rango total: **0–40**.
- Mapa puntuación → fototipo:

| Puntuación total | Fototipo |
| ---------------- | -------- |
| 0–6              | I        |
| 7–13             | II       |
| 14–20            | III      |
| 21–27            | IV       |
| 28–34            | V        |
| 35+              | VI       |

La función pura `computeFitzpatrick()` exige que **todas** las preguntas estén
respondidas (`isComplete()`), suma las puntuaciones y aplica las bandas
(`scoreToSkinType()`). Cubierto por `fitzpatrick.scoring.test.ts`.

## Cómo se usa el resultado en la app

El fototipo (1–6) alimenta los cálculos orientativos ya existentes:

- **Tiempo hasta quemadura** vía la Dosis Eritematosa Mínima por fototipo
  (`MED_BY_SKIN_TYPE`, en `src/modules/sun/sun.rules.ts`).
- **Estimación de vitamina D** vía `VITAMIN_D_SKIN_FACTOR`.

Si el usuario prefiere no determinarlo, el fototipo queda `null` y la app aplica
un margen conservador.

## Límites (importante)

Bronze IQ **no es un producto médico**. El fototipo es una **autoevaluación
orientativa**, no un diagnóstico. No sustituye la valoración de un profesional
sanitario, especialmente ante antecedentes de quemaduras, lesiones, lunares
cambiantes o condiciones de fotosensibilidad. Estos límites se comunican en el
onboarding, en la pantalla de resultado del test y en el disclaimer.

## Referencias

- Fitzpatrick TB. _Soleil et peau._ J Med Esthet. 1975;2:33–34.
- Fitzpatrick TB. _The validity and practicality of sun-reactive skin types I
  through VI._ Arch Dermatol. 1988;124(6):869–871.
- Roberts WE. _Skin type classification systems old and new._ Dermatol Clin.
  2009;27(4):529–533.
- Sachdeva S. _Fitzpatrick skin typing: Applications in dermatology._ Indian J
  Dermatol Venereol Leprol. 2009;75(1):93–96.
