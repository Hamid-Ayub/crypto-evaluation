import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { action, internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { caip19 } from "./_internal/normalize";
import { APP, SCORE_WEIGHTS, CALC_VERSION } from "./config";
import { FULL_CONFIDENCE } from "./_internal/scoring";
import { clamp } from "./_internal/math";

type RiskLevel = "low" | "medium" | "high";
type TokenCategory = "defi" | "l2" | "infrastructure" | "gaming" | "stablecoin";
type SortOption = "score" | "liquidity" | "alphabetical" | "holders" | "volume" | "risk" | "updated";
type SortDirection = "asc" | "desc";

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
  // Market data (contextual research information)
  marketData?: {
    launch?: {
      date?: number;
      marketCapUsd?: number;
      priceUsd?: number;
      source?: string;
      sourceUrl?: string;
    };
    current?: {
      marketCapUsd?: number;
      priceUsd?: number;
      volume24hUsd?: number;
      source?: string;
      sourceUrl?: string;
      updatedAt?: number;
    };
    listings?: ExchangeListing[];
  };
  projectProfile?: ProjectProfile;
  development?: DevelopmentOverview;
  aiSections?: Record<string, AiSectionEntry>;
  parsedProjectData?: any; // Parsed structured data from project websites
  aiReport?: {
    report: any;
    summary?: string;
    sources?: Array<{ id: number; title?: string; url: string; snippet?: string }>;
    updatedAt: number;
  };
  // Cross-validation info
  crossValidation?: {
    sources?: string[];
    status?: string; // e.g., "3 sources agree", "data conflict detected"
  };
  // Contract security information
  contract?: {
    verified: boolean;
    upgradeable: boolean;
    proxyType?: string;
    implementation?: string;
    proxyAdmin?: string;
    owner?: string;
    roles: Array<{ name: string; holder: string }>;
    pausable: boolean;
    timelock?: { address: string; delaySec: number };
    asOfBlock: number;
  };
  // Detailed holders information
  holdersDetail?: {
    totalSupply: string;
    freeFloat: string;
    topHolders: Array<{ address: string; pct: number; label?: string }>;
    top10Pct: number;
    top1Pct?: number;
    top3Pct?: number;
    contractSharePct?: number;
    eoaSharePct?: number;
    coveragePct?: number;
    sampleSize?: number;
    asOfBlock: number;
  };
  // Detailed liquidity information
  liquidityDetail?: {
    pools: Array<{ dex: string; poolAddress: string; tvlUsd: number; sharePct: number }>;
    cexSharePct?: number;
    asOfBlock: number;
  };
  // Detailed governance information
  governanceDetail?: {
    framework?: string;
    quorumPct?: number;
    turnoutHistory: Array<{ proposalId: string; turnoutPct: number; ts: number }>;
  };
  // Audit information
  audits?: Array<{
    firm: string;
    reportUrl: string;
    date: number;
    severitySummary?: string;
  }>;
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

type ExchangeListing = {
  exchange: string;
  pair: string;
  baseSymbol: string;
  targetSymbol: string;
  priceUsd?: number;
  volume24hUsd?: number;
  trustScore?: string;
  isDex?: boolean;
  lastTradedAt?: number;
  url?: string;
  source?: string;
  sourceUrl?: string;
};

type ProjectProfile = {
  githubRepos?: string[];
  website?: string;
  docs?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
};

type DevelopmentRepoStats = {
  repo: string;
  repoUrl: string;
  owner: string;
  name: string;
  description?: string;
  homepage?: string;
  license?: string;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  subscribers?: number;
  defaultBranch?: string;
  primaryLanguage?: string;
  topics?: string[];
  commitsLast4Weeks?: number;
  commitsThisYear?: number;
  avgWeeklyCommits?: number;
  contributorsCount?: number;
  lastCommitAt?: number;
  lastReleaseAt?: number;
  lastReleaseTag?: string;
  fetchedAt: number;
  source?: string;
  error?: string;
};

type DevelopmentOverview = {
  repos: DevelopmentRepoStats[];
};

type AiSectionEntry = {
  sectionId: string;
  content: string;
  model: string;
  tokensUsed?: number;
  updatedAt: number;
  sources?: Array<{
    id: number;
    title?: string;
    url: string;
    snippet?: string;
  }>;
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
  sortDir: SortDirection;
  page: number;
  pageSize: number;
};

const DEFAULT_PAGE_SIZE = 10;
const MIN_PAGE_SIZE = 5;
const MAX_PAGE_SIZE = 50;
const SORT_DEFAULT: SortOption = "score";
const SORT_OPTIONS: SortOption[] = ["score", "liquidity", "alphabetical", "holders", "volume", "risk", "updated"];
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
    const sorted = sortTokens(filtered, filters.sort, filters.sortDir);
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

    // If chainId is provided, search directly
    if (parsed.chainId) {
      const asset = await ctx.db
        .query("assets")
        .withIndex("by_chain_address", (q2) => q2.eq("chainId", parsed.chainId).eq("address", parsed.address))
        .unique();
      if (!asset) return null;
      return await buildTokenView(ctx, asset);
    }

    // If only address provided, search across all chains (prefer Ethereum first)
    const address = parsed.address;
    const preferredChains = ["eip155:1", "eip155:42161", "eip155:8453", "eip155:137", "eip155:10", "eip155:43114"];
    
    // Try preferred chains first
    for (const chainId of preferredChains) {
      const asset = await ctx.db
        .query("assets")
        .withIndex("by_chain_address", (q2) => q2.eq("chainId", chainId).eq("address", address))
        .unique();
      if (asset) {
        return await buildTokenView(ctx, asset);
      }
    }
    
    // Fallback: search all chains
    const cursor = ctx.db.query("assets");
    for await (const asset of cursor) {
      if (asset.address.toLowerCase() === address) {
        return await buildTokenView(ctx, asset);
      }
    }
    
    return null;
  },
});

