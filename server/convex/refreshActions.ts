import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";

/**
 * Refresh only volatile market data (price, volume, exchange listings)
 * Uses refresh lock to prevent duplicate requests
 */
export const refreshVolatileData = action({
    args: { assetId: v.id("assets") },
    handler: async (ctx, { assetId }) => {
        const startTime = Date.now();
        let lockId: any = null;
        let apiCallsMade = 0;

        try {
            // Acquire lock
            lockId = await ctx.runMutation(internal.refresh.acquireRefreshLock, {
                assetId,
                refreshType: "volatile",
                lockedBy: ctx.auth?.userId ?? "system",
            });

            // Get asset info
            const asset = await ctx.runQuery(api.assets.getById, { id: assetId });
            if (!asset) throw new Error("Asset not found");

            const { chainId, address } = asset;

            // Dynamically import CoinGecko provider
            const { fetchCurrentMarketData, fetchExchangeListings } = await import("./providers/coingecko");

            // Fetch volatile data in parallel
            const [currentData, listingsData] = await Promise.all([
                fetchCurrentMarketData(chainId, address).catch(() => null),
                fetchExchangeListings(chainId, address).catch(() => null),
            ]);

            apiCallsMade = 2;

            // Update market data if we got any data
            if (currentData || listingsData) {
                await ctx.runMutation(internal.assets.upsertMarketData, {
                    assetId,
                    data: {
                        ...(currentData ? {
                            marketCapUsd: currentData.marketCapUsd,
                            priceUsd: currentData.priceUsd,
                            priceChange24h: currentData.priceChange24h,
                            volume24hUsd: currentData.volume24hUsd,
                            currentSource: currentData.source,
                            currentSourceUrl: currentData.sourceUrl,
                        } : {}),
                        ...(listingsData ? { exchangeListings: listingsData } : {}),
                        fetchedAt: Date.now(),
                    },
                });
            }

            // Release lock
            await ctx.runMutation(internal.refresh.releaseRefreshLock, {
                lockId,
                success: true,
            });

            // Log to history
            await ctx.runMutation(internal.refresh.logRefreshHistory, {
                assetId,
                refreshType: "volatile",
                startedAt: startTime,
                completedAt: Date.now(),
                success: true,
                apiCallsMade,
            });

            return { success: true, apiCalls: apiCallsMade };
        } catch (error: any) {
            // Release lock on error
            if (lockId) {
                await ctx.runMutation(internal.refresh.releaseRefreshLock, {
                    lockId,
                    success: false,
                });
            }

            // Log failure
            await ctx.runMutation(internal.refresh.logRefreshHistory, {
                assetId,
                refreshType: "volatile",
                startedAt: startTime,
                completedAt: Date.now(),
                success: false,
                errorMessage: error.message,
                apiCallsMade,
            });

            throw error;
        }
    },
});

/**
 * Refresh semi-volatile data (holders, liquidity, governance, GitHub stats)
 * Uses refresh lock to prevent duplicate requests
 */
export const refreshSemiVolatileData = action({
    args: { assetId: v.id("assets") },
    handler: async (ctx, { assetId }) => {
        const startTime = Date.now();
        let lockId: any = null;
        let apiCallsMade = 0;

        try {
            // Acquire lock
            lockId = await ctx.runMutation(internal.refresh.acquireRefreshLock, {
                assetId,
                refreshType: "semiVolatile",
                lockedBy: ctx.auth?.userId ?? "system",
            });

            // Get asset info
            const asset = await ctx.runQuery(api.assets.getById, { id: assetId });
            if (!asset) throw new Error("Asset not found");

            const { chainId, address } = asset;

            // Load composite adapter
            const mod = await import("./providers/composite");
            const adapter = mod.compositeAdapter;

            // Fetch semi-volatile data in parallel
            const settle = async <T>(p: Promise<T>): Promise<{ ok: true; v: T } | { ok: false; e: any }> => {
                try { return { ok: true, v: await p }; } catch (e) { return { ok: false, e }; }
            };

            const [h, l, g] = await Promise.all([
                settle(adapter.getHoldersSnapshot!(chainId, address)),
                settle(adapter.getLiquidityInfo!(chainId, address)),
                settle(adapter.getGovernanceInfo!(chainId, address)),
            ]);

            apiCallsMade = 3;

            // Update data
            if (h.ok) {
                await ctx.runMutation(internal.assets.insertHolders, {
                    assetId,
                    data: { ...h.v, fetchedAt: Date.now() }
                });
            }
            if (l.ok) {
                await ctx.runMutation(internal.assets.insertLiquidity, {
                    assetId,
                    data: { ...l.v, fetchedAt: Date.now() }
                });
            }
            if (g.ok) {
                await ctx.runMutation(internal.assets.upsertGovernance, {
                    assetId,
                    data: g.v
                });
            }

            // Fetch GitHub stats if repos exist
            const projectProfile = await ctx.runQuery(api.assets.getProjectProfile, { assetId });
            const githubRepos = projectProfile?.githubRepos ?? [];

            if (githubRepos.length > 0) {
                const { getGitHubStats } = await import("./providers/github");

                for (const repoInput of githubRepos) {
                    try {
                        const stats = await getGitHubStats(repoInput);
                        apiCallsMade++;

                        if (stats) {
                            await ctx.runMutation(internal.assets.upsertDevelopmentStats, {
                                assetId,
                                repo: stats.repo,
                                data: {
                                    ...stats,
                                    fetchedAt: stats.fetchedAt,
                                },
                            });
                        }
                    } catch (err) {
                        // Skip failed repo, continue with others
                        console.error(`Failed to fetch GitHub stats for ${repoInput}:`, err);
                    }
                }
            }

            // Release lock
            await ctx.runMutation(internal.refresh.releaseRefreshLock, {
                lockId,
                success: true,
            });

            // Log to history
            await ctx.runMutation(internal.refresh.logRefreshHistory, {
                assetId,
                refreshType: "semiVolatile",
                startedAt: startTime,
                completedAt: Date.now(),
                success: true,
                apiCallsMade,
            });

            return { success: true, apiCalls: apiCallsMade };
        } catch (error: any) {
            // Release lock on error
            if (lockId) {
                await ctx.runMutation(internal.refresh.releaseRefreshLock, {
                    lockId,
                    success: false,
                });
            }

            // Log failure
            await ctx.runMutation(internal.refresh.logRefreshHistory, {
                assetId,
                refreshType: "semiVolatile",
                startedAt: startTime,
                completedAt: Date.now(),
                success: false,
                errorMessage: error.message,
                apiCallsMade,
            });

            throw error;
        }
    },
});
