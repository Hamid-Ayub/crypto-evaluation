import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { DEFAULT_RATE_LIMIT } from "./config";

export const checkAndIncrement = mutation({
  args: { key: v.string(), plan: v.optional(v.string()) },
  handler: async (ctx, { key, plan }) => {
    const now = Date.now();
    const windowMs = DEFAULT_RATE_LIMIT.windowMs;
    const limit = plan === "pro" ? DEFAULT_RATE_LIMIT.limitPro : DEFAULT_RATE_LIMIT.limitFree;
    const start = Math.floor(now / windowMs) * windowMs;
    const skey = `${key}:${start}`;

    const found = await ctx.db.query("rate_limits").withIndex("by_key", q => q.eq("key", skey)).unique();
    if (!found) {
      await ctx.db.insert("rate_limits", { key: skey, windowStart: start, count: 1, limit, windowMs, updatedAt: now });
      return { ok: true, remaining: limit - 1 };
    }
    if (found.count >= limit) return { ok: false, remaining: 0 };
    await ctx.db.patch(found._id, { count: found.count + 1, updatedAt: now });
    return { ok: true, remaining: limit - (found.count + 1) };
  },
});

export const gc = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const cursor = ctx.db.query("rate_limits");
    for await (const doc of cursor) { if (doc.windowStart < cutoff) await ctx.db.delete(doc._id); }
  },
});

