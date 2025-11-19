import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery, action, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const processQueue = internalAction({
  args: {},
  handler: async (ctx) => {
    // 1. Check global rate limit first
    // We estimate 4 calls per ingestion (Launch, Current, Listings, Icon)
    const JOB_COST = 4;
    const limitCheck = await ctx.runMutation(internal.rateLimit.checkAndIncrement, {
      key: "coingecko",
      increment: JOB_COST
    });

    if (!limitCheck.ok) {
      console.log(`Rate limit hit (remaining: ${limitCheck.remaining}), pausing queue processing.`);
      return { processed: 0, status: "rate_limited" };
    }

    // 2. Get next job (process 1 at a time to be safe)
    const queued = await ctx.runQuery(internal.jobs.listQueued, {});
    if (!queued.length) return { processed: 0, status: "empty" };

    const job = queued[0];
    await ctx.runMutation(internal.jobs.updateStatus, { id: job._id, status: "running" });

    try {
      if (job.type === "refresh_asset") {
        const { assetId } = job.params as { assetId: string };
        const asset = await ctx.runQuery(internal.jobs.getAsset, { id: assetId as any });

        if (!asset) throw new Error("Asset not found");

        await ctx.runAction(internal.ingest.ingestAssetSnapshot, {
          chainId: asset.chainId,
          address: asset.address,
          standard: asset.standard ?? "erc20",
          symbol: asset.symbol,
          name: asset.name,
          decimals: asset.decimals,
        });
      }

      await ctx.runMutation(internal.jobs.updateStatus, { id: job._id, status: "done" });

      // 3. Recursively schedule next job if we have budget
      // If we have enough remaining budget for another job, schedule immediately
      if (limitCheck.remaining >= JOB_COST && queued.length > 1) {
        await ctx.scheduler.runAfter(0, internal.jobs.processQueue, {});
      }

      return { processed: 1, status: "success", remainingBudget: limitCheck.remaining };

    } catch (e: any) {
      await ctx.runMutation(internal.jobs.updateError, { id: job._id, error: e?.message ?? "unknown" });

      // Even on error, try next job if budget allows
      if (limitCheck.remaining >= JOB_COST && queued.length > 1) {
        await ctx.scheduler.runAfter(0, internal.jobs.processQueue, {});
      }

      return { processed: 1, status: "error", error: e?.message };
    }
  },
});

export const enqueueBackfill = action({
  args: { chainId: v.string(), addresses: v.array(v.string()) },
  handler: async (ctx, { chainId, addresses }) => {
    const now = Date.now();
    for (const address of addresses) {
      const asset = await ctx.runQuery(internal.jobs.assetByChainAddress, { chainId, address });
      const assetId = asset ? asset._id : await ctx.runMutation(internal.assets.ensureAsset, { chainId, address, standard: "erc20", status: "pending" });
      await ctx.runMutation(internal.jobs.insertJob, { type: "refresh_asset", params: { assetId }, status: "queued", priority: 200, createdAt: now, updatedAt: now });
    }
    return { enqueued: addresses.length };
  },
});

export const listQueued = internalQuery({
  args: {}, handler: async (ctx) => {
    // Sort by priority (descending, nulls last) then by createdAt (ascending, oldest first)
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_status", q => q.eq("status", "queued"))
      .collect();

    // Manual sort since Convex doesn't support complex sorting on index queries
    return jobs
      .sort((a, b) => {
        const priorityA = a.priority ?? 0;
        const priorityB = b.priority ?? 0;

        if (priorityB !== priorityA) {
          return priorityB - priorityA; // Higher priority first
        }
        return a.createdAt - b.createdAt; // Older jobs first
      })
      .slice(0, 50);
  }
});

export const updateStatus = internalMutation({
  args: { id: v.id("jobs"), status: v.string() },
  handler: async (ctx, { id, status }) => {
    await ctx.db.patch(id, { status, updatedAt: Date.now(), finishedAt: status === "done" ? Date.now() : undefined });
  },
});

export const updateError = internalMutation({
  args: { id: v.id("jobs"), error: v.string() },
  handler: async (ctx, { id, error }) => {
    await ctx.db.patch(id, { status: "error", error, updatedAt: Date.now(), finishedAt: Date.now() });
  },
});

