import fetch from "cross-fetch";
import { HoldersSnapshot } from "./types";
import { toNumericChainId } from "./chains";
import { gini as giniCoefficient } from "../_internal/math";

const COVALENT_BASE = process.env.COVALENT_API_URL ?? "https://api.covalenthq.com/v1";
const COVALENT_KEY = process.env.COVALENT_API_KEY ?? "";

// Covalent chain ID mapping (different from EIP-155)
const COVALENT_CHAIN_IDS: Record<number, string> = {
  1: "eth-mainnet",
  10: "optimism-mainnet",
  137: "matic-mainnet",
  42161: "arbitrum-mainnet",
  8453: "base-mainnet",
  43114: "avalanche-mainnet",
  56: "bsc-mainnet",
  250: "fantom-mainnet",
  100: "gnosis-mainnet",
};

type CovalentHolder = {
  address: string;
  balance: string;
  balance_quote?: number;
  total_supply?: string;
};

type CovalentTokenHoldersResponse = {
  data?: {
    items?: CovalentHolder[];
    pagination?: {
      has_more: boolean;
      page_number: number;
      page_size: number;
    };
  };
  error: boolean;
  error_message?: string;
  error_code?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function computeHHI(entries: Array<{ pct: number }>): number {
  return Number(entries.reduce((sum, h) => sum + Math.pow(h.pct, 2), 0).toFixed(2));
}

function computeTopPct(entries: Array<{ pct: number }>, count: number): number {
  if (count <= 0) return 0;
  return Number(entries.slice(0, count).reduce((sum, h) => sum + h.pct, 0).toFixed(2));
}

function computeNakamoto(entries: Array<{ pct: number }>): number {
  let cumulative = 0;
  for (let i = 0; i < entries.length; i++) {
    cumulative += entries[i].pct;
    if (cumulative >= 50) return i + 1;
  }
  return entries.length === 0 ? 0 : entries.length;
}

function computeGini(entries: Array<{ pct: number }>): number {
  const values = entries.map(h => Math.max(0, h.pct) / 100);
  const coefficient = giniCoefficient(values);
  return Number(coefficient.toFixed(4));
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`covalent-${res.status}`);
  const body = await res.json();
  if (body?.error) throw new Error(body.error_message ?? "covalent-error");
  return body;
}

/**
 * Fetch token holders from Covalent API (multi-chain support)
 * @param chainId EIP-155 chain ID (e.g., "eip155:1" or 1)
 * @param address Token contract address
 * @param maxHolders Maximum number of holders to fetch (default: 25)
 */
export async function fetchHoldersFromCovalent(
  chainId: string | number,
  address: string,
  maxHolders: number = 25
): Promise<HoldersSnapshot | null> {
  if (!COVALENT_KEY) {
    throw new Error("COVALENT_API_KEY not configured");
  }

  const numericChain = toNumericChainId(chainId);
  const covalentChainId = COVALENT_CHAIN_IDS[numericChain];
  
  if (!covalentChainId) {
    // Chain not supported by Covalent
    return null;
  }

  try {
    // Fetch token holders from Covalent
    // Endpoint: GET /v1/{chain_id}/tokens/{contract_address}/token_holders/
    const url = `${COVALENT_BASE}/${covalentChainId}/tokens/${address.toLowerCase()}/token_holders/`;
    const params = new URLSearchParams({
      "key": COVALENT_KEY,
      "page-size": maxHolders.toString(),
      "page-number": "0",
    });
    
    const response = await fetchJson<CovalentTokenHoldersResponse>(`${url}?${params.toString()}`);
    
    if (!response.data?.items || response.data.items.length === 0) {
      return null;
    }

    const holders = response.data.items;
    
    // Calculate total supply from holders (sum of balances)
    const totalSupplyRaw = holders.reduce((sum, h) => {
      try {
        return sum + BigInt(h.balance || "0");
      } catch {
        return sum;
      }
    }, BigInt(0));

    if (totalSupplyRaw === BigInt(0)) {
      return null;
    }

    // Convert balances to percentages
    const holdersWithPct = holders
      .map(h => {
        try {
          const balance = BigInt(h.balance || "0");
          const pct = totalSupplyRaw > 0 
            ? Number((balance * BigInt(10000) / totalSupplyRaw)) / 100 
            : 0;
          return {
            address: h.address,
            pct: clamp(pct, 0, 100),
            balance: h.balance,
          };
        } catch {
          return null;
        }
      })
      .filter((h): h is { address: string; pct: number; balance: string } => h !== null)
      .sort((a, b) => b.pct - a.pct);

    // Calculate metrics
    const top10Pct = computeTopPct(holdersWithPct, 10);
    const top1Pct = computeTopPct(holdersWithPct, 1);
    const top3Pct = computeTopPct(holdersWithPct, 3);
    const hhi = computeHHI(holdersWithPct);
    const nakamotoCoeff = computeNakamoto(holdersWithPct);
    const gini = computeGini(holdersWithPct);

    // Coverage is sum of all holder percentages (may be < 100% if not all holders fetched)
    const coveragePct = clamp(
      holdersWithPct.reduce((sum, h) => sum + h.pct, 0),
      0,
      100
    );

    // For Covalent, we don't have contract vs EOA distinction in this endpoint
    // Could be enhanced with additional API calls if needed
    const contractSharePct = 0; // Unknown from this endpoint
    const eoaSharePct = coveragePct;

    const freeFloat = scaleFreeFloat(totalSupplyRaw, top10Pct);

    return {
      asOfBlock: Math.floor(Date.now() / 1000),
      totalSupply: totalSupplyRaw.toString(),
      freeFloat,
      topHolders: holdersWithPct.slice(0, 15).map(h => ({
        address: h.address,
        pct: h.pct,
      })),
      top10Pct,
      hhi,
      nakamotoCoeff,
      top1Pct,
      top3Pct,
      gini,
      contractSharePct,
      eoaSharePct,
      coveragePct,
      sampleSize: holdersWithPct.length,
      source: "covalent",
    };
  } catch (error) {
    console.error(`Covalent API error for chain ${numericChain}, address ${address}:`, error);
    return null;
  }
}

function scaleFreeFloat(totalSupply: bigint, top10Pct: number): string {
  const scaledPct = clamp(Math.round(top10Pct * 100), 0, 10000);
  const remainderPct = 10000 - scaledPct;
  const amount = (totalSupply * BigInt(remainderPct)) / BigInt(10000);
  return amount.toString();
}

