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
    iconUrl: v.optional(v.string()), // GitHub CDN URL (backup)
    iconStorageId: v.optional(v.id("_storage")), // Convex file storage ID (primary)
    githubSynced: v.optional(v.boolean()), // Whether asset has been synced to GitHub
    parsedProjectData: v.optional(v.any()), // Parsed structured data from project websites
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
    sources: v.optional(v.array(v.string())), // Multiple sources for cross-validation
    crossValidationStatus: v.optional(v.string()), // e.g., "3 sources agree", "data conflict"
    fetchedAt: v.optional(v.number()), // When this data was last fetched
    createdAt: v.number(),
  }).index("by_asset_block", ["assetId", "asOfBlock"]),

  market_data: defineTable({
    assetId: v.id("assets"),
    // Launch data (historical)
    launchDate: v.optional(v.number()), // Unix timestamp
    initialMarketCapUsd: v.optional(v.number()),
    initialPriceUsd: v.optional(v.number()),
    launchSource: v.optional(v.string()),
    launchSourceUrl: v.optional(v.string()),
    // Current snapshot
    marketCapUsd: v.optional(v.number()),
    priceUsd: v.optional(v.number()),
    priceChange24h: v.optional(v.number()),
    volume24hUsd: v.optional(v.number()),
    currentSource: v.optional(v.string()),
    currentSourceUrl: v.optional(v.string()),
    exchangeListings: v.optional(
      v.array(
        v.object({
          exchange: v.string(),
          pair: v.string(),
          baseSymbol: v.string(),
          targetSymbol: v.string(),
          priceUsd: v.optional(v.number()),
          volume24hUsd: v.optional(v.number()),
          trustScore: v.optional(v.string()),
          isDex: v.optional(v.boolean()),
          lastTradedAt: v.optional(v.number()),
          url: v.optional(v.string()),
          source: v.optional(v.string()),
          sourceUrl: v.optional(v.string()),
        }),
      ),
    ),
    fetchedAt: v.optional(v.number()), // When volatile data was last fetched
    updatedAt: v.number(),
    createdAt: v.number(),
  }).index("by_asset", ["assetId"]),

  liquidity: defineTable({
    assetId: v.id("assets"),
    asOfBlock: v.number(),
    pools: v.array(v.object({ dex: v.string(), poolAddress: v.string(), tvlUsd: v.number(), sharePct: v.number() })),
    cexSharePct: v.optional(v.number()),
    fetchedAt: v.optional(v.number()), // When this data was last fetched
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

  project_profiles: defineTable({
    assetId: v.id("assets"),
    githubRepos: v.optional(v.array(v.string())),
    website: v.optional(v.string()),
    docs: v.optional(v.string()),
    twitter: v.optional(v.string()),
    discord: v.optional(v.string()),
    telegram: v.optional(v.string()),
    updatedAt: v.number(),
    createdAt: v.number(),
  }).index("by_asset", ["assetId"]),

  development_stats: defineTable({
    assetId: v.id("assets"),
    repo: v.string(), // owner/name
    repoUrl: v.string(),
    owner: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    homepage: v.optional(v.string()),
    license: v.optional(v.string()),
    stars: v.number(),
    forks: v.number(),
    watchers: v.number(),
    openIssues: v.number(),
    subscribers: v.optional(v.number()),
    defaultBranch: v.optional(v.string()),
    primaryLanguage: v.optional(v.string()),
    topics: v.optional(v.array(v.string())),
    commitsLast4Weeks: v.optional(v.number()),
    commitsThisYear: v.optional(v.number()),
    avgWeeklyCommits: v.optional(v.number()),
    contributorsCount: v.optional(v.number()),
    lastCommitAt: v.optional(v.number()),
    lastReleaseAt: v.optional(v.number()),
    lastReleaseTag: v.optional(v.string()),
    fetchedAt: v.number(),
    source: v.string(),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_asset_repo", ["assetId", "repo"]),

  ai_sections: defineTable({
    assetId: v.id("assets"),
    sectionId: v.string(),
    content: v.string(),
    model: v.string(),
    promptHash: v.string(),
    tokensUsed: v.optional(v.number()),
    latencyMs: v.optional(v.number()),
    sourceDataHash: v.optional(v.string()),
    sources: v.optional(
      v.array(
        v.object({
          id: v.number(),
          title: v.optional(v.string()),
          url: v.string(),
          snippet: v.optional(v.string()),
        }),
      ),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_asset_section", ["assetId", "sectionId"])
    .index("by_section", ["sectionId"]),

  ai_reports: defineTable({
    assetId: v.id("assets"),
    report: v.any(), // Structured JSON report
    summary: v.optional(v.string()),
    model: v.string(),
    promptHash: v.string(),
    tokensUsed: v.optional(v.number()),
    latencyMs: v.optional(v.number()),
    sourceDataHash: v.optional(v.string()),
    sources: v.optional(
      v.array(
        v.object({
          id: v.number(),
          title: v.optional(v.string()),
          url: v.string(),
          snippet: v.optional(v.string()),
        }),
      ),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_asset", ["assetId"]),

  ai_section_logs: defineTable({
    assetId: v.id("assets"),
    sectionId: v.string(),
    status: v.string(), // success | error | skipped
    model: v.optional(v.string()),
    tokensUsed: v.optional(v.number()),
    latencyMs: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_asset_section", ["assetId", "sectionId"])
    .index("by_created", ["createdAt"]),

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
    priority: v.optional(v.number()), // Higher = more important (user requests: 200, high mcap: 100, medium: 50, low: 10)
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_status_priority", ["status", "priority", "createdAt"]),

  rate_limits: defineTable({
    key: v.string(),
    windowStart: v.number(),
    count: v.number(),
    limit: v.number(),
    windowMs: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  scheduler_config: defineTable({
    enabled: v.boolean(),
    tokensPerHour: v.number(),
    lastRunTime: v.optional(v.number()),
    lastRunChain: v.optional(v.string()),
    stats: v.object({
      totalDiscovered: v.number(),
      totalQueued: v.number(),
      errorsByChain: v.optional(v.any()),
      errorsByProvider: v.optional(v.any()),
      lastError: v.optional(v.string()),
      lastErrorTime: v.optional(v.number()),
    }),
    chainConfig: v.optional(v.object({
      ethereum: v.object({ enabled: v.boolean(), tokensPerHour: v.number(), minute: v.number() }),
      arbitrum: v.object({ enabled: v.boolean(), tokensPerHour: v.number(), minute: v.number() }),
      base: v.object({ enabled: v.boolean(), tokensPerHour: v.number(), minute: v.number() }),
      polygon: v.object({ enabled: v.boolean(), tokensPerHour: v.number(), minute: v.number() }),
      optimism: v.object({ enabled: v.boolean(), tokensPerHour: v.number(), minute: v.number() }),
    })),
    updatedAt: v.number(),
    createdAt: v.number(),
  }).index("by_enabled", ["enabled"]),

  scoring_config: defineTable({
    weights: v.object({
      ownership: v.number(),
      controlRisk: v.number(),
      liquidity: v.number(),
      governance: v.number(),
      chainLevel: v.number(),
      codeAssurance: v.number(),
    }),
    version: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
  }).index("by_active", ["active"]),

  refresh_locks: defineTable({
    assetId: v.id("assets"),
    refreshType: v.union(v.literal("full"), v.literal("volatile"), v.literal("semiVolatile")),
    lockedAt: v.number(),
    lockedBy: v.string(), // Process ID or user ID
    status: v.union(v.literal("in_progress"), v.literal("completed"), v.literal("failed")),
    createdAt: v.number(),
  })
    .index("by_asset", ["assetId"])
    .index("by_asset_type", ["assetId", "refreshType"])
    .index("by_status", ["status"]),

  refresh_history: defineTable({
    assetId: v.id("assets"),
    refreshType: v.string(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
    apiCallsMade: v.number(),
    createdAt: v.number(),
  })
    .index("by_asset", ["assetId"])
    .index("by_time", ["completedAt"]),
});

