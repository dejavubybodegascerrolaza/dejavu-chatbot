import { FITZPATRICK_QUESTIONS, FITZPATRICK_QUESTION_IDS } from './fitzpatrick.questions'
import {
  computeFitzpatrick,
  isComplete,
  scoreToSkinType,
  FITZPATRICK_MAX_SCORE,
  FITZPATRICK_MIN_SCORE,
} from './fitzpatrick.scoring'
import type { FitzpatrickAnswers, FitzpatrickScore } from './fitzpatrick.types'

/** Builds an answer set where every question is given the same score. */
function uniformAnswers(score: FitzpatrickScore): FitzpatrickAnswers {
  return FITZPATRICK_QUESTION_IDS.reduce<FitzpatrickAnswers>((acc, id) => {
    acc[id] = score
    return acc
  }, {})
}

/** Builds answers summing (as closely as possible) to a target total. */
function answersForTotal(target: number): FitzpatrickAnswers {
  const answers: FitzpatrickAnswers = {}
  let remaining = target
  for (const id of FITZPATRICK_QUESTION_IDS) {
    const value = Math.max(0, Math.min(4, remaining)) as FitzpatrickScore
    answers[id] = value
    remaining -= value
  }
  return answers
}

describe('fitzpatrick questions data', () => {
  it('has 10 questions across the three scientific domains', () => {
    expect(FITZPATRICK_QUESTIONS).toHaveLength(10)
    const sections = new Set(FITZPATRICK_QUESTIONS.map((q) => q.section))
    expect(sections).toEqual(new Set(['genetics', 'reaction', 'habits']))
  })

  it('every question has unique id and exactly five options scored 0–4', () => {
    expect(new Set(FITZPATRICK_QUESTION_IDS).size).toBe(FITZPATRICK_QUESTION_IDS.length)
    for (const q of FITZPATRICK_QUESTIONS) {
      expect(q.options).toHaveLength(5)
      expect(q.options.map((o) => o.score)).toEqual([0, 1, 2, 3, 4])
      expect(new Set(q.options.map((o) => o.value)).size).toBe(5)
    }
  })

  it('exposes the correct min and max achievable scores', () => {
    expect(FITZPATRICK_MIN_SCORE).toBe(0)
    expect(FITZPATRICK_MAX_SCORE).toBe(40)
  })
})

describe('scoreToSkinType', () => {
  it('maps each band boundary to the right phototype', () => {
    expect(scoreToSkinType(0)).toBe(1)
    expect(scoreToSkinType(6)).toBe(1)
    expect(scoreToSkinType(7)).toBe(2)
    expect(scoreToSkinType(13)).toBe(2)
    expect(scoreToSkinType(14)).toBe(3)
    expect(scoreToSkinType(20)).toBe(3)
    expect(scoreToSkinType(21)).toBe(4)
    expect(scoreToSkinType(27)).toBe(4)
    expect(scoreToSkinType(28)).toBe(5)
    expect(scoreToSkinType(34)).toBe(5)
    expect(scoreToSkinType(35)).toBe(6)
    expect(scoreToSkinType(40)).toBe(6)
  })

  it('clamps negative scores to the most sensitive phototype', () => {
    expect(scoreToSkinType(-5)).toBe(1)
  })

  it('caps very high scores at Type VI', () => {
    expect(scoreToSkinType(1000)).toBe(6)
  })
})

describe('isComplete', () => {
  it('is false when any question is unanswered', () => {
    const partial = uniformAnswers(2)
    delete partial[FITZPATRICK_QUESTION_IDS[0] as string]
    expect(isComplete(partial)).toBe(false)
  })

  it('is true when every question is answered', () => {
    expect(isComplete(uniformAnswers(2))).toBe(true)
  })

  it('is false for an empty answer set', () => {
    expect(isComplete({})).toBe(false)
  })
})

describe('computeFitzpatrick', () => {
  it('sums all answers and returns the matching phototype', () => {
    // All zeros → most sensitive end.
    expect(computeFitzpatrick(uniformAnswers(0))).toEqual({ totalScore: 0, skinType: 1 })
    // All fours → 40 → Type VI.
    expect(computeFitzpatrick(uniformAnswers(4))).toEqual({ totalScore: 40, skinType: 6 })
    // All twos → 20 → Type III (upper boundary of the band).
    expect(computeFitzpatrick(uniformAnswers(2))).toEqual({ totalScore: 20, skinType: 3 })
  })

  it('classifies a mixed mid-range profile', () => {
    const answers = answersForTotal(24)
    const result = computeFitzpatrick(answers)
    expect(result.totalScore).toBe(24)
    expect(result.skinType).toBe(4)
  })

  it('throws when the questionnaire is incomplete', () => {
    expect(() => computeFitzpatrick({})).toThrow(/incomplete/i)
  })
})
