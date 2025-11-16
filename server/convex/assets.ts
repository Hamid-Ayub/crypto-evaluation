import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { action, internalAction, internalMutation, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { caip19 } from "./_internal/normalize";
import { APP, SCORE_WEIGHTS, CALC_VERSION } from "./config";
import { FULL_CONFIDENCE } from "./_internal/scoring";
import { clamp } from "./_internal/math";

type RiskLevel = "low" | "medium" | "high";
type TokenCategory = "defi" | "l2" | "infrastructure" | "gaming" | "stablecoin";
type SortOption = "score" | "liquidity" | "alphabetical";

export type TokenView = {
  id: string;
  name: string;
  symbol: string;
  chain: string;
  chainLabel: string;
  address: string;
  avatar: string;
  category: TokenCategory;
  risk: RiskLevel;
  benchmarkScore: number;
  benchmarkDetails: {
    gini: number;
    hhi: number;
    nakamoto: number;
    liquidity: number;
    governance: number;
    ownership: number;
    controlRisk: number;
  };
  marketCapUsd: number;
  liquidityUsd: number;
  holders: number;
  volume24hUsd: number;
  summary: string;
  updatedAt: string;
  tags: string[];
  sparkline: number[];
  stats: Array<{ label: string; value: string; delta: number }>;
};

type TokenListSummary = {
  averageBenchmark: number;
  medianLiquidityUsd: number;
  riskBreakdown: Record<RiskLevel, number>;
  topLiquidity: TokenView[];
};

type TokenListResponse = {
  items: TokenView[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
  summary: TokenListSummary;
};

type TokenListArgs = {
  chain?: string | null;
  category?: string | null;
  risk?: string | null;
  query?: string | null;
  sort?: string | null;
  page?: number | null;
  pageSize?: number | null;
};

type NormalizedFilters = {
  chain: string;
  category: string;
  risk: RiskLevel | "all";
  query: string;
  sort: SortOption;
  page: number;
  pageSize: number;
};

const DEFAULT_PAGE_SIZE = 10;
const MIN_PAGE_SIZE = 5;
const MAX_PAGE_SIZE = 50;
const SORT_DEFAULT: SortOption = "score";
const SORT_OPTIONS: SortOption[] = ["score", "liquidity", "alphabetical"];
const RISK_OPTIONS: RiskLevel[] = ["low", "medium", "high"];

const CHAIN_INFO: Record<string, { label: string; short: string; defaultCategory: TokenCategory }> = {
  "eip155:1": { label: "Ethereum Mainnet", short: "Ethereum", defaultCategory: "defi" },
  "eip155:10": { label: "Optimism", short: "Optimism", defaultCategory: "l2" },
  "eip155:137": { label: "Polygon", short: "Polygon", defaultCategory: "infrastructure" },
  "eip155:42161": { label: "Arbitrum One", short: "Arbitrum", defaultCategory: "l2" },
  "eip155:8453": { label: "Base", short: "Base", defaultCategory: "l2" },
  "eip155:43114": { label: "Avalanche", short: "Avalanche", defaultCategory: "defi" },
  "eip155:501": { label: "Solana", short: "Solana", defaultCategory: "gaming" },
};

const CATEGORY_EMOJIS: Record<TokenCategory, string[]> = {
  defi: ["🌀", "🛡️", "🌊"],
  l2: ["🌉", "⚡", "🛰️"],
  infrastructure: ["🧠", "⚙️", "🧱"],
  gaming: ["🎮", "🕹️", "🏆"],
  stablecoin: ["🪙", "💠", "💎"],
};

const FALLBACK_AVATARS = ["🛰️", "🚀", "📊", "🔮", "🧩", "📡", "🔐", "🪐"];

const USD_COMPACT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const USD_STANDARD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const listEnriched = query({
  args: {
    chain: v.optional(v.union(v.string(), v.null())),
    category: v.optional(v.union(v.string(), v.null())),
    risk: v.optional(v.union(v.string(), v.null())),
    query: v.optional(v.union(v.string(), v.null())),
    sort: v.optional(v.union(v.string(), v.null())),
    page: v.optional(v.union(v.number(), v.null())),
    pageSize: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args): Promise<TokenListResponse> => {
    const filters = normalizeFilters(args);

    const assets = await ctx.db
      .query("assets")
      .withIndex("by_status", (q2) => q2.eq("status", "active"))
      .collect();

    const tokens = (
      await Promise.all(assets.map((asset) => buildTokenView(ctx, asset)))
    ).filter((token): token is TokenView => Boolean(token));

    const filtered = tokens.filter((token) => matchesFilters(token, filters));
    const sorted = sortTokens(filtered, filters.sort);
    const { page, pageSize } = filters;

    const totalItems = sorted.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const start = (page - 1) * pageSize;
    const items = sorted.slice(start, start + pageSize);

    const summary = buildSummaryBlock(filtered);

    return {
      items,
      pagination: { page, pageSize, totalItems, totalPages },
      summary,
    };
  },
});

export const getEnriched = query({
  args: { tokenId: v.string() },
  handler: async (ctx, { tokenId }): Promise<TokenView | null> => {
    const parsed = parseTokenId(tokenId);
    if (!parsed) return null;

    const asset = await ctx.db
      .query("assets")
      .withIndex("by_chain_address", (q2) => q2.eq("chainId", parsed.chainId).eq("address", parsed.address))
      .unique();

    if (!asset) return null;
    return await buildTokenView(ctx, asset);
  },
});

function normalizeFilters(args: TokenListArgs): NormalizedFilters {
  const chain = args.chain && args.chain !== "all" ? args.chain : "all";
  const category = args.category && args.category !== "all" ? args.category : "all";
  const requestedRisk = (args.risk ?? "").toLowerCase() as RiskLevel;
  const risk = RISK_OPTIONS.includes(requestedRisk) ? requestedRisk : "all";
  const queryText = (args.query ?? "").trim().toLowerCase();
  const sortCandidate = (args.sort ?? "").toLowerCase() as SortOption;
  const sort = SORT_OPTIONS.includes(sortCandidate) ? sortCandidate : SORT_DEFAULT;
  const page = Math.max(1, args.page ?? 1);
  const pageSize = clamp(args.pageSize ?? DEFAULT_PAGE_SIZE, MIN_PAGE_SIZE, MAX_PAGE_SIZE);

  return { chain, category, risk, query: queryText, sort, page, pageSize };
}

function matchesFilters(token: TokenView, filters: NormalizedFilters) {
  if (filters.chain !== "all" && token.chain !== filters.chain) return false;
  if (filters.category !== "all" && token.category !== filters.category) return false;
  if (filters.risk !== "all" && token.risk !== filters.risk) return false;

  if (filters.query) {
    const haystack = [
      token.name,
      token.symbol,
      token.chainLabel,
      token.address,
      ...token.tags,
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(filters.query)) {
      return false;
    }
  }

  return true;
}

function sortTokens(tokens: TokenView[], sort: SortOption) {
  const list = [...tokens];
  switch (sort) {
    case "liquidity":
      return list.sort((a, b) => b.liquidityUsd - a.liquidityUsd);
    case "alphabetical":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    case "score":
    default:
      return list.sort((a, b) => b.benchmarkScore - a.benchmarkScore);
  }
}

function buildSummaryBlock(tokens: TokenView[]): TokenListSummary {
  if (tokens.length === 0) {
    return {
      averageBenchmark: 0,
      medianLiquidityUsd: 0,
      riskBreakdown: { low: 0, medium: 0, high: 0 },
      topLiquidity: [],
    };
  }

  const average =
    tokens.reduce((sum, token) => sum + token.benchmarkScore, 0) / tokens.length;

  const liquidityValues = tokens.map((token) => token.liquidityUsd).sort((a, b) => a - b);
  const median = liquidityValues[Math.floor(liquidityValues.length / 2)] ?? 0;

  const riskBreakdown: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0 };
  for (const token of tokens) {
    riskBreakdown[token.risk] += 1;
  }

  const topLiquidity = [...tokens].sort((a, b) => b.liquidityUsd - a.liquidityUsd).slice(0, 3);

  return {
    averageBenchmark: Number(average.toFixed(1)),
    medianLiquidityUsd: median,
    riskBreakdown,
    topLiquidity,
  };
}

async function buildTokenView(ctx: any, asset: Doc<"assets">): Promise<TokenView | null> {
  const [scoreHistory, holdersRows, liquidityRows, governanceRows] = await Promise.all([
    ctx.db
      .query("scores")
      .withIndex("by_asset_block", (q2: any) => q2.eq("assetId", asset._id))
      .order("desc")
      .take(10),
    ctx.db
      .query("holders_snapshot")
      .withIndex("by_asset_block", (q2: any) => q2.eq("assetId", asset._id))
      .order("desc")
      .take(1),
    ctx.db
      .query("liquidity")
      .withIndex("by_asset_block", (q2: any) => q2.eq("assetId", asset._id))
      .order("desc")
      .take(1),
    ctx.db
      .query("governance")
      .withIndex("by_asset", (q2: any) => q2.eq("assetId", asset._id))
      .order("desc")
      .take(1),
  ]);

  const latestScore = scoreHistory[0] ?? null;
  if (!latestScore) return null;

  const holders = holdersRows[0] ?? null;
  const liquidity = liquidityRows[0] ?? null;
  const governance = governanceRows[0] ?? null;

  const chainMeta = getChainMeta(asset.chainId);
  const category = inferCategory(asset, chainMeta.defaultCategory);
  const benchmarkScore = Math.round(latestScore.total ?? 0);
  const risk = riskFromScore(benchmarkScore);
  const liquidityUsd = computeLiquidityUsd(liquidity);
  const marketCapUsd = estimateMarketCap(liquidityUsd);
  const volume24hUsd = estimateVolume(liquidityUsd, marketCapUsd);
  const holdersCount = estimateHolders(holders);

  const id = caip19(asset.chainId, asset.standard ?? "erc20", asset.address);
  const summary = buildSummaryText(chainMeta.short, category, risk, benchmarkScore);
  const updatedAt = formatRelativeTime(latestScore.createdAt ?? asset.updatedAt);

  return {
    id,
    name: asset.name ?? asset.symbol ?? asset.address,
    symbol: asset.symbol ?? "-",
    chain: asset.chainId,
    chainLabel: chainMeta.short,
    address: asset.address,
    avatar: asset.iconUrl ?? pickAvatar(asset.symbol ?? asset.name ?? asset.address, category),
    category,
    risk,
    benchmarkScore,
    benchmarkDetails: buildBenchmarkDetails(latestScore, holders),
    marketCapUsd,
    liquidityUsd,
    holders: holdersCount,
    volume24hUsd,
    summary,
    updatedAt,
    tags: buildTags(chainMeta.short, risk, liquidityUsd, governance),
    sparkline: buildSparkline(scoreHistory),
    stats: buildStats(latestScore, scoreHistory[1], liquidityUsd),
  };
}

function getChainMeta(chainId: string) {
  return (
    CHAIN_INFO[chainId] ?? {
      label: chainId,
      short: chainId,
      defaultCategory: "infrastructure" as TokenCategory,
    }
  );
}

function inferCategory(asset: Doc<"assets">, fallback: TokenCategory): TokenCategory {
  if (CHAIN_INFO[asset.chainId]?.defaultCategory) {
    return CHAIN_INFO[asset.chainId].defaultCategory;
  }
  const symbol = (asset.symbol ?? "").toUpperCase();
  if (symbol.includes("USD") || symbol.includes("USDC") || symbol.includes("USDT")) {
    return "stablecoin";
  }
  if (symbol.includes("GAME") || symbol.includes("PLAY")) {
    return "gaming";
  }
  return fallback;
}

function pickAvatar(seed: string, category: TokenCategory) {
  const pool = CATEGORY_EMOJIS[category] ?? FALLBACK_AVATARS;
  const hash = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return pool[hash % pool.length];
}

function riskFromScore(score: number): RiskLevel {
  if (score >= 85) return "low";
  if (score >= 70) return "medium";
  return "high";
}

function formatRelativeTime(timestamp?: number) {
  if (!timestamp) return "n/a";
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function estimateMarketCap(liquidityUsd: number) {
  if (!liquidityUsd || liquidityUsd <= 0) return 0;
  return Math.round(liquidityUsd * 3);
}

function estimateVolume(liquidityUsd: number, marketCapUsd: number) {
  const liquidityComponent = liquidityUsd * 0.25;
  const marketComponent = marketCapUsd * 0.02;
  return Math.round(liquidityComponent + marketComponent);
}

function estimateHolders(snapshot?: Doc<"holders_snapshot"> | null) {
  if (!snapshot) return 0;
  if (typeof snapshot.sampleSize === "number" && snapshot.sampleSize > 0) {
    return snapshot.sampleSize * 1000;
  }
  if (Array.isArray(snapshot.topHolders) && snapshot.topHolders.length > 0) {
    return snapshot.topHolders.length * 800;
  }
  return 0;
}

function computeLiquidityUsd(liq?: Doc<"liquidity"> | null) {
  if (!liq?.pools) return 0;
  return Math.round(
    liq.pools.reduce((sum: number, pool: { tvlUsd: number }) => sum + (pool.tvlUsd ?? 0), 0),
  );
}

function buildBenchmarkDetails(
  score: Doc<"scores">,
  holders?: Doc<"holders_snapshot"> | null,
) {
  return {
    gini: holders?.gini ?? 0,
    hhi: holders?.hhi ?? 0,
    nakamoto: holders?.nakamotoCoeff ?? 0,
    liquidity: Math.round(score.subScores.liquidity ?? 0),
    governance: Math.round(score.subScores.governance ?? 0),
    ownership: Math.round(score.subScores.ownership ?? 0),
    controlRisk: Math.round(score.subScores.controlRisk ?? 0),
  };
}

function buildSparkline(scores: Doc<"scores">[]) {
  if (scores.length === 0) return [];
  return [...scores].reverse().map((row) => Math.round(row.total ?? 0));
}

function buildStats(
  current: Doc<"scores">,
  previous: Doc<"scores"> | undefined,
  liquidityUsd: number,
) {
  return [
    {
      label: "Ownership score",
      value: `${Math.round(current.subScores.ownership ?? 0)}/100`,
      delta: calcDelta(current.subScores.ownership, previous?.subScores.ownership),
    },
    {
      label: "Liquidity depth",
      value: formatUsdCompact(liquidityUsd),
      delta: calcDelta(current.subScores.liquidity, previous?.subScores.liquidity),
    },
    {
      label: "Governance score",
      value: `${Math.round(current.subScores.governance ?? 0)}/100`,
      delta: calcDelta(current.subScores.governance, previous?.subScores.governance),
    },
  ];
}

function calcDelta(current?: number, previous?: number) {
  if (typeof current !== "number") return 0;
  if (typeof previous !== "number") return 0;
  return Number((current - previous).toFixed(1));
}

function buildTags(
  chainLabel: string,
  risk: RiskLevel,
  liquidityUsd: number,
  governance?: Doc<"governance"> | null,
) {
  const riskTag =
    risk === "low" ? "Institutional ready" : risk === "medium" ? "Watchlist" : "Heightened risk";
  const tags = new Set<string>([chainLabel, riskTag]);
  if (liquidityUsd > 0) {
    tags.add(`${formatUsdCompact(liquidityUsd)} depth`);
  }
  if (governance?.framework) {
    tags.add(governance.framework);
  }
  return Array.from(tags).slice(0, 4);
}

function buildSummaryText(
  chainLabel: string,
  category: TokenCategory,
  risk: RiskLevel,
  score: number,
) {
  const riskCopy =
    risk === "low" ? "low dispersion risk" : risk === "medium" ? "balanced risk" : "heightened risk";
  return `${chainLabel} ${category} asset with ${riskCopy}, benchmark ${score}/100.`;
}

function formatUsdCompact(value: number) {
  if (!value || value < 1_000_000) {
    return USD_STANDARD.format(Math.max(0, value));
  }
  return USD_COMPACT.format(Math.max(0, value));
}

function parseTokenId(tokenId: string) {
  if (!tokenId) return null;
  const parts = tokenId.split(":");
  if (parts.length < 4) return null;
  const chainId = `${parts[0]}:${parts[1]}`;
  const address = parts.slice(3).join(":").toLowerCase();
  return { chainId, address };
}

export const search = query({
  args: { q: v.string(), chainId: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, { q, chainId, limit }) => {
    const l = Math.min(50, limit ?? 20);
    const term = q.trim().toLowerCase();
    const isAddr = /^0x[a-f0-9]{40}$/.test(term);
    const results: any[] = [];
    if (isAddr) {
      if (chainId) {
        const rows = await ctx.db.query("assets").withIndex("by_chain_address", q2 => 
          q2.eq("chainId", chainId).eq("address", term)
        ).take(10);
        return rows;
      } else {
        // If no chainId, search across all chains by address
        const cursor = ctx.db.query("assets");
        for await (const a of cursor) {
          if (a.address.toLowerCase() === term) {
            results.push(a);
            if (results.length >= 10) break;
          }
        }
        return results;
      }
    }
    const cursor = ctx.db.query("assets");
    for await (const a of cursor) {
      if ((!chainId || a.chainId === chainId) && (
        (a.symbol && a.symbol.toLowerCase().includes(term)) ||
        (a.name && a.name.toLowerCase().includes(term))
      )) {
        results.push(a);
        if (results.length >= l) break;
      }
    }
    return results;
  },
});

export const getByChainAddress = query({
  args: { chainId: v.string(), address: v.string() },
  handler: async (ctx, { chainId, address }) => {
    address = address.toLowerCase();
    return await ctx.db.query("assets").withIndex("by_chain_address", q => q.eq("chainId", chainId).eq("address", address)).unique();
  },
});

export const scorecard = query({
  args: { assetId: v.id("assets") },
  handler: async (ctx, { assetId }) => {
    const scores = await ctx.db.query("scores").withIndex("by_asset_block", q => q.eq("assetId", assetId)).order("desc").take(1);
    return scores[0] ?? null;
  },
});

export const compare = query({
  args: { assetIds: v.array(v.id("assets")) },
  handler: async (ctx, { assetIds }) => {
    const out: Array<{ asset: any; score: any }> = [];
    for (const assetId of assetIds) {
      const asset = await ctx.db.get(assetId);
      if (!asset) continue;
      const score = await ctx.db.query("scores").withIndex("by_asset_block", q => q.eq("assetId", assetId)).order("desc").take(1);
      out.push({ asset, score: score[0] ?? null });
    }
    return out;
  },
});

export const requestRefresh = mutation({
  args: { assetId: v.id("assets") },
  handler: async (ctx, { assetId }) => {
    const now = Date.now();
    await ctx.db.insert("jobs", { type: "refresh_asset", params: { assetId: assetId as any }, status: "queued", createdAt: now, updatedAt: now });
    return { enqueued: true };
  },
});

export const getAssetInternal = query({ args: { assetId: v.id("assets") }, handler: async (ctx, { assetId }) => ctx.db.get(assetId) });

export const getScoreInternal = query({ args: { scoreId: v.id("scores") }, handler: async (ctx, { scoreId }) => ctx.db.get(scoreId) });

export const latestHolders = query({
  args: { assetId: v.id("assets") },
  handler: async (ctx, { assetId }) => {
    const rows = await ctx.db.query("holders_snapshot").withIndex("by_asset_block", q => q.eq("assetId", assetId)).order("desc").take(1);
    return rows[0] ?? null;
  },
});

export const latestContract = query({
  args: { assetId: v.id("assets") },
  handler: async (ctx, { assetId }) => {
    const rows = await ctx.db.query("contracts").withIndex("by_asset", q => q.eq("assetId", assetId)).order("desc").take(1);
    return rows[0] ?? null;
  },
});

export const latestLiquidity = query({
  args: { assetId: v.id("assets") },
  handler: async (ctx, { assetId }) => {
    const rows = await ctx.db.query("liquidity").withIndex("by_asset_block", q => q.eq("assetId", assetId)).order("desc").take(1);
    return rows[0] ?? null;
  },
});

export const governanceByAsset = query({
  args: { assetId: v.id("assets") },
  handler: async (ctx, { assetId }) => {
    const rows = await ctx.db.query("governance").withIndex("by_asset", q => q.eq("assetId", assetId)).order("desc").take(1);
    return rows[0] ?? null;
  },
});

export const chainStatsByChainId = query({
  args: { chainId: v.string() },
  handler: async (ctx, { chainId }) => {
    const rows = await ctx.db.query("chain_stats").withIndex("by_chain", q => q.eq("chainId", chainId)).order("desc").take(1);
    return rows[0] ?? null;
  },
});

export const auditsByAsset = query({
  args: { assetId: v.id("assets") },
  handler: async (ctx, { assetId }) => {
    return await ctx.db.query("audits").withIndex("by_asset", q => q.eq("assetId", assetId)).collect();
  },
});

export const ensureAsset = internalMutation({
  args: { chainId: v.string(), address: v.string(), standard: v.string(), symbol: v.optional(v.string()), name: v.optional(v.string()), decimals: v.optional(v.number()), iconUrl: v.optional(v.string()), status: v.optional(v.string()) },
  handler: async (ctx, a) => {
    const now = Date.now();
    const address = a.address.toLowerCase();
    const existing = await ctx.db.query("assets").withIndex("by_chain_address", q => q.eq("chainId", a.chainId).eq("address", address)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        symbol: a.symbol ?? existing.symbol,
        name: a.name ?? existing.name,
        decimals: a.decimals ?? existing.decimals,
        iconUrl: a.iconUrl ?? existing.iconUrl,
        standard: a.standard ?? existing.standard,
        status: a.status ?? existing.status ?? "active",
        updatedAt: now,
      });
      return existing._id;
    }
    return await ctx.db.insert("assets", {
      chainId: a.chainId, address, standard: a.standard, symbol: a.symbol, name: a.name, decimals: a.decimals, iconUrl: a.iconUrl, status: a.status ?? "active", createdAt: now, updatedAt: now,
    });
  },
});