export const insertJob = internalMutation({
  args: {
    type: v.string(),
    params: v.any(),
    status: v.string(),
    priority: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number()
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("jobs", args);
  },
});

export const getAsset = internalQuery({ args: { id: v.id("assets") }, handler: async (ctx, { id }) => ctx.db.get(id) });

export const assetByChainAddress = internalQuery({
  args: { chainId: v.string(), address: v.string() },
  handler: async (ctx, { chainId, address }) => {
    return await ctx.db.query("assets").withIndex("by_chain_address", q => q.eq("chainId", chainId).eq("address", address.toLowerCase())).unique();
  },
});

export const listJobs = query({
  args: { status: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, { status, limit = 20 }) => {
    const query = ctx.db.query("jobs");
    const jobs = status
      ? await query.withIndex("by_status", q => q.eq("status", status)).order("desc").take(limit)
      : await query.order("desc").take(limit);
    return jobs.map(job => ({
      _id: job._id,
      type: job.type,
      status: job.status,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      error: job.error,
    }));
  },
});

export const getJobStats = query({
  args: {},
  handler: async (ctx) => {
    const allJobs = await ctx.db.query("jobs").order("desc").take(100);
    const stats = {
      total: allJobs.length,
      queued: allJobs.filter(j => j.status === "queued").length,
      running: allJobs.filter(j => j.status === "running").length,
      done: allJobs.filter(j => j.status === "done").length,
      error: allJobs.filter(j => j.status === "error").length,
      recent: allJobs.slice(0, 5).map(j => ({
        type: j.type,
        status: j.status,
        createdAt: j.createdAt,
        finishedAt: j.finishedAt,
        error: j.error,
      })),
    };
    return stats;
  },
});

/**
 * Get job status for a specific asset
 * Returns the current job (if any) and its position in the queue
 */
export const getJobStatusForAsset = query({
  args: { assetId: v.id("assets") },
  handler: async (ctx, { assetId }) => {
    // Find any queued or running job for this asset
    const jobs = await ctx.db
      .query("jobs")
      .filter(q =>
        q.and(
          q.eq(q.field("params").assetId, assetId),
          q.or(
            q.eq(q.field("status"), "queued"),
            q.eq(q.field("status"), "running")
          )
        )
      )
      .collect();

    if (jobs.length === 0) {
      return { status: "idle", job: null, queuePosition: null };
    }

    const job = jobs[0];

    if (job.status === "running") {
      return { status: "running", job, queuePosition: 0 };
    }

    // Calculate queue position
    const allQueued = await ctx.db
      .query("jobs")
      .withIndex("by_status", q => q.eq("status", "queued"))
      .collect();

    const sortedQueue = allQueued
      .sort((a, b) => {
        const priorityA = a.priority ?? 0;
        const priorityB = b.priority ?? 0;
        if (priorityB !== priorityA) {
          return priorityB - priorityA;
        }
        return a.createdAt - b.createdAt;
      });

    const position = sortedQueue.findIndex(j => j._id === job._id);

    return {
      status: "queued",
      job,
      queuePosition: position + 1, // 1-indexed
    };
  },
});

/**
 * Get queue statistics for ETA calculation
 */
export const getQueueStats = query({
  args: {},
  handler: async (ctx) => {
    const queuedJobs = await ctx.db
      .query("jobs")
      .withIndex("by_status", q => q.eq("status", "queued"))
      .collect();

    const recentDoneJobs = await ctx.db
      .query("jobs")
      .filter(q => q.eq(q.field("status"), "done"))
      .order("desc")
      .take(10);

    // Calculate average processing time from recent jobs
    const processingTimes = recentDoneJobs
      .filter(j => j.startedAt && j.finishedAt)
      .map(j => (j.finishedAt! - j.startedAt!) / 1000); // Convert to seconds

    const avgProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      : 60; // Default 60 seconds if no data

    return {
      totalQueued: queuedJobs.length,
      avgProcessingTimeSeconds: Math.round(avgProcessingTime),
    };
  },
});
