import fetch from "cross-fetch";
import { Address } from "viem";
import { ProviderAdapter, ContractInfo } from "./types";
import { readEip1967, readAccessControl } from "./ozIntrospection";

function chainToExplorer(chainId: string): { url: string; key?: string } {
  const id = Number(chainId.replace("eip155:", ""));
  const keys: Record<number, { url: string; key?: string }> = {
    1: { url: "https://api.etherscan.io/api", key: process.env.ETHERSCAN_KEY },
    42161: { url: "https://api.arbiscan.io/api", key: process.env.ARBISCAN_KEY },
    10: { url: "https://api-optimistic.etherscan.io/api", key: process.env.OPTIMISTIC_ETHERSCAN_KEY },
    8453: { url: "https://api.basescan.org/api", key: process.env.BASESCAN_KEY },
    137: { url: "https://api.polygonscan.com/api", key: process.env.POLYGONSCAN_KEY },
  };
  return keys[id] || { url: "" };
}

export async function getAbiFromExplorer(chainId: number, address: Address) {
  const cfg = chainToExplorer(`eip155:${chainId}`);
  if (!cfg.url) return null;
  const url = `${cfg.url}?module=contract&action=getabi&address=${address}${cfg.key ? `&apikey=${cfg.key}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const body = await res.json();
  if (body.status === "1" && body.result && body.result !== "Contract source code not verified") {
    return JSON.parse(body.result);
  }
  return null;
}

export const etherscanFamilyAdapter: ProviderAdapter = {
  name: "etherscan",
  async getContractInfo(chainId, address) {
    const chainIdNum = Number(chainId.replace("eip155:", ""));
    const [eip1967, access, abi] = await Promise.all([
      readEip1967(chainIdNum, address as Address),
      readAccessControl(chainIdNum, address as Address),
      getAbiFromExplorer(chainIdNum, address as Address),
    ]);
    const info: ContractInfo = {
      address,
      verified: !!abi,
      upgradeable: eip1967.isProxy,
      proxyType: eip1967.isProxy ? "EIP-1967" : undefined,
      implementation: eip1967.implementation || undefined,
      proxyAdmin: eip1967.admin || undefined,
      owner: undefined,
      roles: [
        ...access.defaultAdmins.map(a => ({ name: "DEFAULT_ADMIN_ROLE", holder: a })),
        ...access.pausers.map(a => ({ name: "PAUSER_ROLE", holder: a })),
      ],
      pausable: access.pausers.length > 0 || access.paused === true,
      timelock: undefined,
      asOfBlock: 0,
    };
    return info;
  },
};

