import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const upsertUser = mutation({
  args: { externalId: v.string(), email: v.optional(v.string()), name: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db.query("users").withIndex("by_externalId", q => q.eq("externalId", args.externalId)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, { email: args.email ?? existing.email, name: args.name ?? existing.name, updatedAt: now });
      return existing._id;
    }
    return await ctx.db.insert("users", {
      externalId: args.externalId, email: args.email, name: args.name, roles: ["user"], createdAt: now, updatedAt: now,
    });
  },
});

export const me = query({ args: {}, handler: async (ctx) => {
  const ident = await ctx.auth.getUserIdentity();
  if (!ident) return null;
  const user = await ctx.db.query("users").withIndex("by_externalId", q => q.eq("externalId", ident.subject)).unique();
  return user ? { id: user._id, roles: user.roles, email: user.email, name: user.name } : null;
}});

