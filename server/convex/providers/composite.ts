import type { ProviderAdapter } from "./types";
import { etherscanFamilyAdapter } from "./legacy_etherscan";
import { fetchHoldersMultiSource } from "./holdersMultiSource";
import { buildLiquiditySnapshot } from "./defillama";
import { collectGovernanceEvidence, summarizeGovernance } from "./governance";
import { loadChainStats } from "./chainStats";
import { toNumericChainId } from "./chains";

export const compositeAdapter: ProviderAdapter = {
  name: "composite",
  async getContractInfo(chainId, address) { return etherscanFamilyAdapter.getContractInfo!(chainId, address); },
  async getHoldersSnapshot(chainId, address) { 
    // Use multi-source aggregation with cross-validation
    return fetchHoldersMultiSource(chainId, address); 
  },
  async getLiquidityInfo(chainId, address) { return buildLiquiditySnapshot(chainId, address); },
  async getGovernanceInfo(chainId, address) {
    const discovery = await collectGovernanceEvidence(toNumericChainId(chainId), address as string);
    return summarizeGovernance(discovery);
  },
  async getChainStats(chainId) { return loadChainStats(chainId); },
  async getAudits() { return []; },
};

