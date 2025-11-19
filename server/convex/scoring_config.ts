import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { SCORE_WEIGHTS, CALC_VERSION } from "./config";

export const get = query({
    args: {},
    handler: async (ctx) => {
        const config = await ctx.db
            .query("scoring_config")
            .withIndex("by_active", (q) => q.eq("active", true))
            .order("desc")
            .first();

        return config?.weights ?? SCORE_WEIGHTS;
    },
});

export const set = mutation({
    args: {
        weights: v.object({
            ownership: v.number(),
            controlRisk: v.number(),
            liquidity: v.number(),
            governance: v.number(),
            chainLevel: v.number(),
            codeAssurance: v.number(),
        }),
    },
    handler: async (ctx, args) => {
        // Deactivate all existing configs
        const existing = await ctx.db
            .query("scoring_config")
            .withIndex("by_active", (q) => q.eq("active", true))
            .collect();

        for (const config of existing) {
            await ctx.db.patch(config._id, { active: false });
        }

        // Insert new active config
        await ctx.db.insert("scoring_config", {
            weights: args.weights,
            version: CALC_VERSION,
            active: true,
            createdAt: Date.now(),
        });
    },
});

export const init = internalMutation({
    args: {},
    handler: async (ctx) => {
        const existing = await ctx.db.query("scoring_config").first();
        if (!existing) {
            await ctx.db.insert("scoring_config", {
                weights: SCORE_WEIGHTS,
                version: CALC_VERSION,
                active: true,
                createdAt: Date.now(),
            });
        }
    },
});
