import type { FitzpatrickQuestion, FitzpatrickSection } from './fitzpatrick.types'

// ─────────────────────────────────────────────────────────────────────────────
// Validated Fitzpatrick skin-type self-assessment.
//
// This is the established clinical self-test (constitutional + sun-reactivity +
// behavioural domains) used to classify a person into Fitzpatrick phototypes
// I–VI. Each item is scored 0–4; the sum maps to a phototype (see
// fitzpatrick.scoring.ts). Sources are documented in
// docs/science/fitzpatrick-assessment.md.
//
// Wording is intentionally plain so any user can answer without confusion, and
// every constitutional question points at an UNEXPOSED body area to avoid the
// classic mistake of judging skin by its already-tanned state.
// ─────────────────────────────────────────────────────────────────────────────

export const FITZPATRICK_SECTION_META: Record<
  FitzpatrickSection,
  { title: string; description: string }
> = {
  genetics: {
    title: 'Constitución natural',
    description: 'Rasgos hereditarios que definen la protección base de tu piel frente al sol.',
  },
  reaction: {
    title: 'Reacción al sol',
    description: 'Cómo responde tu piel al sol es el indicador más directo de su sensibilidad.',
  },
  habits: {
    title: 'Exposición reciente',
    description: 'Tu nivel de bronceado actual ajusta la estimación a tu momento concreto.',
  },
}

export const FITZPATRICK_QUESTIONS: FitzpatrickQuestion[] = [
  // ── Domain 1: constitutional / genetic disposition ──────────────────────────
  {
    id: 'eye_color',
    section: 'genetics',
    prompt: '¿De qué color son tus ojos?',
    options: [
      { value: 'light', label: 'Azul claro, gris claro o verde claro', score: 0 },
      { value: 'blue_green', label: 'Azul, gris o verde', score: 1 },
      { value: 'hazel', label: 'Avellana o marrón claro', score: 2 },
      { value: 'dark_brown', label: 'Marrón oscuro', score: 3 },
      { value: 'brownish_black', label: 'Marrón muy oscuro o negro', score: 4 },
    ],
  },
  {
    id: 'hair_color',
    section: 'genetics',
    prompt: '¿Cuál es tu color de pelo natural?',
    help: 'El de nacimiento, sin tintes.',
    options: [
      { value: 'red_lightblond', label: 'Pelirrojo o rubio muy claro', score: 0 },
      { value: 'blond', label: 'Rubio', score: 1 },
      { value: 'light_brown', label: 'Castaño claro o rubio oscuro', score: 2 },
      { value: 'dark_brown', label: 'Castaño oscuro', score: 3 },
      { value: 'black', label: 'Negro', score: 4 },
    ],
  },
  {
    id: 'skin_color',
    section: 'genetics',
    prompt: '¿Cómo es el color natural de tu piel en zonas que no toca el sol?',
    help: 'Fíjate, por ejemplo, en la cara interna del antebrazo.',
    options: [
      { value: 'reddish', label: 'Blanca rojiza o muy pálida', score: 0 },
      { value: 'pale', label: 'Pálida', score: 1 },
      { value: 'fair_beige', label: 'Clara a beige', score: 2 },
      { value: 'olive', label: 'Beige u oliva clara', score: 3 },
      { value: 'dark', label: 'Marrón oscura', score: 4 },
    ],
  },
  {
    id: 'freckles',
    section: 'genetics',
    prompt: '¿Cuántas pecas tienes en zonas no expuestas al sol?',
    options: [
      { value: 'many', label: 'Muchas', score: 0 },
      { value: 'several', label: 'Bastantes', score: 1 },
      { value: 'some', label: 'Algunas', score: 2 },
      { value: 'few', label: 'Muy pocas', score: 3 },
      { value: 'none', label: 'Ninguna', score: 4 },
    ],
  },

  // ── Domain 2: reaction to sun exposure ──────────────────────────────────────
  {
    id: 'sun_long',
    section: 'reaction',
    prompt: 'Si te expones al sol mucho rato sin protección, ¿qué te pasa?',
    options: [
      { value: 'blister', label: 'Me quemo con dolor, ampollas y se me pela', score: 0 },
      { value: 'burn_peel', label: 'Me quemo y luego se me pela', score: 1 },
      { value: 'burn_then_tan', label: 'A veces me quemo y después me bronceo', score: 2 },
      { value: 'rarely_burn', label: 'Rara vez me quemo', score: 3 },
      { value: 'never_burn', label: 'Nunca me quemo', score: 4 },
    ],
  },
  {
    id: 'tan_degree',
    section: 'reaction',
    prompt: '¿Hasta qué punto te pones moreno/a?',
    options: [
      { value: 'none', label: 'Apenas o nada', score: 0 },
      { value: 'light', label: 'Un bronceado ligero', score: 1 },
      { value: 'moderate', label: 'Un bronceado moderado', score: 2 },
      { value: 'easy', label: 'Me bronceo con facilidad', score: 3 },
      { value: 'deep', label: 'Me pongo muy moreno/a', score: 4 },
    ],
  },
  {
    id: 'tan_speed',
    section: 'reaction',
    prompt: '¿Te empiezas a poner moreno/a a las pocas horas de tomar el sol?',
    options: [
      { value: 'never', label: 'Nunca', score: 0 },
      { value: 'seldom', label: 'Rara vez', score: 1 },
      { value: 'sometimes', label: 'A veces', score: 2 },
      { value: 'often', label: 'A menudo', score: 3 },
      { value: 'always', label: 'Siempre', score: 4 },
    ],
  },
  {
    id: 'face_reaction',
    section: 'reaction',
    prompt: '¿Cómo reacciona la piel de tu cara al sol?',
    options: [
      { value: 'very_sensitive', label: 'Muy sensible: se irrita o enrojece enseguida', score: 0 },
      { value: 'sensitive', label: 'Sensible', score: 1 },
      { value: 'normal', label: 'Normal', score: 2 },
      { value: 'resistant', label: 'Resistente', score: 3 },
      { value: 'never_problem', label: 'Nunca he notado problemas', score: 4 },
    ],
  },

  // ── Domain 3: tanning habits / current status ───────────────────────────────
  {
    id: 'last_exposure',
    section: 'habits',
    prompt: '¿Cuándo expusiste por última vez tu cuerpo al sol o a una cabina de bronceado?',
    options: [
      { value: 'gt_3m', label: 'Hace más de 3 meses', score: 0 },
      { value: '2_3m', label: 'Hace 2–3 meses', score: 1 },
      { value: '1_2m', label: 'Hace 1–2 meses', score: 2 },
      { value: 'lt_1m', label: 'Hace menos de un mes', score: 3 },
      { value: 'lt_2w', label: 'Hace menos de 2 semanas', score: 4 },
    ],
  },
  {
    id: 'area_frequency',
    section: 'habits',
    prompt: '¿Con qué frecuencia expones al sol la zona que quieres cuidar (cara, cuerpo)?',
    options: [
      { value: 'never', label: 'Nunca', score: 0 },
      { value: 'hardly', label: 'Casi nunca', score: 1 },
      { value: 'sometimes', label: 'A veces', score: 2 },
      { value: 'often', label: 'A menudo', score: 3 },
      { value: 'always', label: 'Siempre', score: 4 },
    ],
  },
]

/** All question ids, in order. Used to validate completeness of an answer set. */
export const FITZPATRICK_QUESTION_IDS: string[] = FITZPATRICK_QUESTIONS.map((q) => q.id)
