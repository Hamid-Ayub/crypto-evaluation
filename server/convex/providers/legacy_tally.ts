import { ProviderAdapter, GovernanceInfo } from "./types";
export const tallyAdapter: ProviderAdapter = {
  name: "tally",
  async getGovernanceInfo(chainId, address) { return { framework: undefined, quorumPct: undefined, turnoutHistory: [] }; },
};