export const insertContract = internalMutation({
  args: { assetId: v.id("assets"), data: v.object({
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
  })},
  handler: async (ctx, { assetId, data }) => {
    const now = Date.now();
    return await ctx.db.insert("contracts", { assetId, ...data, createdAt: now, updatedAt: now });
  },
});

export const insertHolders = internalMutation({
  args: { assetId: v.id("assets"), data: v.object({
    asOfBlock: v.number(),
    totalSupply: v.string(),
    freeFloat: v.string(),
    top10Pct: v.number(),
    hhi: v.number(),
    nakamotoCoeff: v.number(),
    topHolders: v.array(v.object({ address: v.string(), pct: v.number(), label: v.optional(v.string()) })),
    top1Pct: v.optional(v.number()),
    top3Pct: v.optional(v.number()),
    gini: v.optional(v.number()),
    contractSharePct: v.optional(v.number()),
    eoaSharePct: v.optional(v.number()),
    coveragePct: v.optional(v.number()),
    sampleSize: v.optional(v.number()),
    source: v.optional(v.string()),
    // Token metadata fields (not stored in holders_snapshot table, just passed through)
    symbol: v.optional(v.string()),
    name: v.optional(v.string()),
    decimals: v.optional(v.number()),
    iconUrl: v.optional(v.string()),
  })},
  handler: async (ctx, { assetId, data }) => {
    const now = Date.now();
    // Extract metadata fields before inserting (they don't belong in holders_snapshot table)
    const { symbol, name, decimals, iconUrl, ...holdersData } = data;
    return await ctx.db.insert("holders_snapshot", { assetId, ...holdersData, createdAt: now });
  },
});

