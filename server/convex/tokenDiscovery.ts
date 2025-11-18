import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import fetch from "cross-fetch";

// Note: In Convex actions, process.env is available
// Using same pattern as providers/coingecko.ts
// @ts-ignore - process.env is available in Convex actions
const COINGECKO_BASE = process.env.COINGECKO_API_URL ?? "https://api.coingecko.com/api/v3";
// @ts-ignore
const COINGECKO_KEY = process.env.COINGECKO_API_KEY ?? "";

// CoinGecko platform IDs mapped to our chain IDs
const PLATFORM_MAP: Record<string, { chainId: string; platformId: string }> = {
  ethereum: { chainId: "eip155:1", platformId: "ethereum" },
  arbitrum: { chainId: "eip155:42161", platformId: "arbitrum-one" },
  base: { chainId: "eip155:8453", platformId: "base" },
  polygon: { chainId: "eip155:137", platformId: "polygon-pos" },
  optimism: { chainId: "eip155:10", platformId: "optimistic-ethereum" },
};

type CoinGeckoMarketToken = {
  id: string;
  symbol: string;
  name: string;
  market_cap: number;
  market_cap_rank: number;
  current_price: number;
  total_volume: number;
  price_change_percentage_24h: number;
};

type CoinGeckoCoinDetail = {
  id: string;
  platforms: Record<string, string>; // platform -> address
};

type DiscoveredToken = {
  chainId: string;
  address: string;
  symbol?: string;
  name?: string;
  marketCapUsd?: number;
  volume24hUsd?: number;
  source: string;
};

/**
 * Fetch tokens from CoinGecko for a specific chain
 */
export const discoverTokensFromCoinGecko = internalAction({
  args: v.any(),
  handler: async (ctx, args: {
    chain: string;
    limit: number;
    minMarketCap?: number;
    minVolume?: number;
  }) => {
    const { chain, limit, minMarketCap = 100000, minVolume = 10000 } = args;

    const platformInfo = PLATFORM_MAP[chain];
    if (!platformInfo) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    const { chainId, platformId } = platformInfo;

    try {
      // Step 1: Fetch top tokens by market cap from CoinGecko
      // Note: /coins/markets doesn't include platform addresses, so we'll fetch a smaller set
      // and then get platform info for each
      const url = `${COINGECKO_BASE}/coins/markets`;
      const params = new URLSearchParams({
        vs_currency: "usd",
        order: "market_cap_desc",
        per_page: "50", // Fetch top 50, then filter by platform
        page: "1",
        sparkline: "false",
        price_change_percentage: "24h",
      });

      if (COINGECKO_KEY) {
        params.set("x_cg_demo_api_key", COINGECKO_KEY);
      }

      const response = await fetch(`${url}?${params.toString()}`);
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("coingecko-rate-limit");
        }
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }

      const marketTokens: CoinGeckoMarketToken[] = await response.json();

      // Step 2: Filter by market cap and volume first (to reduce API calls)
      const candidates = marketTokens
        .filter(t => (t.market_cap || 0) >= minMarketCap && (t.total_volume || 0) >= minVolume)
        .slice(0, limit * 3); // Get 3x limit to account for platform filtering

      // Step 3: Fetch platform info for candidate tokens
      const validTokens: DiscoveredToken[] = [];

      for (const token of candidates) {
        if (validTokens.length >= limit) break;

        try {
          // Fetch coin details to get platform addresses
          const detailUrl = `${COINGECKO_BASE}/coins/${token.id}`;
          const detailParams = new URLSearchParams({
            localization: "false",
            tickers: "false",
            market_data: "false",
            community_data: "false",
            developer_data: "false",
            sparkline: "false",
          });

          if (COINGECKO_KEY) {
            detailParams.set("x_cg_demo_api_key", COINGECKO_KEY);
          }

          const detailResponse = await fetch(`${detailUrl}?${detailParams.toString()}`);
          
          if (!detailResponse.ok) {
            // Skip if rate limited or not found
            if (detailResponse.status === 429) {
              throw new Error("coingecko-rate-limit");
            }
            continue; // Skip this token
          }

          const coinDetail: CoinGeckoCoinDetail = await detailResponse.json();
          const address = coinDetail.platforms?.[platformId];
          
          if (!address) continue; // Token not on this chain

          // Normalize address (CoinGecko sometimes returns checksummed)
          const normalizedAddress = address.toLowerCase();

          validTokens.push({
            chainId,
            address: normalizedAddress,
            symbol: token.symbol,
            name: token.name,
            marketCapUsd: token.market_cap || 0,
            volume24hUsd: token.total_volume || 0,
            source: "coingecko",
          });

          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error: any) {
          // Skip tokens that fail (rate limit, not found, etc.)
          if (error.message === "coingecko-rate-limit") {
            throw error; // Re-throw rate limit errors
          }
          continue;
        }
      }

      return {
        success: true,
        chain,
        discovered: validTokens.length,
        tokens: validTokens,
      };
    } catch (error: any) {
      console.error(`Token discovery error for ${chain}:`, error);
      return {
        success: false,
        chain,
        discovered: 0,
        tokens: [],
        error: error.message || "Unknown error",
      };
    }
  },
});

/**
 * Check which tokens already exist in the database
 */
export const filterExistingTokens = internalAction({
  args: v.any(),
  handler: async (ctx, args: { tokens: DiscoveredToken[] }): Promise<{
    total: number;
    existing: number;
    new: number;
    tokens: DiscoveredToken[];
  }> => {
    const tokens = args.tokens;
    const existingAssets = await ctx.runQuery(internal.assets.getExistingByChainAddress, {
      chainAddresses: tokens.map(t => ({
        chainId: t.chainId,
        address: t.address.toLowerCase(),
      })),
    });

    const existingSet = new Set(
      existingAssets.map(a => `${a.chainId}:${a.address.toLowerCase()}`)
    );

    const newTokens = tokens.filter(
      t => !existingSet.has(`${t.chainId}:${t.address.toLowerCase()}`)
    );

    return {
      total: tokens.length,
      existing: tokens.length - newTokens.length,
      new: newTokens.length,
      tokens: newTokens,
    };
  },
});

