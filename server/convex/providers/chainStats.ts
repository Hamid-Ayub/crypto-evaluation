import { ChainStats } from "./types";
import { toNumericChainId } from "./chains";

const DEFAULT_CHAIN_STATS: ChainStats = { nakamotoCoeff: 2 };

const CHAIN_STATS: Record<number, ChainStats> = {
  1: { validators: 1050000, topValidatorsPct: 11, nakamotoCoeff: 12 },
  137: { validators: 105, topValidatorsPct: 35, nakamotoCoeff: 4 },
  42161: { validators: 1, topValidatorsPct: 100, nakamotoCoeff: 1 },
  10: { validators: 1, topValidatorsPct: 100, nakamotoCoeff: 1 },
  8453: { validators: 1, topValidatorsPct: 100, nakamotoCoeff: 1 },
};

export function loadChainStats(chainId: string | number): ChainStats {
  const numeric = toNumericChainId(chainId);
  return CHAIN_STATS[numeric] ?? DEFAULT_CHAIN_STATS;
}