export const insertLiquidity = internalMutation({
  args: { assetId: v.id("assets"), data: v.object({
    asOfBlock: v.number(),
    pools: v.array(v.object({ dex: v.string(), poolAddress: v.string(), tvlUsd: v.number(), sharePct: v.number() })),
    cexSharePct: v.optional(v.number()),
  })},
  handler: async (ctx, { assetId, data }) => {
    const now = Date.now();
    return await ctx.db.insert("liquidity", { assetId, ...data, createdAt: now });
  },
});

export const upsertGovernance = internalMutation({
  args: { assetId: v.id("assets"), data: v.object({
    framework: v.optional(v.string()),
    quorumPct: v.optional(v.number()),
    turnoutHistory: v.array(v.object({ proposalId: v.string(), turnoutPct: v.number(), ts: v.number() })),
  })},
  handler: async (ctx, { assetId, data }) => {
    const now = Date.now();
    const existing = await ctx.db.query("governance").withIndex("by_asset", q => q.eq("assetId", assetId)).order("desc").take(1);
    if (existing[0]) { await ctx.db.patch(existing[0]._id, { ...data, updatedAt: now }); return existing[0]._id; }
    return await ctx.db.insert("governance", { assetId, ...data, createdAt: now, updatedAt: now });
  },
});

