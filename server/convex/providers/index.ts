import { Address } from "viem";
import { readEip1967, readAccessControl, computeControlRisk } from "./ozIntrospection";
import { dexCexSplit } from "./defillama";
import { collectGovernanceEvidence } from "./governance";

export async function analyzeContract(chainId: number, address: Address) {
  const [eip1967, access] = await Promise.all([ readEip1967(chainId, address), readAccessControl(chainId, address) ]);
  const controlRisk = computeControlRisk(eip1967, access);
  return { eip1967, access, controlRisk };
}

export async function liquidityForToken(chainName: string, tokenAddress: string) {
  return dexCexSplit(chainName, tokenAddress);
}

export async function governanceForToken(chainId: number, tokenAddress: string) {
  return collectGovernanceEvidence(chainId, tokenAddress);
}

