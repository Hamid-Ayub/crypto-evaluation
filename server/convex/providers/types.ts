export type ContractInfo = {
  address: string;
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

export type HoldersSnapshot = {
  asOfBlock: number;
  totalSupply: string;
  freeFloat: string;
  topHolders: Array<{ address: string; pct: number; label?: string }>;
  top10Pct: number;
  hhi: number;
  nakamotoCoeff: number;
  top1Pct: number;
  top3Pct: number;
  gini: number;
  contractSharePct: number;
  eoaSharePct: number;
  coveragePct: number;
  sampleSize: number;
  source: string;
  // Token metadata from provider
  symbol?: string;
  name?: string;
  decimals?: number;
  iconUrl?: string;
};

export type LiquidityInfo = {
  asOfBlock: number;
  pools: Array<{ dex: string; poolAddress: string; tvlUsd: number; sharePct: number }>;
  cexSharePct?: number;
};

export type GovernanceInfo = {
  framework?: string;
  quorumPct?: number;
  turnoutHistory: Array<{ proposalId: string; turnoutPct: number; ts: number }>;
};

export type ChainStats = {
  validators?: number;
  topValidatorsPct?: number;
  nakamotoCoeff?: number;
};

export type AssetDataBundle = {
  contract?: ContractInfo;
  holders?: HoldersSnapshot;
  liquidity?: LiquidityInfo;
  governance?: GovernanceInfo;
  chainStats?: ChainStats;
  audits?: Array<{ firm: string; reportUrl: string; date: number; severitySummary?: string }>;
}

export interface ProviderAdapter {
  name: string;
  getContractInfo?(chainId: string, address: string): Promise<ContractInfo>;
  getHoldersSnapshot?(chainId: string, address: string): Promise<HoldersSnapshot>;
  getLiquidityInfo?(chainId: string, address: string): Promise<LiquidityInfo>;
  getGovernanceInfo?(chainId: string, address: string): Promise<GovernanceInfo>;
  getChainStats?(chainId: string): Promise<ChainStats>;
  getAudits?(chainId: string, address: string): Promise<AssetDataBundle["audits"]>;
}

