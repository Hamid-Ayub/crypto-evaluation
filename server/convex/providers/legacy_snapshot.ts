import { ProviderAdapter, GovernanceInfo } from "./types";
export const snapshotAdapter: ProviderAdapter = {
  name: "snapshot",
  async getGovernanceInfo(chainId, address) { return { framework: undefined, quorumPct: undefined, turnoutHistory: [] }; },
};

