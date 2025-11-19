import { AiSectionSource, TokenRecord } from "@/types/token";

export type ScoreLookupPayload = {
  chainId: string;
  address: string;
};

export type ScoreLookupResult = {
  chainId: string;
  address: string;
  name?: string;
  symbol?: string;
  totalScore?: number;
  subScores?: Record<string, number>;
  updatedAt?: string;
};

export type TokenListParams = {
  chain?: string;
  category?: string;
  risk?: string;
  query?: string;
  sort?: "score" | "liquidity" | "alphabetical" | "holders" | "volume" | "risk" | "updated";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export type TokenListResponse = {
  items: TokenRecord[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  summary: {
    averageBenchmark: number;
    medianLiquidityUsd: number;
    totalLiquidityUsd: number;
    totalHolders: number;
    riskBreakdown: { low: number; medium: number; high: number };
    topLiquidity: TokenRecord[];
  };
};

export type AiSectionResponse = {
  sectionId: string;
  content: string;
  model?: string;
  tokensUsed?: number;
  updatedAt?: number;
  cached?: boolean;
  sources?: AiSectionSource[];
};

const DEFAULT_CONVEX_SITE = "https://nautical-rat-318.convex.site";

const API_BASE =
  process.env.NEXT_PUBLIC_CONVEX_SITE_URL?.replace(/\/$/, "") ?? DEFAULT_CONVEX_SITE;

export async function fetchScore(
  payload: ScoreLookupPayload,
  options?: { autoQueue?: boolean },
): Promise<ScoreLookupResult> {
  const url = new URL(`${API_BASE}/api/score`);
  url.searchParams.set("chainId", payload.chainId);
  url.searchParams.set("address", payload.address);

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    // If asset not found and autoQueue is enabled, automatically queue it for fetching
    if (response.status === 404 && options?.autoQueue !== false) {
      try {
        await requestRefresh(payload.chainId, payload.address);
        // Return a pending result indicating the asset has been queued
        return {
          chainId: payload.chainId,
          address: payload.address,
          totalScore: undefined,
          subScores: undefined,
        };
      } catch (refreshError) {
        // If queueing fails, still throw the original error
        throw new Error("Asset not found in the scoring index. Failed to queue for fetching.");
      }
    }
    const message =
      response.status === 404
        ? "Asset not found in the scoring index."
        : "Unable to fetch a scorecard right now.";
    throw new Error(message);
  }

  const body = await response.json();
  const asset = body.asset ?? {};
  const score = body.score ?? {};

  return {
    chainId: payload.chainId,
    address: payload.address,
    name: asset.name ?? asset.symbol,
    symbol: asset.symbol,
    totalScore: score.total,
    subScores: score.subScores,
    updatedAt: score.createdAt ? new Date(score.createdAt).toLocaleString() : undefined,
  };
}

export async function fetchTokens(params: TokenListParams = {}): Promise<TokenListResponse> {
  const url = new URL(`${API_BASE}/api/tokens`);

  if (params.chain && params.chain !== "all") url.searchParams.set("chain", params.chain);
  if (params.category && params.category !== "all") url.searchParams.set("category", params.category);
  if (params.risk && params.risk !== "all") url.searchParams.set("risk", params.risk);
  if (params.query) url.searchParams.set("query", params.query);
  if (params.sort) {
    const sortValue = params.sortDir ? `${params.sort}:${params.sortDir}` : params.sort;
    url.searchParams.set("sort", sortValue);
  }
  if (params.page) url.searchParams.set("page", params.page.toString());
  if (params.pageSize) url.searchParams.set("pageSize", params.pageSize.toString());

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch tokens: ${response.statusText}`);
  }

  return await response.json();
}

export async function fetchToken(tokenId: string): Promise<TokenRecord | null> {
  const url = new URL(`${API_BASE}/api/token`);
  url.searchParams.set("id", tokenId);

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to fetch token: ${response.statusText}`);
  }

  return await response.json();
}

export async function fetchReport(tokenId: string): Promise<TokenRecord | null> {
  const url = new URL(`${API_BASE}/api/report`);
  url.searchParams.set("tokenId", tokenId);
  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to fetch report: ${response.statusText}`);
  }
  return await response.json();
}

export async function generateReportSection(
  tokenId: string,
  section: string,
  context?: string,
  options?: { force?: boolean },
): Promise<AiSectionResponse> {
  const response = await fetch(`${API_BASE}/api/report/section`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tokenId,
      section,
      context,
      force: options?.force ?? false,
    }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || `Failed to generate section: ${response.statusText}`);
  }
  return await response.json();
}

export async function parseProjectWebsite(tokenId: string): Promise<any> {
  const url = `${API_BASE}/api/project/parse`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tokenId }),
  });
  return response.json();
}

/**
 * Refresh volatile market data (price, volume, listings) for a token
 */
export async function refreshMarketData(tokenId: string): Promise<{ success: boolean; apiCalls: number }> {
  const url = `${API_BASE}/api/tokens/${tokenId}/refresh-market-data`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "refresh-failed");
  }

  return response.json();
}

/**
 * Refresh semi-volatile data (holders, liquidity, governance, GitHub) for a token
 */
export async function refreshTokenStats(tokenId: string): Promise<{ success: boolean; apiCalls: number }> {
  const url = `${API_BASE}/api/tokens/${tokenId}/refresh-stats`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "refresh-failed");
  }

  return response.json();
}

export async function requestRefresh(chainId: string, address: string): Promise<{ enqueued: boolean }> {
  const response = await fetch(`${API_BASE}/api/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chainId, address }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || `Failed to request refresh: ${response.statusText}`);
  }

  return await response.json();
}

export async function parseProjectData(
  tokenId: string,
  options?: { force?: boolean },
): Promise<{ cached: boolean; data: any; error?: string }> {
  const response = await fetch(`${API_BASE}/api/project/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tokenId,
      force: options?.force ?? false,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || `Failed to parse project data: ${response.statusText}`);
  }

  return await response.json();
}

export async function fetchJsonLdUrl(chainId: string, address: string): Promise<string | null> {
  const url = new URL(`${API_BASE}/api/jsonld`);
  url.searchParams.set("chainId", chainId);
  url.searchParams.set("address", address);

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to fetch JSON-LD: ${response.statusText}`);
  }

  const body = await response.json();
  return body.url ?? null;
}

export function formatUsd(value: number, options: Intl.NumberFormatOptions = {}) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: value > 1_000_000_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
    ...options,
  }).format(value);
}

export function formatNumber(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "N/A";
  if (num >= 1e18) return `${(num / 1e18).toFixed(2)}B`;
  if (num >= 1e15) return `${(num / 1e15).toFixed(2)}T`;
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toLocaleString();
}

