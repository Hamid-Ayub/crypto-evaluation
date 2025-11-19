import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { DEFAULT_RATE_LIMIT } from "./config";

export const checkAndIncrement = mutation({
  args: { key: v.string(), plan: v.optional(v.string()), increment: v.optional(v.number()) },
  handler: async (ctx, { key, plan, increment = 1 }) => {
    const now = Date.now();
    const windowMs = DEFAULT_RATE_LIMIT.windowMs;
    const limit = plan === "pro" ? DEFAULT_RATE_LIMIT.limitPro : DEFAULT_RATE_LIMIT.limitFree;
    const start = Math.floor(now / windowMs) * windowMs;
    const skey = `${key}:${start}`;

    const found = await ctx.db.query("rate_limits").withIndex("by_key", q => q.eq("key", skey)).unique();
    if (!found) {
      if (increment > limit) return { ok: false, remaining: limit }; // Request exceeds total limit
      await ctx.db.insert("rate_limits", { key: skey, windowStart: start, count: increment, limit, windowMs, updatedAt: now });
      return { ok: true, remaining: limit - increment };
    }

    if (found.count + increment > limit) return { ok: false, remaining: limit - found.count };

    await ctx.db.patch(found._id, { count: found.count + increment, updatedAt: now });
    return { ok: true, remaining: limit - (found.count + increment) };
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

