import fetch from "cross-fetch";
import { HoldersSnapshot } from "./types";
import { toNumericChainId } from "./chains";
import { gini as giniCoefficient } from "../_internal/math";

// Etherscan family API configuration
const ETHERSCAN_APIS: Record<number, { url: string; key?: string }> = {
  1: { url: "https://api.etherscan.io/api", key: process.env.ETHERSCAN_KEY },
  42161: { url: "https://api.arbiscan.io/api", key: process.env.ARBISCAN_KEY },
  10: { url: "https://api-optimistic.etherscan.io/api", key: process.env.OPTIMISTIC_ETHERSCAN_KEY },
  8453: { url: "https://api.basescan.org/api", key: process.env.BASESCAN_KEY },
  137: { url: "https://api.polygonscan.com/api", key: process.env.POLYGONSCAN_KEY },
  56: { url: "https://api.bscscan.com/api", key: process.env.BSCSCAN_KEY },
  43114: { url: "https://api.snowtrace.io/api", key: process.env.SNOWTRACE_KEY },
  250: { url: "https://api.ftmscan.com/api", key: process.env.FTMSCAN_KEY },
  100: { url: "https://api.gnosisscan.io/api", key: process.env.GNOSISSCAN_KEY },
};

type EtherscanTokenHolderResponse = {
  status: string;
  message: string;
  result?: Array<{
    TokenHolderAddress: string;
    TokenHolderQuantity: string;
    TokenHolderQuantityNumber?: number;
  }>;
};

type EtherscanTokenInfoResponse = {
  status: string;
  message: string;
  result?: Array<{
    contractAddress: string;
    tokenName: string;
    symbol: string;
    divisor: string;
    tokenType: string;
    totalSupply: string;
    blueCheckmark: string;
    description: string;
    website: string;
    email: string;
    blog: string;
    reddit: string;
    slack: string;
    facebook: string;
    twitter: string;
    bitcointalk: string;
    github: string;
    telegram: string;
    wechat: string;
    linkedin: string;
    discord: string;
    whitepaper: string;
    tokenPriceUSD: string;
  }>;
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

function scaleFreeFloat(totalSupply: bigint, top10Pct: number): string {
  const scaledPct = clamp(Math.round(top10Pct * 100), 0, 10000);
  const remainderPct = 10000 - scaledPct;
  const amount = (totalSupply * BigInt(remainderPct)) / BigInt(10000);
  return amount.toString();
}

async function fetchEtherscanJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`etherscan-${res.status}`);
  const body = await res.json();
  if (body.status === "0" && body.message !== "OK") {
    throw new Error(body.message || "etherscan-error");
  }
  return body;
}

/**
 * Fetch token holders from Etherscan family APIs (multi-chain support)
 * @param chainId EIP-155 chain ID (e.g., "eip155:1" or 1)
 * @param address Token contract address
 * @param maxHolders Maximum number of holders to fetch (default: 25)
 */
export async function fetchHoldersFromEtherscan(
  chainId: string | number,
  address: string,
  maxHolders: number = 25
): Promise<HoldersSnapshot | null> {
  const numericChain = toNumericChainId(chainId);
  const apiConfig = ETHERSCAN_APIS[numericChain];
  
  if (!apiConfig) {
    // Chain not supported by Etherscan family
    return null;
  }

  try {
    // Fetch token holders from Etherscan
    // Endpoint: module=token&action=tokenholderlist
    const holderUrl = `${apiConfig.url}?module=token&action=tokenholderlist&contractaddress=${address.toLowerCase()}&page=1&offset=${maxHolders}${apiConfig.key ? `&apikey=${apiConfig.key}` : ""}`;
    
    const holderResponse = await fetchEtherscanJson<EtherscanTokenHolderResponse>(holderUrl);
    
    if (!holderResponse.result || holderResponse.result.length === 0) {
      return null;
    }

    const holders = holderResponse.result;
    
    // Fetch token info to get total supply and metadata
    let totalSupplyRaw = BigInt(0);
    let tokenName: string | undefined;
    let tokenSymbol: string | undefined;
    let decimals = 18; // Default
    
    try {
      const tokenInfoUrl = `${apiConfig.url}?module=token&action=tokeninfo&contractaddress=${address.toLowerCase()}${apiConfig.key ? `&apikey=${apiConfig.key}` : ""}`;
      const tokenInfoResponse = await fetchEtherscanJson<EtherscanTokenInfoResponse>(tokenInfoUrl);
      
      if (tokenInfoResponse.result && tokenInfoResponse.result.length > 0) {
        const tokenInfo = tokenInfoResponse.result[0];
        totalSupplyRaw = BigInt(tokenInfo.totalSupply || "0");
        tokenName = tokenInfo.tokenName;
        tokenSymbol = tokenInfo.symbol;
        // divisor is typically 10^decimals, so decimals = log10(divisor)
        if (tokenInfo.divisor) {
          const divisor = BigInt(tokenInfo.divisor);
          if (divisor > 0n) {
            decimals = divisor.toString().length - 1; // Approximate
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch token info from Etherscan for ${address}:`, error);
    }

    // If we couldn't get total supply from token info, calculate from holders
    if (totalSupplyRaw === BigInt(0)) {
      totalSupplyRaw = holders.reduce((sum, h) => {
        try {
          return sum + BigInt(h.TokenHolderQuantity || "0");
        } catch {
          return sum;
        }
      }, BigInt(0));
    }

    if (totalSupplyRaw === BigInt(0)) {
      return null;
    }

    // Convert balances to percentages
    const holdersWithPct = holders
      .map(h => {
        try {
          const balance = BigInt(h.TokenHolderQuantity || "0");
          const pct = totalSupplyRaw > 0 
            ? Number((balance * BigInt(10000) / totalSupplyRaw)) / 100 
            : 0;
          return {
            address: h.TokenHolderAddress,
            pct: clamp(pct, 0, 100),
            balance: h.TokenHolderQuantity,
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

    // Etherscan doesn't provide contract vs EOA distinction in this endpoint
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
      source: "etherscan",
      symbol: tokenSymbol,
      name: tokenName,
      decimals,
    };
  } catch (error) {
    console.error(`Etherscan API error for chain ${numericChain}, address ${address}:`, error);
    return null;
  }
}



