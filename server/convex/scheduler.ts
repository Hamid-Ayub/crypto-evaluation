import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

const DEFAULT_CONFIG = {
  enabled: false,
  tokensPerHour: 30,
  stats: {
    totalDiscovered: 0,
    totalQueued: 0,
    errorsByChain: {},
    errorsByProvider: {},
  },
  chainConfig: {
    ethereum: { enabled: true, tokensPerHour: 6, minute: 5 },
    arbitrum: { enabled: true, tokensPerHour: 5, minute: 10 },
    base: { enabled: true, tokensPerHour: 5, minute: 15 },
    polygon: { enabled: true, tokensPerHour: 4, minute: 20 },
    optimism: { enabled: true, tokensPerHour: 4, minute: 25 },
  },
};

/**
 * Get or create scheduler configuration
 */
export const getConfig = internalQuery({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db.query("scheduler_config").first();
    if (!config) {
      // Return default config (will be created on first mutation)
      return {
        _id: null as any,
        ...DEFAULT_CONFIG,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }
    return config;
  },
});

/**
 * Get scheduler configuration (public query)
 */
export const getSchedulerConfig = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db.query("scheduler_config").first();
    if (!config) {
      return {
        enabled: false,
        tokensPerHour: DEFAULT_CONFIG.tokensPerHour,
        stats: DEFAULT_CONFIG.stats,
        chainConfig: DEFAULT_CONFIG.chainConfig,
        lastRunTime: null,
        lastRunChain: null,
      };
    }
    return {
      enabled: config.enabled,
      tokensPerHour: config.tokensPerHour,
      stats: config.stats,
      chainConfig: config.chainConfig,
      lastRunTime: config.lastRunTime,
      lastRunChain: config.lastRunChain,
    };
  },
});

/**
 * Initialize or update scheduler configuration
 */
export const setConfig = internalMutation({
  args: {
    enabled: v.optional(v.boolean()),
    tokensPerHour: v.optional(v.number()),
    chainConfig: v.optional(v.any()),
    stats: v.optional(v.any()),
    lastRunTime: v.optional(v.number()),
    lastRunChain: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("scheduler_config").first();
    const now = Date.now();

    if (!existing) {
      // Create new config
      return await ctx.db.insert("scheduler_config", {
        enabled: args.enabled ?? DEFAULT_CONFIG.enabled,
        tokensPerHour: args.tokensPerHour ?? DEFAULT_CONFIG.tokensPerHour,
        stats: args.stats ?? DEFAULT_CONFIG.stats,
        chainConfig: args.chainConfig ?? DEFAULT_CONFIG.chainConfig,
        lastRunTime: args.lastRunTime,
        lastRunChain: args.lastRunChain,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Update existing config
    const updates: any = { updatedAt: now };
    if (args.enabled !== undefined) updates.enabled = args.enabled;
    if (args.tokensPerHour !== undefined) updates.tokensPerHour = args.tokensPerHour;
    if (args.chainConfig !== undefined) updates.chainConfig = args.chainConfig;
    if (args.stats !== undefined) updates.stats = args.stats;
    if (args.lastRunTime !== undefined) updates.lastRunTime = args.lastRunTime;
    if (args.lastRunChain !== undefined) updates.lastRunChain = args.lastRunChain;

    await ctx.db.patch(existing._id, updates);
    return existing._id;
  },
});

/**
 * Enable scheduler
 */
export const enable = mutation({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(internal.scheduler.setConfig, { enabled: true });
    return { success: true };
  },
});

/**
 * Disable scheduler
 */
export const disable = mutation({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(internal.scheduler.setConfig, { enabled: false });
    return { success: true };
  },
});

/**
 * Update scheduler stats
 */
export const updateStats = internalMutation({
  args: {
    discovered: v.optional(v.number()),
    queued: v.optional(v.number()),
    error: v.optional(v.string()),
    errorChain: v.optional(v.string()),
    errorProvider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db.query("scheduler_config").first();
    if (!config) {
      // Initialize if doesn't exist
      await ctx.runMutation(internal.scheduler.setConfig, {});
      return;
    }

    const stats = { ...config.stats };
    if (args.discovered !== undefined) {
      stats.totalDiscovered = (stats.totalDiscovered || 0) + args.discovered;
    }
    if (args.queued !== undefined) {
      stats.totalQueued = (stats.totalQueued || 0) + args.queued;
    }
    if (args.error) {
      stats.lastError = args.error;
      stats.lastErrorTime = Date.now();
      
      // Track errors by chain
      if (args.errorChain) {
        const errorsByChain = stats.errorsByChain || {};
        errorsByChain[args.errorChain] = (errorsByChain[args.errorChain] || 0) + 1;
        stats.errorsByChain = errorsByChain;
      }
      
      // Track errors by provider
      if (args.errorProvider) {
        const errorsByProvider = stats.errorsByProvider || {};
        errorsByProvider[args.errorProvider] = (errorsByProvider[args.errorProvider] || 0) + 1;
        stats.errorsByProvider = errorsByProvider;
      }
    }

    await ctx.db.patch(config._id, { stats, updatedAt: Date.now() });
  },
});

/**
 * Update last run time for a chain
 */
export const updateLastRun = internalMutation({
  args: {
    chain: v.string(),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db.query("scheduler_config").first();
    if (!config) return;

    await ctx.db.patch(config._id, {
      lastRunTime: Date.now(),
      lastRunChain: args.chain,
      updatedAt: Date.now(),
    });
  },
});

