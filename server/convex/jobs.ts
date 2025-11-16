import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery, action, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const processQueue = internalAction({
  args: {},
  handler: async (ctx) => {
    const queued = await ctx.runQuery(internal.jobs.listQueued, {});
    if (!queued.length) return { processed: 0 };
    for (const job of queued.slice(0, 5)) {
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
      } catch (e: any) {
        await ctx.runMutation(internal.jobs.updateError, { id: job._id, error: e?.message ?? "unknown" });
      }
    }
    return { processed: Math.min(5, queued.length) };
  },
});

export const enqueueBackfill = action({
  args: { chainId: v.string(), addresses: v.array(v.string()) },
  handler: async (ctx, { chainId, addresses }) => {
    const now = Date.now();
    for (const address of addresses) {
      const asset = await ctx.runQuery(internal.jobs.assetByChainAddress, { chainId, address });
      const assetId = asset ? asset._id : await ctx.runMutation(internal.assets.ensureAsset, { chainId, address, standard: "erc20", status: "pending" });
      await ctx.runMutation(internal.jobs.insertJob, { type: "refresh_asset", params: { assetId }, status: "queued", createdAt: now, updatedAt: now });
    }
    return { enqueued: addresses.length };
  },
});

export const listQueued = internalQuery({ args: {}, handler: async (ctx) => {
  return await ctx.db.query("jobs").withIndex("by_status", q => q.eq("status", "queued")).take(50);
}});

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
  args: { type: v.string(), params: v.any(), status: v.string(), createdAt: v.number(), updatedAt: v.number() },
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

