import { v } from "convex/values";
import { mutation, internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Acquire a refresh lock to prevent duplicate concurrent refreshes
 * Returns lockId if successful, throws if lock already exists
 */
export const acquireRefreshLock = internalMutation({
    args: {
        assetId: v.id("assets"),
        refreshType: v.union(v.literal("full"), v.literal("volatile"), v.literal("semiVolatile")),
        lockedBy: v.optional(v.string()),
    },
    handler: async (ctx, { assetId, refreshType, lockedBy }) => {
        const now = Date.now();

        // Check for existing active lock
        const existingLock = await ctx.db
            .query("refresh_locks")
            .withIndex("by_asset_type", (q) =>
                q.eq("assetId", assetId).eq("refreshType", refreshType)
            )
            .filter((q) => q.eq(q.field("status"), "in_progress"))
            .first();

        if (existingLock) {
            // Check if lock is stale (>5 minutes old)
            const lockAge = now - existingLock.lockedAt;
            const STALE_LOCK_THRESHOLD = 5 * 60 * 1000; // 5 minutes

            if (lockAge < STALE_LOCK_THRESHOLD) {
                throw new Error("refresh-already-in-progress");
            }

            // Clean up stale lock
            await ctx.db.patch(existingLock._id, {
                status: "failed",
            });
        }

        // Create new lock
        const lockId = await ctx.db.insert("refresh_locks", {
            assetId,
            refreshType,
            lockedAt: now,
            lockedBy: lockedBy ?? "system",
            status: "in_progress",
            createdAt: now,
        });

        return lockId;
    },
});

/**
 * Release a refresh lock after completion or failure
 */
export const releaseRefreshLock = internalMutation({
    args: {
        lockId: v.id("refresh_locks"),
        success: v.boolean(),
    },
    handler: async (ctx, { lockId, success }) => {
        await ctx.db.patch(lockId, {
            status: success ? "completed" : "failed",
        });
    },
});

/**
 * Log refresh attempt to history for tracking and debugging
 */
export const logRefreshHistory = internalMutation({
    args: {
        assetId: v.id("assets"),
        refreshType: v.string(),
        startedAt: v.number(),
        completedAt: v.optional(v.number()),
        success: v.boolean(),
        errorMessage: v.optional(v.string()),
        apiCallsMade: v.number(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        await ctx.db.insert("refresh_history", {
            ...args,
            createdAt: now,
        });
    },
});

/**
 * Check if a refresh is currently in progress
 */
export const isRefreshInProgress = query({
    args: {
        assetId: v.id("assets"),
        refreshType: v.optional(v.union(v.literal("full"), v.literal("volatile"), v.literal("semiVolatile"))),
    },
    handler: async (ctx, { assetId, refreshType }) => {
        const query = refreshType
            ? ctx.db
                .query("refresh_locks")
                .withIndex("by_asset_type", (q) =>
                    q.eq("assetId", assetId).eq("refreshType", refreshType)
                )
            : ctx.db
                .query("refresh_locks")
                .withIndex("by_asset", (q) => q.eq("assetId", assetId));

        const activeLock = await query
            .filter((q) => q.eq(q.field("status"), "in_progress"))
            .first();

        return !!activeLock;
    },
});

/**
 * Get refresh history for an asset
 */
export const getRefreshHistory = query({
    args: {
        assetId: v.id("assets"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, { assetId, limit = 10 }) => {
        const history = await ctx.db
            .query("refresh_history")
            .withIndex("by_asset", (q) => q.eq("assetId", assetId))
            .order("desc")
            .take(limit);

        return history;
    },
});

/**
 * Clean up old completed/failed locks (older than 1 hour)
 */
export const cleanupOldLocks = internalMutation({
    args: {},
    handler: async (ctx) => {
        const oneHourAgo = Date.now() - 60 * 60 * 1000;

        const oldLocks = await ctx.db
            .query("refresh_locks")
            .withIndex("by_status", (q) =>
                q.eq("status", "completed")
            )
            .collect();

        const failedLocks = await ctx.db
            .query("refresh_locks")
            .withIndex("by_status", (q) =>
                q.eq("status", "failed")
            )
            .collect();

        const allOldLocks = [...oldLocks, ...failedLocks].filter(
            (lock) => lock.createdAt < oneHourAgo
        );

        for (const lock of allOldLocks) {
            await ctx.db.delete(lock._id);
        }

        return { deleted: allOldLocks.length };
    },
});