export const upsertChainStats = internalMutation({
  args: { chainId: v.string(), data: v.object({
    validators: v.optional(v.number()),
    topValidatorsPct: v.optional(v.number()),
    nakamotoCoeff: v.optional(v.number()),
  })},
  handler: async (ctx, { chainId, data }) => {
    const now = Date.now();
    const existing = await ctx.db.query("chain_stats").withIndex("by_chain", q => q.eq("chainId", chainId)).order("desc").take(1);
    if (existing[0]) { await ctx.db.patch(existing[0]._id, { ...data, updatedAt: now }); return existing[0]._id; }
    return await ctx.db.insert("chain_stats", { chainId, ...data, updatedAt: now });
  },
});

export const insertAudit = internalMutation({
  args: { assetId: v.id("assets"), firm: v.string(), reportUrl: v.string(), date: v.number(), severitySummary: v.optional(v.string()) },
  handler: async (ctx, a) => await ctx.db.insert("audits", { assetId: a.assetId, firm: a.firm, reportUrl: a.reportUrl, date: a.date, severitySummary: a.severitySummary, createdAt: Date.now() }),
});

export const insertScore = internalMutation({
  args: { assetId: v.id("assets"), asOfBlock: v.number(), subScores: v.object({
    ownership: v.number(),
    controlRisk: v.number(),
    liquidity: v.number(),
    governance: v.number(),
    chainLevel: v.number(),
    codeAssurance: v.number(),
  }), total: v.number(), weights: v.optional(v.object({
    ownership: v.number(),
    controlRisk: v.number(),
    liquidity: v.number(),
    governance: v.number(),
    chainLevel: v.number(),
    codeAssurance: v.number(),
  })), confidence: v.optional(v.object({
    ownership: v.number(),
    controlRisk: v.number(),
    liquidity: v.number(),
    governance: v.number(),
    chainLevel: v.number(),
    codeAssurance: v.number(),
  })) },
  handler: async (ctx, { assetId, asOfBlock, subScores, total, weights, confidence }) => {
    const now = Date.now();
    const storedWeights = weights ?? { ...SCORE_WEIGHTS };
    const storedConfidence = confidence ?? { ...FULL_CONFIDENCE };
    return await ctx.db.insert("scores", {
      assetId,
      asOfBlock,
      subScores,
      total,
      calcVersion: CALC_VERSION,
      weights: storedWeights,
      confidence: storedConfidence,
      createdAt: now,
    });
  },
});

