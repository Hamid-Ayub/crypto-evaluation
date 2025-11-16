import fetch from "cross-fetch";
import { gini as giniCoefficient } from "../_internal/math";
import { HoldersSnapshot } from "./types";
import { toNumericChainId } from "./chains";

const ETHPLORER_BASE = process.env.ETHPLORER_URL ?? "https://api.ethplorer.io";
const ETHPLORER_KEY = process.env.ETHPLORER_KEY ?? "freekey";
const MAX_HOLDERS = Number(process.env.HOLDER_SAMPLE_SIZE ?? 25) || 25;

type EthplorerHolder = { address: string; share: number; type?: number | string };
type EthplorerTokenInfo = { 
  totalSupply?: string; 
  decimals?: string | number;
  symbol?: string;
  name?: string;
  image?: string;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ethplorer-${res.status}`);
  const body = await res.json();
  if (body?.error) throw new Error(body.error?.message ?? "ethplorer-error");
  return body;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function computeHHI(entries: EthplorerHolder[]): number {
  return Number(entries.reduce((sum, h) => sum + Math.pow(h.share, 2), 0).toFixed(2));
}

function computeTopPct(entries: EthplorerHolder[], count: number): number {
  if (count <= 0) return 0;
  return Number(entries.slice(0, count).reduce((sum, h) => sum + h.share, 0).toFixed(2));
}

function computeTop10Pct(entries: EthplorerHolder[]): number {
  return computeTopPct(entries, 10);
}

function computeNakamoto(entries: EthplorerHolder[]): number {
  let cumulative = 0;
  for (let i = 0; i < entries.length; i++) {
    cumulative += entries[i].share;
    if (cumulative >= 50) return i + 1;
  }
  return entries.length === 0 ? 0 : entries.length;
}

function computeGini(entries: EthplorerHolder[]): number {
  const values = entries.map(h => Math.max(0, h.share) / 100);
  const coefficient = giniCoefficient(values);
  return Number(coefficient.toFixed(4));
}

function holderIsContract(holder: EthplorerHolder): boolean {
  if (holder.type === "contract") return true;
  if (holder.type === "address") return false;
  return holder.type === 1;
}

function computeComposition(entries: EthplorerHolder[]) {
  let contractShare = 0;
  let coverage = 0;
  for (const holder of entries) {
    const pct = holder.share ?? 0;
    coverage += pct;
    if (holderIsContract(holder)) {
      contractShare += pct;
    }
  }
  const coveragePct = Number(clamp(coverage, 0, 100).toFixed(2));
  const contractSharePct = Number(clamp(contractShare, 0, 100).toFixed(2));
  const eoaSharePct = Number(clamp(coveragePct - contractSharePct, 0, 100).toFixed(2));
  return { coveragePct, contractSharePct, eoaSharePct };
}

function scaleFreeFloat(totalSupply: bigint, freeFloatPct: number): string {
  const scaledPct = clamp(Math.round(freeFloatPct * 100), 0, 10000);
  const remainderPct = 10000 - scaledPct;
  const amount = (totalSupply * BigInt(remainderPct)) / BigInt(10000);
  return amount.toString();
}

export async function fetchHoldersSnapshot(chainId: string, address: string): Promise<HoldersSnapshot> {
  const numericChain = toNumericChainId(chainId);
  if (numericChain !== 1) throw new Error("holder-snapshot-only-mainnet");

  const tokenInfo = await fetchJson<EthplorerTokenInfo>(`${ETHPLORER_BASE}/getTokenInfo/${address}?apiKey=${ETHPLORER_KEY}`);
  const holderResp = await fetchJson<{ holders?: EthplorerHolder[] }>(`${ETHPLORER_BASE}/getTopTokenHolders/${address}?apiKey=${ETHPLORER_KEY}&limit=${MAX_HOLDERS}`);
  const holderList = [...(holderResp.holders ?? [])].sort((a, b) => b.share - a.share);

  const holders = holderList.map(h => ({ address: h.address, pct: h.share }));
  const totalSupplyRaw = BigInt(tokenInfo.totalSupply ?? "0");
  const top10Pct = computeTop10Pct(holderList);
  const hhi = computeHHI(holderList);
  const nakamotoCoeff = computeNakamoto(holderList);
  const top1Pct = computeTopPct(holderList, 1);
  const top3Pct = computeTopPct(holderList, 3);
  const gini = computeGini(holderList);
  const { coveragePct, contractSharePct, eoaSharePct } = computeComposition(holderList);
  const freeFloat = scaleFreeFloat(totalSupplyRaw, top10Pct);

  return {
    asOfBlock: Math.floor(Date.now() / 1000),
    totalSupply: totalSupplyRaw.toString(),
    freeFloat,
    topHolders: holders.slice(0, 15),
    top10Pct,
    hhi,
    nakamotoCoeff,
    top1Pct,
    top3Pct,
    gini,
    contractSharePct,
    eoaSharePct,
    coveragePct,
    sampleSize: holderList.length,
    source: "ethplorer",
    // Token metadata from Ethplorer
    symbol: tokenInfo.symbol,
    name: tokenInfo.name,
    decimals: typeof tokenInfo.decimals === 'number' ? tokenInfo.decimals : (tokenInfo.decimals ? parseInt(tokenInfo.decimals) : undefined),
    iconUrl: tokenInfo.image,
  };
}

