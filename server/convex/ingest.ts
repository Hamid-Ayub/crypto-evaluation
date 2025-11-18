import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { ProviderAdapter } from "./providers/types";
import { lookupProjectMetadata } from "./projectMetadata";

async function loadComposite(): Promise<ProviderAdapter> {
  const mod = await import("./providers/composite");
  return (mod.compositeAdapter as ProviderAdapter);
}

type Settled<T> = { ok: true; v: T } | { ok: false; e: any };
const settle = async <T>(p: Promise<T>): Promise<Settled<T>> => {
  try { return { ok: true, v: await p }; } catch (e) { return { ok: false, e }; }
};

/**
 * Converts Ethplorer icon URL to GitHub CDN URL
 * Uses PUBLIC assets repo (separate from private code repo)
 * Structure: tokens/{chainId}/{address}/icon.png
 * Format: https://raw.githubusercontent.com/{public-repo}/{branch}/tokens/{chainId}/{address}/icon.png
 */
function toGitHubCdnUrl(
  iconUrl: string | undefined,
  chainId: string,
  address: string,
  symbol?: string
): string | undefined {
  if (!iconUrl) return undefined;

  // Use public assets repo (separate from private code repo)
  const PUBLIC_ASSETS_REPO = process.env.PUBLIC_ASSETS_REPO || "Hamid-Ayub/blockchain-assets";
  const PUBLIC_ASSETS_BRANCH = process.env.PUBLIC_ASSETS_BRANCH || "main";
  const chainIdNum = chainId.replace("eip155:", "");
  const normalizedAddress = address.toLowerCase().replace(/^0x/, "");
  
  // Extract extension from original URL or default to png
  const urlExt = iconUrl.split(".").pop()?.split("?")[0].toLowerCase() || "png";
  const ext = ["png", "jpg", "jpeg", "svg", "webp"].includes(urlExt) ? urlExt : "png";
  
  // New structure: tokens/{chainId}/{address}/icon.{ext}
  return `https://raw.githubusercontent.com/${PUBLIC_ASSETS_REPO}/${PUBLIC_ASSETS_BRANCH}/tokens/${chainIdNum}/${normalizedAddress}/icon.${ext}`;
}

