import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Main scheduler action - discovers tokens for a specific chain and queues them
 */
export const discoverAndQueueTokens = internalAction({
  args: {
    chain: v.optional(v.string()), // "ethereum", "arbitrum", "base", "polygon", "optimism"
  },
  handler: async (ctx, args) => {
    const chain = args.chain || "ethereum";

    // Map chain name to chainId
    const CHAIN_ID_MAP: Record<string, string> = {
      ethereum: "eip155:1",
      arbitrum: "eip155:42161",
      base: "eip155:8453",
      polygon: "eip155:137",
      optimism: "eip155:10",
    };
    const chainId = CHAIN_ID_MAP[chain] || "eip155:1";

    // Check if scheduler is enabled
    const config = await ctx.runQuery(internal.scheduler.getConfig, {});
    if (!config.enabled) {
      return {
        success: false,
        reason: "scheduler_disabled",
        chain,
        discovered: 0,
        queued: 0,
      };
    }

    // Get chain-specific config
    const chainConfig = config.chainConfig?.[chain as keyof typeof config.chainConfig];
    if (!chainConfig || !chainConfig.enabled) {
      return {
        success: false,
        reason: "chain_disabled",
        chain,
        discovered: 0,
        queued: 0,
      };
    }

    const tokensPerHour = chainConfig.tokensPerHour;

    // Check if there are already queued jobs - if so, skip discovery
    // This prevents wasting API calls when we're already at capacity
    const queuedJobs = await ctx.runQuery(internal.jobs.listQueued, {});
    const queuedCount = queuedJobs.length;

    if (queuedCount > 0) {
      console.log(`Skipping discovery for ${chain}: ${queuedCount} jobs already queued`);
      return {
        success: false,
        reason: "queue_backlog",
        chain,
        discovered: 0,
        queued: 0,
        queuedCount,
      };
    }

    try {
      // Step 1: Discover tokens using multi-source with fallbacks
      // This tries CoinGecko first, then DeFiLlama, then token lists
      const discoveryResult = await ctx.runAction(
        internal.tokenDiscoveryFallbacks.discoverTokensMultiSource,
        {
          chain,
          chainId,
          limit: tokensPerHour * 2, // Fetch more to account for filtering
          minMarketCap: 100000, // $100k minimum
          minVolume: 10000, // $10k minimum 24h volume
        }
      );

      if (!discoveryResult.success || discoveryResult.tokens.length === 0) {
        await ctx.runMutation(internal.scheduler.updateStats, {
          error: discoveryResult.error || "No tokens discovered from any source",
          errorChain: chain,
          errorProvider: discoveryResult.sources || "all",
        });
        return {
          success: false,
          reason: discoveryResult.error || "no_tokens",
          chain,
          discovered: 0,
          queued: 0,
        };
      }

      // Step 2: Filter out existing tokens
      const filterResult = await ctx.runAction(
        internal.tokenDiscovery.filterExistingTokens,
        {
          tokens: discoveryResult.tokens,
        }
      );

      if (filterResult.new === 0) {
        return {
          success: true,
          reason: "all_existing",
          chain,
          discovered: discoveryResult.discovered,
          queued: 0,
        };
      }

      // Step 3: Take top N new tokens (by market cap)
      const newTokens = filterResult.tokens
        .sort((a, b) => (b.marketCapUsd || 0) - (a.marketCapUsd || 0))
        .slice(0, tokensPerHour);

      // Step 4: Queue tokens for ingestion
      let queuedCount = 0;
      const now = Date.now();

      for (const token of newTokens) {
        try {
          // Ensure asset exists (or create it)
          const assetId = await ctx.runMutation(internal.assets.ensureAsset, {
            chainId: token.chainId,
            address: token.address,
            standard: "erc20",
            symbol: token.symbol,
            name: token.name,
            status: "pending",
          });

          // Calculate priority based on market cap
          // High value: >$10M = 100, Medium: $1M-$10M = 50, Low: <$1M = 10
          const marketCap = token.marketCapUsd || 0;
          let priority = 10; // Default low
          if (marketCap >= 10_000_000) {
            priority = 100; // High value
          } else if (marketCap >= 1_000_000) {
            priority = 50; // Medium value
          }

          // Queue refresh job with priority
          await ctx.runMutation(internal.jobs.insertJob, {
            type: "refresh_asset",
            params: { assetId },
            status: "queued",
            priority,
            createdAt: now,
            updatedAt: now,
          });

          queuedCount++;
        } catch (error: any) {
          console.error(`Failed to queue token ${token.address} on ${chain}:`, error);
          // Continue with next token
        }
      }

      // Step 5: Update stats
      await ctx.runMutation(internal.scheduler.updateStats, {
        discovered: discoveryResult.discovered,
        queued: queuedCount,
      });

      // Step 6: Update last run time
      await ctx.runMutation(internal.scheduler.updateLastRun, { chain });

      return {
        success: true,
        chain,
        discovered: discoveryResult.discovered,
        existing: filterResult.existing,
        new: filterResult.new,
        queued: queuedCount,
      };
    } catch (error: any) {
      console.error(`Scheduler error for ${chain}:`, error);

      await ctx.runMutation(internal.scheduler.updateStats, {
        error: error.message || "Unknown error",
        errorChain: chain,
        errorProvider: "coingecko",
      });

      return {
        success: false,
        reason: "error",
        error: error.message,
        chain,
        discovered: 0,
        queued: 0,
      };
    }
  },
});

// Wrapper actions for each chain (required because Convex cron jobs don't support arguments)
export const discoverEthereum = internalAction({
  args: {},
  handler: async (ctx) => {
    return await ctx.runAction(internal.schedulerActions.discoverAndQueueTokens, { chain: "ethereum" });
  },
});

export const discoverArbitrum = internalAction({
  args: {},
  handler: async (ctx) => {
    return await ctx.runAction(internal.schedulerActions.discoverAndQueueTokens, { chain: "arbitrum" });
  },
});

export const discoverBase = internalAction({
  args: {},
  handler: async (ctx) => {
    return await ctx.runAction(internal.schedulerActions.discoverAndQueueTokens, { chain: "base" });
  },
});

export const discoverPolygon = internalAction({
  args: {},
  handler: async (ctx) => {
    return await ctx.runAction(internal.schedulerActions.discoverAndQueueTokens, { chain: "polygon" });
  },
});

export const discoverOptimism = internalAction({
  args: {},
  handler: async (ctx) => {
    return await ctx.runAction(internal.schedulerActions.discoverAndQueueTokens, { chain: "optimism" });
  },
});

