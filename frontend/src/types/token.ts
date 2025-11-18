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
  // Market data (contextual research information)
  marketData?: {
    launch?: {
      date?: number;
      marketCapUsd?: number;
      priceUsd?: number;
      source?: string;
      sourceUrl?: string;
    };
    current?: {
      marketCapUsd?: number;
      priceUsd?: number;
      volume24hUsd?: number;
      source?: string;
      sourceUrl?: string;
      updatedAt?: number;
    };
  };
  // Cross-validation info
  crossValidation?: {
    sources?: string[];
    status?: string;
  };
  // Contract security information
  contract?: {
    verified: boolean;
    upgradeable: boolean;
    proxyType?: string;
    implementation?: string;
    proxyAdmin?: string;
    owner?: string;
    roles: Array<{ name: string; holder: string }>;
    pausable: boolean;
    timelock?: { address: string; delaySec: number };
    asOfBlock: number;
  };
  // Detailed holders information
  holdersDetail?: {
    totalSupply: string;
    freeFloat: string;
    topHolders: Array<{ address: string; pct: number; label?: string }>;
    top10Pct: number;
    top1Pct?: number;
    top3Pct?: number;
    contractSharePct?: number;
    eoaSharePct?: number;
    coveragePct?: number;
    sampleSize?: number;
    asOfBlock: number;
  };
  // Detailed liquidity information
  liquidityDetail?: {
    pools: Array<{ dex: string; poolAddress: string; tvlUsd: number; sharePct: number }>;
    cexSharePct?: number;
    asOfBlock: number;
  };
  // Detailed governance information
  governanceDetail?: {
    framework?: string;
    quorumPct?: number;
    turnoutHistory: Array<{ proposalId: string; turnoutPct: number; ts: number }>;
  };
  // Audit information
  audits?: Array<{
    firm: string;
    reportUrl: string;
    date: number;
    severitySummary?: string;
  }>;
};

