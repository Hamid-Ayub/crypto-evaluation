export type AiSectionLengthConfig = {
  minWords: number;
  targetWords: number;
  maxWords: number;
  maxTokens: number;
};

export type AiSectionId =
  | "executiveSummary"
  | "projectOverview"
  | "tokenFundamentals"
  | "tokenomics"
  | "technologyReview"
  | "marketAnalysis"
  | "reportConclusion"
  | "riskAnalysis"
  | "communityEcosystem";

export const AI_SECTION_LENGTHS: Record<AiSectionId, AiSectionLengthConfig> = {
  executiveSummary: {
    minWords: 120,
    targetWords: 150,
    maxWords: 180,
    // Account for ~400 thinking tokens + ~400 content tokens = 800 total
    maxTokens: 800,
  },
  projectOverview: {
    minWords: 150,
    targetWords: 180,
    maxWords: 220,
    // Account for ~500 thinking tokens + ~500 content tokens = 1000 total
    maxTokens: 1000,
  },
  tokenFundamentals: {
    minWords: 180,
    targetWords: 210,
    maxWords: 260,
    // Account for ~600 thinking tokens + ~600 content tokens = 1200 total
    maxTokens: 1200,
  },
  tokenomics: {
    minWords: 200,
    targetWords: 240,
    maxWords: 300,
    // Account for ~650 thinking tokens + ~650 content tokens = 1300 total
    maxTokens: 1300,
  },
  technologyReview: {
    minWords: 180,
    targetWords: 220,
    maxWords: 280,
    // Account for ~600 thinking tokens + ~600 content tokens = 1200 total
    maxTokens: 1200,
  },
  marketAnalysis: {
    minWords: 220,
    targetWords: 280,
    maxWords: 340,
    // Account for ~750 thinking tokens + ~750 content tokens = 1500 total
    maxTokens: 1500,
  },
  reportConclusion: {
    minWords: 200,
    targetWords: 240,
    maxWords: 300,
    // Account for ~650 thinking tokens + ~650 content tokens = 1300 total
    maxTokens: 1300,
  },
  riskAnalysis: {
    minWords: 220,
    targetWords: 260,
    maxWords: 320,
    // Account for ~700 thinking tokens + ~700 content tokens = 1400 total
    maxTokens: 1400,
  },
  communityEcosystem: {
    minWords: 180,
    targetWords: 220,
    maxWords: 260,
    // Account for ~600 thinking tokens + ~600 content tokens = 1200 total
    maxTokens: 1200,
  },
} as const;

