import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    externalId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    roles: v.array(v.string()),
    orgId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_externalId", ["externalId"]),

  assets: defineTable({
    chainId: v.string(),
    address: v.string(),
    standard: v.optional(v.string()),
    symbol: v.optional(v.string()),
    name: v.optional(v.string()),
    decimals: v.optional(v.number()),
    iconUrl: v.optional(v.string()),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_chain_address", ["chainId", "address"])
    .index("by_status", ["status"])
    .index("by_symbol", ["symbol"])
    .index("by_name", ["name"]),

  contracts: defineTable({
    assetId: v.id("assets"),
    address: v.string(),
    verified: v.boolean(),
    upgradeable: v.boolean(),
    proxyType: v.optional(v.string()),
    implementation: v.optional(v.string()),
    proxyAdmin: v.optional(v.string()),
    owner: v.optional(v.string()),
    roles: v.array(v.object({ name: v.string(), holder: v.string() })),
    pausable: v.boolean(),
    timelock: v.optional(v.object({ address: v.string(), delaySec: v.number() })),
    asOfBlock: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_asset", ["assetId"]),

  holders_snapshot: defineTable({
    assetId: v.id("assets"),
    asOfBlock: v.number(),
    totalSupply: v.string(),
    freeFloat: v.string(),
    topHolders: v.array(v.object({ address: v.string(), pct: v.number(), label: v.optional(v.string()) })),
    top10Pct: v.number(),
    hhi: v.number(),
    nakamotoCoeff: v.number(),
    top1Pct: v.optional(v.number()),
    top3Pct: v.optional(v.number()),
    gini: v.optional(v.number()),
    contractSharePct: v.optional(v.number()),
    eoaSharePct: v.optional(v.number()),
    coveragePct: v.optional(v.number()),
    sampleSize: v.optional(v.number()),
    source: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_asset_block", ["assetId", "asOfBlock"]),

  liquidity: defineTable({
    assetId: v.id("assets"),
    asOfBlock: v.number(),
    pools: v.array(v.object({ dex: v.string(), poolAddress: v.string(), tvlUsd: v.number(), sharePct: v.number() })),
    cexSharePct: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_asset_block", ["assetId", "asOfBlock"]),

  governance: defineTable({
    assetId: v.id("assets"),
    framework: v.optional(v.string()),
    quorumPct: v.optional(v.number()),
    turnoutHistory: v.array(v.object({ proposalId: v.string(), turnoutPct: v.number(), ts: v.number() })),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_asset", ["assetId"]),

  chain_stats: defineTable({
    chainId: v.string(),
    validators: v.optional(v.number()),
    topValidatorsPct: v.optional(v.number()),
    nakamotoCoeff: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_chain", ["chainId"]),

  audits: defineTable({
    assetId: v.id("assets"),
    firm: v.string(),
    reportUrl: v.string(),
    date: v.number(),
    severitySummary: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_asset", ["assetId"]),

  scores: defineTable({
    assetId: v.id("assets"),
    asOfBlock: v.number(),
    subScores: v.object({
      ownership: v.number(),
      controlRisk: v.number(),
      liquidity: v.number(),
      governance: v.number(),
      chainLevel: v.number(),
      codeAssurance: v.number(),
    }),
    total: v.number(),
    calcVersion: v.optional(v.string()),
    weights: v.optional(v.object({
      ownership: v.number(),
      controlRisk: v.number(),
      liquidity: v.number(),
      governance: v.number(),
      chainLevel: v.number(),
      codeAssurance: v.number(),
    })),
    confidence: v.optional(v.object({
      ownership: v.number(),
      controlRisk: v.number(),
      liquidity: v.number(),
      governance: v.number(),
      chainLevel: v.number(),
      codeAssurance: v.number(),
    })),
    jsonldStorageId: v.optional(v.id("_storage")),
    createdAt: v.number(),
  }).index("by_asset_block", ["assetId", "asOfBlock"]),

  queries_cache: defineTable({
    key: v.string(),
    value: v.any(),
    expiresAt: v.number(),
    createdAt: v.number(),
  }).index("by_key", ["key"]).index("by_expiry", ["expiresAt"]),

  jobs: defineTable({
    type: v.string(),
    params: v.any(),
    status: v.string(),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status"]),

  rate_limits: defineTable({
    key: v.string(),
    windowStart: v.number(),
    count: v.number(),
    limit: v.number(),
    windowMs: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});

