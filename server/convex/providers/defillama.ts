import fetch from "cross-fetch";
import { LiquidityInfo } from "./types";
import { llamaChainName } from "./chains";

export type LlamaPool = {
  pool: string; chain: string; project: string; symbol: string;
  tvlUsd: number; apy?: number; underlyingTokens?: string[]; url?: string;
};

const YIELDS_URL = "https://yields.llama.fi/pools";

export async function findPoolsByToken(chainName: string, tokenAddress: string) : Promise<LlamaPool[]> {
  const res = await fetch(YIELDS_URL);
  if (!res.ok) throw new Error(`DefiLlama pools error ${res.status}`);
  const body = await res.json();
  const pools: LlamaPool[] = (body?.data || body) as LlamaPool[];
  const addr = tokenAddress.toLowerCase();
  const filtered = pools.filter(p => (p.chain?.toLowerCase() === chainName.toLowerCase()) &&
    (p.underlyingTokens || []).some(t => t?.toLowerCase() === addr)
  );
  return filtered.sort((a,b) => (b.tvlUsd||0) - (a.tvlUsd||0));
}

export type LiquiditySplit = { dexUsd: number; cexUsd: number; totalUsd: number; dexPct: number; cexPct: number; };

export async function dexCexSplit(chainName: string, tokenAddress: string) {
  const pools = await findPoolsByToken(chainName, tokenAddress);
  const dexUsd = pools.reduce((s,p)=> s + (p.tvlUsd||0), 0);
  const cexUsd = 0;
  const totalUsd = dexUsd + cexUsd;
  const dexPct = totalUsd > 0 ? dexUsd / totalUsd : 0;
  const cexPct = totalUsd > 0 ? cexUsd / totalUsd : 0;
  return { pools, split: { dexUsd, cexUsd, totalUsd, dexPct, cexPct } };
}

export async function buildLiquiditySnapshot(chainId: string | number, tokenAddress: string): Promise<LiquidityInfo> {
  const chainName = llamaChainName(chainId);
  const { pools, split } = await dexCexSplit(chainName, tokenAddress);
  const totalDexUsd = split.dexUsd || 0;

  const summarizedPools = pools.slice(0, 25).map(p => {
    const sharePct = totalDexUsd > 0 ? (p.tvlUsd || 0) / totalDexUsd * 100 : 0;
    return {
      dex: p.project || p.chain || "dex",
      poolAddress: p.pool,
      tvlUsd: p.tvlUsd || 0,
      sharePct: Number(sharePct.toFixed(2)),
    };
  });

  return {
    asOfBlock: Math.floor(Date.now() / 1000),
    pools: summarizedPools,
    cexSharePct: Number((split.cexPct * 100).toFixed(2)),
  };
}

