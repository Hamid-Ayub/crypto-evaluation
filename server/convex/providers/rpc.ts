import fetch from "cross-fetch";
import { type Hex, Address, createPublicClient, http, getAddress } from "viem";
import { mainnet, arbitrum, optimism, polygon, base } from "viem/chains";

type ChainCfg = { viem: any; infuraSubdomain: string | null; alchemyEnv?: string; };
const CHAINS: Record<number, ChainCfg> = {
  1: { viem: mainnet, infuraSubdomain: "mainnet", alchemyEnv: "ALCHEMY_MAINNET_HTTP" },
  42161: { viem: arbitrum, infuraSubdomain: "arbitrum-mainnet", alchemyEnv: "ALCHEMY_ARBITRUM_HTTP" },
  10: { viem: optimism, infuraSubdomain: "optimism-mainnet", alchemyEnv: "ALCHEMY_OPTIMISM_HTTP" },
  137: { viem: polygon, infuraSubdomain: "polygon-mainnet", alchemyEnv: "ALCHEMY_POLYGON_HTTP" },
  8453: { viem: base, infuraSubdomain: "base-mainnet", alchemyEnv: "ALCHEMY_BASE_HTTP" },
};

function chainRpcUrl(chainId: number): string {
  const cfg = CHAINS[chainId];
  if (!cfg) throw new Error(`Unsupported chainId ${chainId}`);
  const infuraId = process.env.INFURA_PROJECT_ID;
  if (cfg.infuraSubdomain && infuraId) return `https://${cfg.infuraSubdomain}.infura.io/v3/${infuraId}`;
  if (cfg.alchemyEnv && process.env[cfg.alchemyEnv]) return String(process.env[cfg.alchemyEnv]);
  throw new Error(`No RPC configured for chain ${chainId}. Set INFURA_PROJECT_ID or ${cfg.alchemyEnv}.`);
}

export function makePublicClient(chainId: number) {
  const cfg = CHAINS[chainId];
  if (!cfg) throw new Error(`Unsupported chainId ${chainId}`);
  return createPublicClient({ chain: cfg.viem, transport: http(chainRpcUrl(chainId)) });
}

export async function getStorageAt(chainId: number, address: Address, slot: Hex): Promise<Hex> {
  const client = makePublicClient(chainId);
  return await client.getStorageAt({ address, slot: slot as any });
}

export async function getCode(chainId: number, address: Address): Promise<Hex> {
  const client = makePublicClient(chainId);
  return await client.getBytecode({ address }) as Hex;
}

export async function callRaw(chainId: number, address: Address, data: Hex): Promise<Hex> {
  const client = makePublicClient(chainId);
  const result = await client.call({ to: address, data: data as any });
  return (result.data || "0x") as Hex;
}

