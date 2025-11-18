/**
 * Project Parser Actions
 * 
 * Parses project websites and extracts structured data (team, roadmap, links, tokenomics)
 */

import { action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { parseProjectWebsite, extractProjectLinks } from "./providers/webParser";

/**
 * Parse project website and store structured data
 */
export const parseProjectData = action({
  args: {
    tokenId: v.string(),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { tokenId, force } = args;
    
    // Get token data
    const token = await ctx.runQuery(api.assets.getEnriched, { tokenId });
    if (!token) {
      throw new Error("token-not-found");
    }

    // Get asset record
    const asset = await ctx.runQuery(api.assets.getByChainAddress, {
      chainId: token.chain,
      address: token.address.toLowerCase(),
    });
    if (!asset) {
      throw new Error("asset-not-found");
    }

    // Check if we already have parsed data (unless force refresh)
    if (!force && asset.parsedProjectData) {
      return {
        cached: true,
        data: asset.parsedProjectData,
      };
    }

    // Extract basic links from project profile
    const basicLinks = extractProjectLinks(token.projectProfile);
    const websiteUrl = token.projectProfile?.website || basicLinks?.website;

    if (!websiteUrl) {
      return {
        cached: false,
        data: null,
        error: "No website URL available for parsing",
      };
    }

    try {
      // Parse project website using Gemini
      const parsedData = await parseProjectWebsite(
        websiteUrl,
        token.name,
        token.projectProfile,
      );

      // Merge with basic links
      const mergedData = {
        ...parsedData,
        links: {
          ...parsedData.links,
          ...basicLinks,
          // Prefer parsed links over basic links
          website: parsedData.links?.website || basicLinks?.website,
          documentation: parsedData.links?.documentation || basicLinks?.documentation,
          github: parsedData.links?.github || basicLinks?.github,
          twitter: parsedData.links?.twitter || basicLinks?.twitter,
          discord: parsedData.links?.discord || basicLinks?.discord,
          telegram: parsedData.links?.telegram || basicLinks?.telegram,
        },
      };

      // Store parsed data
      await ctx.runMutation(internal.projectParser.upsertParsedProjectData, {
        assetId: asset._id,
        data: mergedData,
      });

      return {
        cached: false,
        data: mergedData,
      };
    } catch (error: any) {
      return {
        cached: false,
        data: null,
        error: error?.message || "Failed to parse project data",
      };
    }
  },
});

/**
 * Internal mutation to store parsed project data
 */
export const upsertParsedProjectData = internalMutation({
  args: {
    assetId: v.id("assets"),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const { assetId, data } = args;
    const now = Date.now();

    const asset = await ctx.db.get(assetId);
    if (!asset) {
      throw new Error("asset-not-found");
    }

    await ctx.db.patch(assetId, {
      parsedProjectData: data,
      updatedAt: now,
    });
  },
});