export const updateScoreJsonLd = internalMutation({
  args: { scoreId: v.id("scores"), jsonldStorageId: v.id("_storage") },
  handler: async (ctx, { scoreId, jsonldStorageId }) => {
    await ctx.db.patch(scoreId, { jsonldStorageId });
  },
});

export const materializeJsonLd = internalAction({
  args: { assetId: v.id("assets"), scoreId: v.id("scores") },
  handler: async (ctx, { assetId, scoreId }) => {
    const asset = await ctx.runQuery(api.assets.getAssetInternal, { assetId });
    const score = await ctx.runQuery(api.assets.getScoreInternal, { scoreId });
    if (!asset || !score) throw new Error("Cannot materialize JSON-LD");

    const [holders, contract, liquidity, gov] = await Promise.all([
      ctx.runQuery(api.assets.latestHolders, { assetId }),
      ctx.runQuery(api.assets.latestContract, { assetId }),
      ctx.runQuery(api.assets.latestLiquidity, { assetId }),
      ctx.runQuery(api.assets.governanceByAsset, { assetId }),
    ]);

    const jsonld = {
      "@context": ["https://schema.org", { chain: APP.jsonldNamespace }],
      "@type": "chain:Scorecard",
      identifier: caip19(asset.chainId, asset.standard ?? "erc20", asset.address),
      name: `${asset.name ?? asset.symbol ?? asset.address} Decentralization Score`,
      dateModified: new Date(score.createdAt).toISOString(),
      "chain:score": score.total,
      "chain:subScores": score.subScores,
      "chain:evidence": { holders, contract, liquidity, governance: gov },
    };
    if (score.weights) {
      (jsonld as any)["chain:weights"] = score.weights;
    }
    if (score.confidence) {
      (jsonld as any)["chain:confidence"] = score.confidence;
    }

    const storageId = await ctx.storage.store(new Blob([JSON.stringify(jsonld, null, 2)], { type: "application/json" }));
    await ctx.runMutation(internal.assets.updateScoreJsonLd, { scoreId, jsonldStorageId: storageId });
    const url = await ctx.storage.getUrl(storageId);
    return { jsonldStorageId: storageId, url };
  },
});