export const ingestAssetSnapshot = action({
  args: { 
    chainId: v.string(), 
    address: v.string(), 
    standard: v.optional(v.string()), 
    symbol: v.optional(v.string()), 
    name: v.optional(v.string()), 
    decimals: v.optional(v.number()) 
  },
  handler: async (ctx, args) => {
    const adapter = await loadComposite();
    const { chainId, address } = args;

    const [c, h, l, g, cs, au] = await Promise.all([
      settle(adapter.getContractInfo!(chainId, address)),
      settle(adapter.getHoldersSnapshot!(chainId, address)),
      settle(adapter.getLiquidityInfo!(chainId, address)),
      settle(adapter.getGovernanceInfo!(chainId, address)),
      settle(adapter.getChainStats!(chainId)),
      settle(adapter.getAudits ? adapter.getAudits(chainId, address) : Promise.resolve([] as any)),
    ]);

    // Fetch market data (launch + current snapshot + exchange listings) from CoinGecko
    const [launchData, currentData, listingsData] = await Promise.all([
      settle((async () => {
        const { fetchLaunchMarketData } = await import("./providers/coingecko");
        return fetchLaunchMarketData(chainId, address);
      })()),
      settle((async () => {
        const { fetchCurrentMarketData } = await import("./providers/coingecko");
        return fetchCurrentMarketData(chainId, address);
      })()),
      settle((async () => {
        const { fetchExchangeListings } = await import("./providers/coingecko");
        return fetchExchangeListings(chainId, address);
      })()),
    ]);

    // Extract metadata from holders snapshot if available
    const metadata = h.ok ? {
      symbol: args.symbol ?? h.v.symbol,
      name: args.name ?? h.v.name,
      decimals: args.decimals ?? h.v.decimals,
      iconUrl: h.v.iconUrl,
    } : {
      symbol: args.symbol,
      name: args.name,
      decimals: args.decimals,
      iconUrl: undefined,
    };

    // Download and store asset icon in Convex file storage immediately
    let iconStorageId: string | undefined;
    let convexIconUrl: string | undefined;
    
    if (metadata.iconUrl || metadata.symbol) {
      const assetResult = await ctx.runAction(internal.assetDownload.downloadAndStoreAsset, {
        chainId,
        address,
        symbol: metadata.symbol,
        iconUrl: metadata.iconUrl,
      });
      
      if (assetResult) {
        iconStorageId = assetResult.storageId;
        convexIconUrl = assetResult.url;
      }
    }

    // Generate GitHub CDN URL for backup (will be synced later)
    const githubIconUrl = toGitHubCdnUrl(
      metadata.iconUrl,
      chainId,
      address,
      metadata.symbol
    );

    const assetId = await ctx.runMutation(internal.assets.ensureAsset, {
      chainId, 
      address, 
      standard: args.standard ?? "erc20", 
      symbol: metadata.symbol, 
      name: metadata.name, 
      decimals: metadata.decimals, 
      iconUrl: githubIconUrl, // GitHub CDN URL (backup, synced later)
      iconStorageId, // Convex file storage ID (primary)
      status: "active",
    });

    const seededProfile = lookupProjectMetadata(chainId, address, args.standard ?? "erc20");
    let projectProfile = await ctx.runQuery(api.assets.getProjectProfile, { assetId });
    if (!projectProfile && seededProfile) {
      await ctx.runMutation(internal.assets.upsertProjectProfile, {
        assetId,
        profile: seededProfile,
      });
      projectProfile = await ctx.runQuery(api.assets.getProjectProfile, { assetId });
    }
    const githubRepos =
      projectProfile?.githubRepos ??
      seededProfile?.githubRepos ??
      [];

    if (c.ok) await ctx.runMutation(internal.assets.insertContract, { assetId, data: c.v });
    if (h.ok) await ctx.runMutation(internal.assets.insertHolders, { assetId, data: h.v });
    if (l.ok) await ctx.runMutation(internal.assets.insertLiquidity, { assetId, data: l.v });
    if (g.ok) await ctx.runMutation(internal.assets.upsertGovernance, { assetId, data: g.v });
    if (cs.ok) await ctx.runMutation(internal.assets.upsertChainStats, { chainId, data: cs.v });
    if (au.ok && Array.isArray(au.v)) {
      for (const a of au.v) await ctx.runMutation(internal.assets.insertAudit, { assetId, firm: a.firm, reportUrl: a.reportUrl, date: a.date, severitySummary: a.severitySummary });
    }

    // Store market data (launch + current snapshot)
    const hasListings = listingsData.ok && Array.isArray(listingsData.v) && listingsData.v.length > 0;

    if ((launchData.ok && launchData.v) || (currentData.ok && currentData.v) || hasListings) {
      await ctx.runMutation(internal.assets.upsertMarketData, {
        assetId,
        data: {
          ...(launchData.ok && launchData.v ? {
            launchDate: launchData.v.launchDate,
            initialMarketCapUsd: launchData.v.initialMarketCapUsd,
            initialPriceUsd: launchData.v.initialPriceUsd,
            launchSource: launchData.v.source,
            launchSourceUrl: launchData.v.sourceUrl,
          } : {}),
          ...(currentData.ok && currentData.v ? {
            marketCapUsd: currentData.v.marketCapUsd,
            priceUsd: currentData.v.priceUsd,
            volume24hUsd: currentData.v.volume24hUsd,
            currentSource: currentData.v.source,
            currentSourceUrl: currentData.v.sourceUrl,
          } : {}),
          ...(hasListings ? { exchangeListings: listingsData.v ?? [] } : {}),
        },
      });
    }

    if (githubRepos.length > 0) {
      const repoStatsResults = await Promise.allSettled(
        githubRepos.map(async (repoInput) => {
          const { getGitHubStats } = await import("./providers/github");
          return getGitHubStats(repoInput);
        }),
      );

      for (let i = 0; i < githubRepos.length; i++) {
        const repoInput = githubRepos[i];
        const result = repoStatsResults[i];
        if (result?.status === "fulfilled" && result.value) {
          const stats = result.value;
          await ctx.runMutation(internal.assets.upsertDevelopmentStats, {
            assetId,
            repo: stats.repo,
            data: {
              repoUrl: stats.repoUrl,
              owner: stats.owner,
              name: stats.name,
              description: stats.description,
              homepage: stats.homepage,
              license: stats.license,
              stars: stats.stars,
              forks: stats.forks,
              watchers: stats.watchers,
              openIssues: stats.openIssues,
              subscribers: stats.subscribers,
              defaultBranch: stats.defaultBranch,
              primaryLanguage: stats.primaryLanguage,
              topics: stats.topics,
              commitsLast4Weeks: stats.commitsLast4Weeks,
              commitsThisYear: stats.commitsThisYear,
              avgWeeklyCommits: stats.avgWeeklyCommits,
              contributorsCount: stats.contributorsCount,
              lastCommitAt: stats.lastCommitAt,
              lastReleaseAt: stats.lastReleaseAt,
              lastReleaseTag: stats.lastReleaseTag,
              fetchedAt: stats.fetchedAt,
              source: "github",
              error: undefined,
            },
          });
        } else {
          const [owner = "", name = ""] = repoInput.replace("https://github.com/", "").replace("git@github.com:", "").replace(".git", "").split("/").filter(Boolean);
          await ctx.runMutation(internal.assets.upsertDevelopmentStats, {
            assetId,
            repo: owner && name ? `${owner}/${name}` : repoInput,
            data: {
              repoUrl: repoInput.startsWith("http") ? repoInput : `https://github.com/${repoInput}`,
              owner: owner || repoInput,
              name: name || repoInput,
              description: undefined,
              homepage: undefined,
              license: undefined,
              stars: 0,
              forks: 0,
              watchers: 0,
              openIssues: 0,
              subscribers: undefined,
              defaultBranch: undefined,
              primaryLanguage: undefined,
              topics: undefined,
              commitsLast4Weeks: undefined,
              commitsThisYear: undefined,
              avgWeeklyCommits: undefined,
              contributorsCount: undefined,
              lastCommitAt: undefined,
              lastReleaseAt: undefined,
              lastReleaseTag: undefined,
              fetchedAt: Date.now(),
              source: "github",
              error: result?.status === "rejected" ? (result.reason as Error)?.message ?? "github-fetch-error" : "github-missing-data",
            },
          });
        }
      }
    }

    const asOfBlock = Math.max(c.ok ? c.v.asOfBlock : 0, h.ok ? h.v.asOfBlock : 0, l.ok ? l.v.asOfBlock : 0);
    const result = await ctx.runAction(internal.compute.computeAndStore, { assetId, asOfBlock });
    return { assetId, scoreId: result.scoreId, jsonldStorageId: result.jsonldStorageId, jsonldUrl: result.url };
  },
});

