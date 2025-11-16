import { ProviderAdapter, HoldersSnapshot } from "./types";
export const covalentAdapter: ProviderAdapter = {
  name: "covalent",
  async getHoldersSnapshot(chainId, address) {
    const snapshot: HoldersSnapshot = {
      asOfBlock: Math.floor(Date.now()/1000),
      totalSupply: "0",
      freeFloat: "0",
      top10Pct: 50,
      hhi: 0.1,
      nakamotoCoeff: 2,
      top1Pct: 50,
      top3Pct: 50,
      gini: 1,
      contractSharePct: 50,
      eoaSharePct: 0,
      coveragePct: 50,
      sampleSize: 0,
      source: "covalent",
      topHolders: [],
    };
    return snapshot;
  },
};

