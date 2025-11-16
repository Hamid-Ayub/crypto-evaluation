export type TokenCategory = "defi" | "l2" | "infrastructure" | "gaming" | "stablecoin";
export type RiskLevel = "low" | "medium" | "high";

export type BenchmarkDetails = {
  gini: number;
  hhi: number;
  nakamoto: number;
  liquidity: number;
  governance: number;
  ownership: number;
  controlRisk: number;
};

export type TokenRecord = {
  id: string;
  name: string;
  symbol: string;
  chain: string;
  chainLabel: string;
  address: string;
  avatar: string;
  category: TokenCategory;
  risk: RiskLevel;
  benchmarkScore: number;
  benchmarkDetails: BenchmarkDetails;
  marketCapUsd: number;
  liquidityUsd: number;
  holders: number;
  volume24hUsd: number;
  summary: string;
  updatedAt: string;
  tags: string[];
  sparkline: number[];
  stats: Array<{ label: string; value: string; delta: number }>;
};

