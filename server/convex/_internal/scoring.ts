import { SCORE_WEIGHTS } from "../config";
import { clamp } from "./math";

const SCORE_KEYS = [
  "ownership",
  "controlRisk",
  "liquidity",
  "governance",
  "chainLevel",
  "codeAssurance",
] as const;

export type ScoreKey = typeof SCORE_KEYS[number];

export type SubScores = Record<ScoreKey, number>;

export type ScoreWeights = Record<ScoreKey, number>;

export type ScoreConfidence = ScoreWeights;

export type ScoreOptions = {
  weights?: Partial<ScoreWeights>;
  confidence?: Partial<ScoreConfidence>;
};

const BASE_WEIGHTS: ScoreWeights = SCORE_KEYS.reduce((acc, key) => {
  const val = SCORE_WEIGHTS[key as keyof typeof SCORE_WEIGHTS] ?? 0;
  acc[key] = val;
  return acc;
}, {} as ScoreWeights);

export const FULL_CONFIDENCE: ScoreConfidence = SCORE_KEYS.reduce((acc, key) => {
  acc[key] = 1;
  return acc;
}, {} as ScoreConfidence);

export type TotalScoreResult = {
  total: number;
  weights: ScoreWeights;
};

export function totalScore(sub: SubScores, options: ScoreOptions = {}): TotalScoreResult {
  const rawWeights: ScoreWeights = { ...BASE_WEIGHTS, ...(options.weights ?? {}) };
  const confidence: ScoreConfidence = { ...FULL_CONFIDENCE, ...(options.confidence ?? {}) };

  const adjusted: ScoreWeights = {} as ScoreWeights;
  let adjustedSum = 0;
  for (const key of SCORE_KEYS) {
    const value = clamp(rawWeights[key] * clamp(confidence[key], 0, 1), 0, 1);
    adjusted[key] = value;
    adjustedSum += value;
  }

  if (adjustedSum <= 0) {
    for (const key of SCORE_KEYS) {
      adjusted[key] = rawWeights[key];
    }
    adjustedSum = SCORE_KEYS.reduce((sum, key) => sum + rawWeights[key], 0);
  }

  const normalized: ScoreWeights = {} as ScoreWeights;
  const sum = adjustedSum > 0 ? adjustedSum : 1;
  for (const key of SCORE_KEYS) {
    normalized[key] = Number((adjusted[key] / sum).toFixed(4));
  }

  let total = 0;
  for (const key of SCORE_KEYS) {
    total += sub[key] * normalized[key];
  }

  return { total: clamp(Number(total.toFixed(2))), weights: normalized };
}

