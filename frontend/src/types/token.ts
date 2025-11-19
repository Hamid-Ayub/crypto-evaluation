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

export type ExchangeListing = {
  exchange: string;
  pair: string;
  baseSymbol: string;
  targetSymbol: string;
  priceUsd?: number;
  volume24hUsd?: number;
  trustScore?: string;
  isDex?: boolean;
  lastTradedAt?: number;
  url?: string;
  source?: string;
  sourceUrl?: string;
};

export type ProjectProfile = {
  githubRepos?: string[];
  website?: string;
  docs?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
};

export type DevelopmentRepo = {
  repo: string;
  repoUrl: string;
  owner: string;
  name: string;
  description?: string;
  homepage?: string;
  license?: string;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  subscribers?: number;
  defaultBranch?: string;
  primaryLanguage?: string;
  topics?: string[];
  commitsLast4Weeks?: number;
  commitsThisYear?: number;
  avgWeeklyCommits?: number;
  contributorsCount?: number;
  lastCommitAt?: number;
  lastReleaseAt?: number;
  lastReleaseTag?: string;
  fetchedAt: number;
  source?: string;
  error?: string;
};

export type DevelopmentOverview = {
  repos: DevelopmentRepo[];
};

export type AiSectionSource = {
  id: number;
  title?: string;
  url: string;
  snippet?: string;
};

export type AiSectionEntry = {
  sectionId: string;
  content: string;
  model: string;
  tokensUsed?: number;
  updatedAt: number;
  sources?: AiSectionSource[];
};

export type AiReportStructure = {
  executive_summary: {
    verdict: "Bullish" | "Bearish" | "Neutral" | "High Risk";
    one_liner: string;
    key_strengths: string[];
    key_weaknesses: string[];
  };
  decentralization_analysis: {
    owner_influence: string;
    governance_health: string;
    centralization_vectors: string[];
  };
  market_intelligence: {
    catalysts: string[];
    competitor_comparison: string;
    liquidity_commentary: string;
  };
  security_audit: {
    contract_risks: string[];
    audit_coverage: string;
  };
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
  priceUsd: number;
  priceChange24h?: number;
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
    listings?: ExchangeListing[];
  };
  projectProfile?: ProjectProfile;
  development?: DevelopmentOverview;
  aiSections?: Record<string, AiSectionEntry>;
  aiReport?: {
    report: AiReportStructure;
    summary?: string;
    sources?: AiSectionSource[];
    updatedAt: number;
  };
  parsedProjectData?: {
    foundingTeam?: any;
    roadmap?: any;
    links?: any;
    tokenomics?: any;
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

