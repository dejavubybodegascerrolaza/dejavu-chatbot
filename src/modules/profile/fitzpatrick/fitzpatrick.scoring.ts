import type { SkinType } from '../profile.types'
import { FITZPATRICK_QUESTION_IDS } from './fitzpatrick.questions'
import type { FitzpatrickAnswers, FitzpatrickResult } from './fitzpatrick.types'

// Standard score → Fitzpatrick phototype banding for the 10-item self-test
// (total range 0–40). Boundaries follow the established clinical questionnaire.
//   0–6   → I     21–27 → IV
//   7–13  → II    28–34 → V
//   14–20 → III   35+   → VI
const SKIN_TYPE_BANDS: ReadonlyArray<{ max: number; skinType: SkinType }> = [
  { max: 6, skinType: 1 },
  { max: 13, skinType: 2 },
  { max: 20, skinType: 3 },
  { max: 27, skinType: 4 },
  { max: 34, skinType: 5 },
  { max: Infinity, skinType: 6 },
]

/** Lowest and highest achievable totals — exported for UI/progress and tests. */
export const FITZPATRICK_MIN_SCORE = 0
export const FITZPATRICK_MAX_SCORE = FITZPATRICK_QUESTION_IDS.length * 4

/** Maps a raw total score to a Fitzpatrick phototype (clamped to 0+). */
export function scoreToSkinType(totalScore: number): SkinType {
  const clamped = Math.max(0, totalScore)
  const band = SKIN_TYPE_BANDS.find((b) => clamped <= b.max)
  // The Infinity band guarantees a match; the fallback satisfies the type system.
  return band ? band.skinType : 6
}

/** True when every question of the instrument has been answered. */
export function isComplete(answers: FitzpatrickAnswers): boolean {
  return FITZPATRICK_QUESTION_IDS.every((id) => typeof answers[id] === 'number')
}

/**
 * Computes the Fitzpatrick result from a complete set of answers.
 * Throws if any question is unanswered — callers must gate on isComplete().
 */
export function computeFitzpatrick(answers: FitzpatrickAnswers): FitzpatrickResult {
  if (!isComplete(answers)) {
    throw new Error('Fitzpatrick: cannot score an incomplete questionnaire.')
  }
  const totalScore = FITZPATRICK_QUESTION_IDS.reduce((sum, id) => sum + (answers[id] ?? 0), 0)
  return { totalScore, skinType: scoreToSkinType(totalScore) }
}
