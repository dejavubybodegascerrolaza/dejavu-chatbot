import type { SkinType } from '../profile.types'

// Plain-language, non-diagnostic descriptions of how each Fitzpatrick phototype
// typically behaves under UV. Shown on the result screen so the user understands
// what their result means and feels confident the app "gets" their skin.
export type FitzpatrickTypeSummary = {
  /** Roman numeral + short name, e.g. "Tipo II · Piel clara". */
  title: string
  /** One-line headline of the type's sun behaviour. */
  headline: string
  /** Two short, neutral sentences with a bit more detail. */
  detail: string
}

export const FITZPATRICK_TYPE_SUMMARY: Record<SkinType, FitzpatrickTypeSummary> = {
  1: {
    title: 'Tipo I · Piel muy clara',
    headline: 'Se quema siempre y prácticamente no se broncea.',
    detail:
      'Es la piel más sensible al sol, a menudo con pecas y ojos y pelo claros. Conviene una protección muy alta y exposiciones muy cortas.',
  },
  2: {
    title: 'Tipo II · Piel clara',
    headline: 'Se quema con facilidad y se broncea poco.',
    detail:
      'Tolera mal las exposiciones largas. El bronceado, cuando aparece, es ligero. La prudencia y una protección alta marcan la diferencia.',
  },
  3: {
    title: 'Tipo III · Piel intermedia',
    headline: 'Se puede quemar, pero se broncea de forma gradual.',
    detail:
      'Es un fototipo frecuente. Responde bien a una exposición progresiva y constante, siempre con protección adecuada.',
  },
  4: {
    title: 'Tipo IV · Piel morena clara',
    headline: 'Se quema poco y se broncea con facilidad.',
    detail:
      'Tolera mejor el sol que los fototipos claros, pero no es inmune: el exceso sigue pasando factura a medio plazo.',
  },
  5: {
    title: 'Tipo V · Piel morena',
    headline: 'Rara vez se quema y se broncea de forma intensa.',
    detail:
      'Tiene una protección natural alta. Aun así, la hidratación y una protección razonable siguen siendo recomendables.',
  },
  6: {
    title: 'Tipo VI · Piel muy oscura',
    headline: 'Casi nunca se quema; piel profundamente pigmentada.',
    detail:
      'Es el fototipo con mayor protección natural frente a la quemadura. Cuidar la piel y la vista al sol sigue siendo buena idea.',
  },
}