function normalizeFilters(args: TokenListArgs): NormalizedFilters {
  const chain = args.chain && args.chain !== "all" ? args.chain : "all";
  const category = args.category && args.category !== "all" ? args.category : "all";
  const requestedRisk = (args.risk ?? "").toLowerCase() as RiskLevel;
  const risk = RISK_OPTIONS.includes(requestedRisk) ? requestedRisk : "all";
  const queryText = (args.query ?? "").trim().toLowerCase();
  
  // Parse sort and direction (format: "score:desc" or just "score")
  const sortInput = (args.sort ?? "").toLowerCase();
  const [sortPart, dirPart] = sortInput.split(":");
  const sortCandidate = sortPart as SortOption;
  const sort = SORT_OPTIONS.includes(sortCandidate) ? sortCandidate : SORT_DEFAULT;
  const sortDir: SortDirection = dirPart === "asc" || dirPart === "desc" ? dirPart : "desc";
  
  const page = Math.max(1, args.page ?? 1);
  const pageSize = clamp(args.pageSize ?? DEFAULT_PAGE_SIZE, MIN_PAGE_SIZE, MAX_PAGE_SIZE);

  return { chain, category, risk, query: queryText, sort, sortDir, page, pageSize };
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

function sortTokens(tokens: TokenView[], sort: SortOption, direction: SortDirection = "desc") {
  const list = [...tokens];
  const multiplier = direction === "asc" ? -1 : 1;
  
  switch (sort) {
    case "liquidity":
      return list.sort((a, b) => (b.liquidityUsd - a.liquidityUsd) * multiplier);
    case "alphabetical":
      return list.sort((a, b) => a.name.localeCompare(b.name) * multiplier);
    case "holders":
      return list.sort((a, b) => (b.holders - a.holders) * multiplier);
    case "volume":
      return list.sort((a, b) => (b.volume24hUsd - a.volume24hUsd) * multiplier);
    case "risk": {
      const riskOrder: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3 };
      return list.sort((a, b) => (riskOrder[b.risk] - riskOrder[a.risk]) * multiplier);
    }
    case "updated": {
      // Parse updatedAt as date string and compare
      return list.sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return (dateB - dateA) * multiplier;
      });
    }
    case "score":
    default:
      return list.sort((a, b) => (b.benchmarkScore - a.benchmarkScore) * multiplier);
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
  const [
    scoreHistory,
    holdersRows,
    liquidityRows,
    governanceRows,
    marketDataRows,
    contractRows,
    auditRows,
    projectProfileRows,
    developmentRows,
    aiSectionRows,
    aiReportRows,
  ] = await Promise.all([
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
    ctx.db
      .query("market_data")
      .withIndex("by_asset", (q2: any) => q2.eq("assetId", asset._id))
      .order("desc")
      .take(1),
    ctx.db
      .query("contracts")
      .withIndex("by_asset", (q2: any) => q2.eq("assetId", asset._id))
      .order("desc")
      .take(1),
    ctx.db
      .query("audits")
      .withIndex("by_asset", (q2: any) => q2.eq("assetId", asset._id))
      .order("desc")
      .take(50),
    ctx.db
      .query("project_profiles")
      .withIndex("by_asset", (q2: any) => q2.eq("assetId", asset._id))
      .take(1),
    ctx.db
      .query("development_stats")
      .withIndex("by_asset_repo", (q2: any) => q2.eq("assetId", asset._id))
      .order("desc")
      .take(10),
    ctx.db
      .query("ai_sections")
      .withIndex("by_asset_section", (q2: any) => q2.eq("assetId", asset._id))
      .collect(),
    ctx.db
      .query("ai_reports")
      .withIndex("by_asset", (q2: any) => q2.eq("assetId", asset._id))
      .take(1),
  ]);

  const latestScore = scoreHistory[0] ?? null;
  if (!latestScore) return null;

  const holders = holdersRows[0] ?? null;
  const liquidity = liquidityRows[0] ?? null;
  const governance = governanceRows[0] ?? null;
  const marketData = marketDataRows[0] ?? null;
  const contract = contractRows[0] ?? null;
  const audits = auditRows ?? [];
  const projectProfile = projectProfileRows[0] ?? null;
  const aiReport = aiReportRows[0] ?? null;

  const chainMeta = getChainMeta(asset.chainId);
  const category = inferCategory(asset, chainMeta.defaultCategory);
  const benchmarkScore = Math.round(latestScore.total ?? 0);
  const risk = riskFromScore(benchmarkScore);
  const liquidityUsd = computeLiquidityUsd(liquidity);
  
  // Use market data from CoinGecko if available, otherwise estimate
  const marketCapUsd = marketData?.marketCapUsd ?? estimateMarketCap(liquidityUsd);
  const volume24hUsd = marketData?.volume24hUsd ?? estimateVolume(liquidityUsd, marketCapUsd);
  const holdersCount = estimateHolders(holders);

  const id = caip19(asset.chainId, asset.standard ?? "erc20", asset.address);
  const summary = buildSummaryText(chainMeta.short, category, risk, benchmarkScore);
  const updatedAt = formatRelativeTime(latestScore.createdAt ?? asset.updatedAt);

  // Get avatar URL - prefer Convex storage, fallback to GitHub CDN, then emoji
  let avatarUrl: string | undefined;
  if (asset.iconStorageId) {
    // Get URL from Convex file storage (primary source)
    try {
      avatarUrl = await ctx.storage.getUrl(asset.iconStorageId);
    } catch (error) {
      // Fallback to GitHub CDN URL if storage URL fails
      avatarUrl = asset.iconUrl;
    }
  } else {
    // Use GitHub CDN URL if no storage ID
    avatarUrl = asset.iconUrl;
  }

  // Build market data object (contextual research information)
  const listings =
    marketData?.exchangeListings && marketData.exchangeListings.length > 0
      ? marketData.exchangeListings.map((listing) => ({
          exchange: listing.exchange,
          pair: listing.pair,
          baseSymbol: listing.baseSymbol,
          targetSymbol: listing.targetSymbol,
          priceUsd: listing.priceUsd,
          volume24hUsd: listing.volume24hUsd,
          trustScore: listing.trustScore,
          isDex: listing.isDex,
          lastTradedAt: listing.lastTradedAt,
          url: listing.url,
          source: listing.source,
          sourceUrl: listing.sourceUrl,
        }))
      : undefined;

  const hasLaunchData =
    Boolean(marketData?.launchDate) ||
    Boolean(marketData?.initialMarketCapUsd) ||
    Boolean(marketData?.initialPriceUsd);

  const hasCurrentData =
    Boolean(marketData?.marketCapUsd) ||
    Boolean(marketData?.priceUsd) ||
    Boolean(marketData?.volume24hUsd);

  const marketDataObj =
    marketData && (hasLaunchData || hasCurrentData || listings)
      ? {
          launch: hasLaunchData
            ? {
                date: marketData?.launchDate,
                marketCapUsd: marketData?.initialMarketCapUsd,
                priceUsd: marketData?.initialPriceUsd,
                source: marketData?.launchSource,
                sourceUrl: marketData?.launchSourceUrl,
              }
            : undefined,
          current: hasCurrentData
            ? {
                marketCapUsd: marketData?.marketCapUsd,
                priceUsd: marketData?.priceUsd,
                volume24hUsd: marketData?.volume24hUsd,
                source: marketData?.currentSource,
                sourceUrl: marketData?.currentSourceUrl,
                updatedAt: marketData?.updatedAt,
              }
            : undefined,
          listings,
        }
      : undefined;

  const projectProfileInfo = projectProfile
    ? {
        githubRepos: projectProfile.githubRepos,
        website: projectProfile.website,
        docs: projectProfile.docs,
        twitter: projectProfile.twitter,
        discord: projectProfile.discord,
        telegram: projectProfile.telegram,
      }
    : undefined;

  const development =
    developmentRows && developmentRows.length > 0
      ? {
          repos: developmentRows.map(
            (row: Doc<"development_stats">): DevelopmentRepoStats => ({
              repo: row.repo,
              repoUrl: row.repoUrl,
              owner: row.owner,
              name: row.name,
              description: row.description,
              homepage: row.homepage,
              license: row.license,
              stars: row.stars,
              forks: row.forks,
              watchers: row.watchers,
              openIssues: row.openIssues,
              subscribers: row.subscribers,
              defaultBranch: row.defaultBranch,
              primaryLanguage: row.primaryLanguage,
              topics: row.topics,
              commitsLast4Weeks: row.commitsLast4Weeks,
              commitsThisYear: row.commitsThisYear,
              avgWeeklyCommits: row.avgWeeklyCommits,
              contributorsCount: row.contributorsCount,
              lastCommitAt: row.lastCommitAt,
              lastReleaseAt: row.lastReleaseAt,
              lastReleaseTag: row.lastReleaseTag,
              fetchedAt: row.fetchedAt,
              source: row.source,
              error: row.error,
            }),
          ),
        }
      : undefined;

  const aiSections =
    aiSectionRows && aiSectionRows.length > 0
      ? aiSectionRows.reduce<Record<string, AiSectionEntry>>((acc, row: Doc<"ai_sections">) => {
          acc[row.sectionId] = {
            sectionId: row.sectionId,
            content: row.content,
            model: row.model,
            tokensUsed: row.tokensUsed ?? undefined,
            updatedAt: row.updatedAt,
            sources: row.sources
              ? row.sources.map((source) => ({
                  id: source.id,
                  title: source.title,
                  url: source.url,
                  snippet: source.snippet,
                }))
              : undefined,
          };
          return acc;
        }, {})
      : undefined;

  // Build cross-validation info from holders data
  const crossValidation = holders?.sources || holders?.crossValidationStatus ? {
    sources: holders.sources,
    status: holders.crossValidationStatus,
  } : undefined;

  // Build contract info
  const contractInfo = contract ? {
    verified: contract.verified,
    upgradeable: contract.upgradeable,
    proxyType: contract.proxyType,
    implementation: contract.implementation,
    proxyAdmin: contract.proxyAdmin,
    owner: contract.owner,
    roles: contract.roles,
    pausable: contract.pausable,
    timelock: contract.timelock,
    asOfBlock: contract.asOfBlock,
  } : undefined;

  // Build detailed holders info
  const holdersDetail = holders ? {
    totalSupply: holders.totalSupply,
    freeFloat: holders.freeFloat,
    topHolders: holders.topHolders,
    top10Pct: holders.top10Pct,
    top1Pct: holders.top1Pct,
    top3Pct: holders.top3Pct,
    contractSharePct: holders.contractSharePct,
    eoaSharePct: holders.eoaSharePct,
    coveragePct: holders.coveragePct,
    sampleSize: holders.sampleSize,
    asOfBlock: holders.asOfBlock,
  } : undefined;

  // Build detailed liquidity info
  const liquidityDetail = liquidity ? {
    pools: liquidity.pools,
    cexSharePct: liquidity.cexSharePct,
    asOfBlock: liquidity.asOfBlock,
  } : undefined;

  // Build detailed governance info
  const governanceDetail = governance ? {
    framework: governance.framework,
    quorumPct: governance.quorumPct,
    turnoutHistory: governance.turnoutHistory,
  } : undefined;

  // Build audits info
  const auditsInfo = audits.length > 0 ? audits.map(audit => ({
    firm: audit.firm,
    reportUrl: audit.reportUrl,
    date: audit.date,
    severitySummary: audit.severitySummary,
  })) : undefined;

  return {
    id,
    name: asset.name ?? asset.symbol ?? asset.address,
    symbol: asset.symbol ?? "-",
    chain: asset.chainId,
    chainLabel: chainMeta.short,
    address: asset.address,
    avatar: avatarUrl ?? pickAvatar(asset.symbol ?? asset.name ?? asset.address, category),
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
    marketData: marketDataObj,
    projectProfile: projectProfileInfo,
    development,
    aiSections,
    aiReport: aiReport ? {
      report: aiReport.report,
      summary: aiReport.summary,
      sources: aiReport.sources,
      updatedAt: aiReport.updatedAt
    } : undefined,
    parsedProjectData: asset.parsedProjectData,
    crossValidation,
    contract: contractInfo,
    holdersDetail,
    liquidityDetail,
    governanceDetail,
    audits: auditsInfo,
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
  
  // Check if it's just an address (0x...)
  const isAddressOnly = /^0x[a-fA-F0-9]{40}$/.test(tokenId.trim());
  if (isAddressOnly) {
    return { chainId: null, address: tokenId.trim().toLowerCase() };
  }
  
  // Check if it's CAIP-19 format (eip155:1:erc20:0x...)
  const parts = tokenId.split(":");
  if (parts.length >= 4 && parts[0] === "eip155") {
    const chainId = `${parts[0]}:${parts[1]}`;
    const address = parts.slice(3).join(":").toLowerCase();
    return { chainId, address };
  }
  
  return null;
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

export const marketDataByAsset = query({
  args: { assetId: v.id("assets") },
  handler: async (ctx, { assetId }) => {
    const rows = await ctx.db.query("market_data").withIndex("by_asset", q => q.eq("assetId", assetId)).order("desc").take(1);
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

export const getAiSection = query({
  args: { assetId: v.id("assets"), sectionId: v.string() },
  handler: async (ctx, { assetId, sectionId }) => {
    const rows = await ctx.db
      .query("ai_sections")
      .withIndex("by_asset_section", q => q.eq("assetId", assetId).eq("sectionId", sectionId))
      .take(1);
    return rows[0] ?? null;
  },
});

export const listAiSections = query({
  args: { assetId: v.id("assets") },
  handler: async (ctx, { assetId }) => {
    return await ctx.db
      .query("ai_sections")
      .withIndex("by_asset_section", q => q.eq("assetId", assetId))
      .collect();
  },
});

export const insertAiSectionLog = internalMutation({
  args: {
    assetId: v.id("assets"),
    sectionId: v.string(),
    status: v.string(),
    model: v.optional(v.string()),
    tokensUsed: v.optional(v.number()),
    latencyMs: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { assetId, sectionId, status, model, tokensUsed, latencyMs, error }) => {
    const now = Date.now();
    return await ctx.db.insert("ai_section_logs", {
      assetId,
      sectionId,
      status,
      model,
      tokensUsed,
      latencyMs,
      error,
      createdAt: now,
    });
  },
});

export const listAiSectionLogs = query({
  args: {
    assetId: v.id("assets"),
    sectionId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { assetId, sectionId, limit = 20 }) => {
    let query = ctx.db
      .query("ai_section_logs")
      .withIndex("by_asset_section", q => q.eq("assetId", assetId));
    if (sectionId) {
      query = query.filter(q => q.eq(q.field("sectionId"), sectionId));
    }
    const rows: Doc<"ai_section_logs">[] = [];
    for await (const row of query.order("desc")) {
      rows.push(row);
      if (rows.length >= limit) break;
    }
    return rows;
  },
});

export const getProjectProfile = query({
  args: { assetId: v.id("assets") },
  handler: async (ctx, { assetId }) => {
    const rows = await ctx.db.query("project_profiles").withIndex("by_asset", q => q.eq("assetId", assetId)).take(1);
    return rows[0] ?? null;
  },
});

export const listDevelopmentStats = query({
  args: { assetId: v.id("assets") },
  handler: async (ctx, { assetId }) => {
    return await ctx.db
      .query("development_stats")
      .withIndex("by_asset_repo", q => q.eq("assetId", assetId))
      .order("desc")
      .collect();
  },
});

export const ensureAsset = internalMutation({
  args: { chainId: v.string(), address: v.string(), standard: v.string(), symbol: v.optional(v.string()), name: v.optional(v.string()), decimals: v.optional(v.number()), iconUrl: v.optional(v.string()), iconStorageId: v.optional(v.id("_storage")), status: v.optional(v.string()) },
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
        iconStorageId: a.iconStorageId ?? existing.iconStorageId,
        standard: a.standard ?? existing.standard,
        status: a.status ?? existing.status ?? "active",
        updatedAt: now,
      });
      return existing._id;
    }
    return await ctx.db.insert("assets", {
      chainId: a.chainId, address, standard: a.standard, symbol: a.symbol, name: a.name, decimals: a.decimals, iconUrl: a.iconUrl, iconStorageId: a.iconStorageId, status: a.status ?? "active", createdAt: now, updatedAt: now,
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
    sources: v.optional(v.array(v.string())), // Multi-source tracking
    crossValidationStatus: v.optional(v.string()), // Cross-validation status
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

export const upsertMarketData = internalMutation({
  args: { 
    assetId: v.id("assets"), 
    data: v.object({
      launchDate: v.optional(v.number()),
      initialMarketCapUsd: v.optional(v.number()),
      initialPriceUsd: v.optional(v.number()),
      launchSource: v.optional(v.string()),
      launchSourceUrl: v.optional(v.string()),
      marketCapUsd: v.optional(v.number()),
      priceUsd: v.optional(v.number()),
      volume24hUsd: v.optional(v.number()),
      currentSource: v.optional(v.string()),
      currentSourceUrl: v.optional(v.string()),
      exchangeListings: v.optional(v.array(v.object({
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
      }))),
    })
  },
  handler: async (ctx, { assetId, data }) => {
    const now = Date.now();
    const existing = await ctx.db.query("market_data").withIndex("by_asset", q => q.eq("assetId", assetId)).order("desc").take(1);
    if (existing[0]) { 
      await ctx.db.patch(existing[0]._id, { 
        ...data, 
        updatedAt: now 
      }); 
      return existing[0]._id; 
    }
    return await ctx.db.insert("market_data", { 
      assetId, 
      ...data, 
      createdAt: now, 
      updatedAt: now 
    });
  },
});

export const upsertAiSection = internalMutation({
  args: {
    assetId: v.id("assets"),
    sectionId: v.string(),
    data: v.object({
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
    }),
  },
  handler: async (ctx, { assetId, sectionId, data }) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("ai_sections")
      .withIndex("by_asset_section", q => q.eq("assetId", assetId).eq("sectionId", sectionId))
      .take(1);
    if (existing[0]) {
      await ctx.db.patch(existing[0]._id, { ...data, updatedAt: now });
      return existing[0]._id;
    }
    return await ctx.db.insert("ai_sections", {
      assetId,
      sectionId,
      ...data,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const upsertAiReport = internalMutation({
  args: {
    assetId: v.id("assets"),
    report: v.any(),
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
  },
  handler: async (ctx, { assetId, report, summary, model, promptHash, tokensUsed, latencyMs, sourceDataHash, sources }) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("ai_reports")
      .withIndex("by_asset", q => q.eq("assetId", assetId))
      .take(1);
    
    if (existing[0]) {
      await ctx.db.patch(existing[0]._id, {
        report,
        summary,
        model,
        promptHash,
        tokensUsed,
        latencyMs,
        sourceDataHash,
        sources,
        updatedAt: now
      });
      return existing[0]._id;
    }
    
    return await ctx.db.insert("ai_reports", {
      assetId,
      report,
      summary,
      model,
      promptHash,
      tokensUsed,
      latencyMs,
      sourceDataHash,
      sources,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getAiReport = query({
  args: { assetId: v.id("assets") },
  handler: async (ctx, { assetId }) => {
    const rows = await ctx.db
      .query("ai_reports")
      .withIndex("by_asset", q => q.eq("assetId", assetId))
      .take(1);
    return rows[0] ?? null;
  },
});

export const upsertProjectProfile = internalMutation({
  args: {
    assetId: v.id("assets"),
    profile: v.object({
      githubRepos: v.optional(v.array(v.string())),
      website: v.optional(v.string()),
      docs: v.optional(v.string()),
      twitter: v.optional(v.string()),
      discord: v.optional(v.string()),
      telegram: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { assetId, profile }) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("project_profiles")
      .withIndex("by_asset", q => q.eq("assetId", assetId))
      .take(1);
    if (existing[0]) {
      await ctx.db.patch(existing[0]._id, { ...profile, updatedAt: now });
      return existing[0]._id;
    }
    return await ctx.db.insert("project_profiles", {
      assetId,
      ...profile,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const upsertDevelopmentStats = internalMutation({
  args: {
    assetId: v.id("assets"),
    repo: v.string(),
    data: v.object({
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
    }),
  },
  handler: async (ctx, { assetId, repo, data }) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("development_stats")
      .withIndex("by_asset_repo", q => q.eq("assetId", assetId).eq("repo", repo))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        ...data,
        repo,
        updatedAt: now,
      });
      return existing._id;
    }
    return await ctx.db.insert("development_stats", {
      assetId,
      repo,
      ...data,
      createdAt: now,
      updatedAt: now,
    });
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

// Get assets that haven't been synced to GitHub yet
export const getExistingByChainAddress = internalQuery({
  args: {
    chainAddresses: v.array(v.object({
      chainId: v.string(),
      address: v.string(),
    })),
  },
  handler: async (ctx, { chainAddresses }) => {
    const results: Array<{ chainId: string; address: string }> = [];
    
    for (const { chainId, address } of chainAddresses) {
      const normalizedAddress = address.toLowerCase();
      const asset = await ctx.db
        .query("assets")
        .withIndex("by_chain_address", q => 
          q.eq("chainId", chainId).eq("address", normalizedAddress)
        )
        .unique();
      
      if (asset) {
        results.push({ chainId, address: normalizedAddress });
      }
    }
    
    return results;
  },
});

export const getUnsyncedAssets = internalQuery({
  handler: async (ctx) => {
    return await ctx.db
      .query("assets")
      .filter((q) => 
        q.and(
          q.eq(q.field("status"), "active"),
          q.neq(q.field("iconStorageId"), undefined),
          q.or(
            q.eq(q.field("githubSynced"), undefined),
            q.eq(q.field("githubSynced"), false)
          )
        )
      )
      .collect();
  },
});

// Mark asset as synced to GitHub
export const markAssetSynced = internalMutation({
  args: {
    assetId: v.id("assets"),
    githubUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.assetId, {
      iconUrl: args.githubUrl,
      githubSynced: true,
      updatedAt: Date.now(),
    });
  },
});

// Update asset with icon storage ID
export const updateAssetIcon = internalMutation({
  args: {
    assetId: v.id("assets"),
    iconStorageId: v.id("_storage"),
    iconUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.assetId, {
      iconStorageId: args.iconStorageId,
      iconUrl: args.iconUrl,
      githubSynced: false, // Reset sync status when icon is updated
      updatedAt: Date.now(),
    });
  },
});

