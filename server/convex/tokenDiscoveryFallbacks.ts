import fetch from "cross-fetch";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Chain ID to DeFiLlama chain name mapping
const DEFILLAMA_CHAIN_MAP: Record<string, string> = {
  "eip155:1": "ethereum",
  "eip155:42161": "arbitrum",
  "eip155:8453": "base",
  "eip155:137": "polygon",
  "eip155:10": "optimism",
};

// Chain ID to token list URLs
const TOKEN_LIST_URLS: Record<string, string[]> = {
  "eip155:1": [
    "https://tokens.uniswap.org", // Uniswap default list
    "https://raw.githubusercontent.com/1inch/1inch-token-list/master/src/tokens/ethereum.json", // 1inch
    "https://tokens.coingecko.com/uniswap/all.json", // CoinGecko token list
  ],
  "eip155:42161": [
    "https://token-list.s3.us-east-1.amazonaws.com/arbitrum.tokenlist.json", // Arbitrum official
  ],
  "eip155:8453": [
    "https://raw.githubusercontent.com/ethereum-optimism/ethereum-optimism.github.io/master/optimism.tokenlist.json", // Base uses similar format
  ],
  "eip155:137": [
    "https://unpkg.com/@1inch/token-lists@1.0.0/src/tokens/polygon.json", // 1inch Polygon
  ],
  "eip155:10": [
    "https://raw.githubusercontent.com/ethereum-optimism/ethereum-optimism.github.io/master/optimism.tokenlist.json", // Optimism official
  ],
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

type TokenListToken = {
  address: string;
  symbol?: string;
  name?: string;
  decimals?: number;
  logoURI?: string;
  chainId?: number;
};

type TokenList = {
  tokens?: TokenListToken[];
  name?: string;
  version?: any;
};

type DeFiLlamaPool = {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  underlyingTokens?: string[];
  apy?: number;
};

/**
 * Discover tokens from DeFiLlama pools (no API key required)
 * Extracts unique token addresses from top pools by TVL
 */
export const discoverTokensFromDeFiLlama = internalAction({
  args: {
    chainId: v.string(),
    limit: v.number(),
    minTvl: v.optional(v.number()), // Minimum TVL in USD (default: 10000)
  },
  handler: async (ctx, args) => {
    const { chainId, limit, minTvl = 10000 } = args;

    const chainName = DEFILLAMA_CHAIN_MAP[chainId];
    if (!chainName) {
      return {
        success: false,
        chainId,
        discovered: 0,
        tokens: [],
        error: `Unsupported chain: ${chainId}`,
      };
    }

    try {
      // Fetch all pools from DeFiLlama (public API, no key required)
      const response = await fetch("https://yields.llama.fi/pools");
      
      if (!response.ok) {
        return {
          success: false,
          chainId,
          discovered: 0,
          tokens: [],
          error: `DeFiLlama API error: ${response.status}`,
        };
      }

      const data = await response.json();
      const pools: DeFiLlamaPool[] = (data?.data || data) as DeFiLlamaPool[];

      // Filter pools by chain and minimum TVL
      const chainPools = pools
        .filter(p => 
          p.chain?.toLowerCase() === chainName.toLowerCase() &&
          (p.tvlUsd || 0) >= minTvl
        )
        .sort((a, b) => (b.tvlUsd || 0) - (a.tvlUsd || 0))
        .slice(0, limit * 5); // Get more pools to extract unique tokens

      // Extract unique token addresses
      const tokenMap = new Map<string, { tvl: number; symbol?: string }>();

      for (const pool of chainPools) {
        if (pool.underlyingTokens && pool.underlyingTokens.length > 0) {
          for (const tokenAddr of pool.underlyingTokens) {
            if (!tokenAddr) continue;
            
            const normalizedAddr = tokenAddr.toLowerCase();
            const existing = tokenMap.get(normalizedAddr);
            
            // Track highest TVL for each token
            if (!existing || pool.tvlUsd > existing.tvl) {
              tokenMap.set(normalizedAddr, {
                tvl: pool.tvlUsd || 0,
                symbol: pool.symbol,
              });
            }
          }
        }
      }

      // Convert to DiscoveredToken format, sorted by TVL
      const tokens: DiscoveredToken[] = Array.from(tokenMap.entries())
        .map(([address, data]) => ({
          chainId,
          address,
          symbol: data.symbol,
          source: "defillama",
          marketCapUsd: data.tvl * 10, // Rough estimate: market cap ~10x TVL
        }))
        .sort((a, b) => (b.marketCapUsd || 0) - (a.marketCapUsd || 0))
        .slice(0, limit);

      return {
        success: true,
        chainId,
        discovered: tokens.length,
        tokens,
      };
    } catch (error: any) {
      return {
        success: false,
        chainId,
        discovered: 0,
        tokens: [],
        error: error.message || "Unknown error",
      };
    }
  },
});

/**
 * Discover tokens from public token lists (no API key required)
 * Uses Uniswap, 1inch, and other public token lists
 */
export const discoverTokensFromTokenLists = internalAction({
  args: {
    chainId: v.string(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const { chainId, limit } = args;

    const urls = TOKEN_LIST_URLS[chainId];
    if (!urls || urls.length === 0) {
      return {
        success: false,
        chainId,
        discovered: 0,
        tokens: [],
        error: `No token lists available for chain: ${chainId}`,
      };
    }

    const tokenMap = new Map<string, TokenListToken>();

    // Try each token list URL
    for (const url of urls) {
      try {
        const response = await fetch(url, {
          headers: {
            "Accept": "application/json",
          },
        });

        if (!response.ok) continue;

        const data: TokenList | TokenListToken[] = await response.json();
        
        // Handle different list formats
        const tokens: TokenListToken[] = Array.isArray(data) 
          ? data 
          : (data.tokens || []);

        // Extract tokens for this chain
        const numericChainId = parseInt(chainId.replace("eip155:", ""));
        
        for (const token of tokens) {
          // Some lists have chainId in token, others don't (assume list is chain-specific)
          if (token.chainId && token.chainId !== numericChainId) continue;
          
          const normalizedAddr = token.address.toLowerCase();
          if (!tokenMap.has(normalizedAddr)) {
            tokenMap.set(normalizedAddr, token);
          }
        }
      } catch (error) {
        // Continue to next list if one fails
        console.warn(`Failed to fetch token list from ${url}:`, error);
        continue;
      }
    }

    // Convert to DiscoveredToken format
    const tokens: DiscoveredToken[] = Array.from(tokenMap.values())
      .slice(0, limit)
      .map(token => ({
        chainId,
        address: token.address.toLowerCase(),
        symbol: token.symbol,
        name: token.name,
        source: "token-list",
      }));

    return {
      success: true,
      chainId,
      discovered: tokens.length,
      tokens,
    };
  },
});

/**
 * Multi-source token discovery with fallbacks
 * Tries sources in order until it gets enough tokens
 */
export const discoverTokensMultiSource = internalAction({
  args: {
    chain: v.string(), // "ethereum", "arbitrum", etc.
    chainId: v.string(), // "eip155:1", etc.
    limit: v.number(),
    minMarketCap: v.optional(v.number()),
    minVolume: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { chain, chainId, limit, minMarketCap = 100000, minVolume = 10000 } = args;
    
    const allTokens: DiscoveredToken[] = [];
    const sources: string[] = [];

    // Try CoinGecko first (if available, works without key but rate limited)
    try {
      const result = await ctx.runAction(internal.tokenDiscovery.discoverTokensFromCoinGecko, {
        chain,
        limit: limit * 2, // Get more to account for filtering
        minMarketCap,
        minVolume,
      });

      if (result.success && result.tokens.length > 0) {
        allTokens.push(...result.tokens);
        sources.push("coingecko");
      }
    } catch (error: any) {
      console.warn("CoinGecko discovery failed, trying fallbacks:", error.message);
    }

    // Fallback 1: DeFiLlama pools (no API key required)
    if (allTokens.length < limit) {
      try {
        const result = await ctx.runAction(internal.tokenDiscoveryFallbacks.discoverTokensFromDeFiLlama, {
          chainId,
          limit: limit - allTokens.length,
          minTvl: minMarketCap / 10, // Rough conversion: TVL ~10% of market cap
        });

        if (result.success && result.tokens.length > 0) {
          // Filter out duplicates
          const existingAddrs = new Set(allTokens.map(t => t.address.toLowerCase()));
          const newTokens = result.tokens.filter(t => !existingAddrs.has(t.address.toLowerCase()));
          allTokens.push(...newTokens);
          sources.push("defillama");
        }
      } catch (error: any) {
        console.warn("DeFiLlama discovery failed:", error.message);
      }
    }

    // Fallback 2: Token lists (no API key required)
    if (allTokens.length < limit) {
      try {
        const result = await ctx.runAction(internal.tokenDiscoveryFallbacks.discoverTokensFromTokenLists, {
          chainId,
          limit: limit - allTokens.length,
        });

        if (result.success && result.tokens.length > 0) {
          // Filter out duplicates
          const existingAddrs = new Set(allTokens.map(t => t.address.toLowerCase()));
          const newTokens = result.tokens.filter(t => !existingAddrs.has(t.address.toLowerCase()));
          allTokens.push(...newTokens);
          sources.push("token-list");
        }
      } catch (error: any) {
        console.warn("Token list discovery failed:", error.message);
      }
    }

    // Sort by market cap (if available) and take top N
    const sorted = allTokens.sort((a, b) => (b.marketCapUsd || 0) - (a.marketCapUsd || 0));
    const final = sorted.slice(0, limit);

    return {
      success: final.length > 0,
      chainId,
      discovered: final.length,
      tokens: final,
      sources: sources.join(", "),
    };
  },
});

