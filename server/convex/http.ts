import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { analyzeContract, liquidityForToken, governanceForToken } from "./providers/index";

const router = httpRouter();

router.route({
  path: "/api/score",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const ip = req.headers.get("x-forwarded-for") ?? "anon";
    const rate = await ctx.runMutation(api.rateLimit.checkAndIncrement, { key: `ip:${ip}`, plan: "free" });
    if (!rate.ok) return new Response("Too many requests", { status: 429 });

    const url = new URL(req.url);
    const chainId = url.searchParams.get("chainId");
    const address = url.searchParams.get("address");
    if (!chainId || !address) return new Response("Missing params", { status: 400 });

    const asset = await ctx.runQuery(api.assets.getByChainAddress, { chainId, address });
    if (!asset) return new Response("Not found", { status: 404 });

    const score = await ctx.runQuery(api.assets.scorecard, { assetId: asset._id });
    return new Response(JSON.stringify({ asset, score }), { status: 200, headers: { "content-type": "application/json" } });
  }),
});

router.route({
  path: "/api/tokens",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const page = parseNumberParam(url.searchParams.get("page"));
    const pageSize = parseNumberParam(url.searchParams.get("pageSize"));
    const result = await ctx.runQuery(api.assets.listEnriched, {
      chain: url.searchParams.get("chain"),
      category: url.searchParams.get("category"),
      risk: url.searchParams.get("risk"),
      query: url.searchParams.get("query"),
      sort: url.searchParams.get("sort"),
      page: page ?? undefined,
      pageSize: pageSize ?? undefined,
    });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }),
});

router.route({
  path: "/api/token",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return new Response("Missing id", { status: 400 });
    const token = await ctx.runQuery(api.assets.getEnriched, { tokenId: id });
    if (!token) return new Response("Not found", { status: 404 });
    return new Response(JSON.stringify(token), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }),
});

router.route({
  path: "/api/refresh",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const ip = req.headers.get("x-forwarded-for") ?? "anon";
    const rate = await ctx.runMutation(api.rateLimit.checkAndIncrement, { key: `ip:${ip}`, plan: "free" });
    if (!rate.ok) return new Response("Too many requests", { status: 429 });

    const body = await req.json();
    const { chainId, address } = body || {};
    if (!chainId || !address) return new Response("Bad request", { status: 400 });

    let asset = await ctx.runQuery(api.assets.getByChainAddress, { chainId, address });
    if (!asset) {
      const id = await ctx.runMutation(internal.assets.ensureAsset, { chainId, address, standard: "erc20", status: "pending" });
      asset = await ctx.runQuery(api.assets.getAssetInternal, { assetId: id });
    }
    await ctx.runMutation(api.assets.requestRefresh, { assetId: asset!._id });
    return new Response(JSON.stringify({ enqueued: true }), { status: 200, headers: { "content-type": "application/json" } });
  }),
});

router.route({
  path: "/api/jsonld",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const chainId = url.searchParams.get("chainId");
    const address = url.searchParams.get("address");
    if (!chainId || !address) return new Response("Missing params", { status: 400 });

    const asset = await ctx.runQuery(api.assets.getByChainAddress, { chainId, address });
    if (!asset) return new Response("Not found", { status: 404 });

    const score = await ctx.runQuery(api.assets.scorecard, { assetId: asset._id });
    if (!score?.jsonldStorageId) return new Response("No JSON-LD", { status: 404 });

    const fileUrl = await ctx.storage.getUrl(score.jsonldStorageId);
    return new Response(JSON.stringify({ url: fileUrl }), { status: 200, headers: { "content-type": "application/json" } });
  }),
});

// New: security (EIP-1967 + roles)
router.route({
  path: "/api/contract/security",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const chainId = Number(url.searchParams.get("chainId"));
    const address = String(url.searchParams.get("address"));
    if (!chainId || !address) return new Response("Missing params", { status: 400 });
    try {
      const data = await analyzeContract(chainId, address as any);
      return new Response(JSON.stringify(data), { status: 200, headers: { "content-type": "application/json" } });
    } catch (e:any) {
      return new Response(JSON.stringify({ error: e?.message || "introspection-failed" }), { status: 500 });
    }
  }),
});

// New: liquidity (DeFiLlama pools + rough CEX/DEX split)
router.route({
  path: "/api/liquidity",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const chainName = String(url.searchParams.get("chainName") || "");
    const token = String(url.searchParams.get("token") || "");
    if (!chainName || !token) return new Response("Missing params", { status: 400 });
    try {
      const data = await liquidityForToken(chainName, token);
      return new Response(JSON.stringify(data), { status: 200, headers: { "content-type": "application/json" } });
    } catch (e:any) {
      return new Response(JSON.stringify({ error: e?.message || "liquidity-failed" }), { status: 500 });
    }
  }),
});

// New: governance (Snapshot + Tally discovery)
router.route({
  path: "/api/governance",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const chainId = Number(url.searchParams.get("chainId"));
    const token = String(url.searchParams.get("token") || "");
    if (!chainId || !token) return new Response("Missing params", { status: 400 });
    try {
      const data = await governanceForToken(chainId, token);
      return new Response(JSON.stringify(data), { status: 200, headers: { "content-type": "application/json" } });
    } catch (e:any) {
      return new Response(JSON.stringify({ error: e?.message || "governance-failed" }), { status: 500 });
    }
  }),
});

// Manual, immediate refresh (bypasses queue & cron)
router.route({
  path: "/api/refreshNow",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const ip = req.headers.get("x-forwarded-for") ?? "anon";
    const rate = await ctx.runMutation(api.rateLimit.checkAndIncrement, { key: `ip:${ip}`, plan: "free" });
    if (!rate.ok) return new Response("Too many requests", { status: 429 });

    const body = await req.json();
    const { chainId, address, standard, symbol, name, decimals } = body || {};
    if (!chainId || !address) return new Response("Bad request", { status: 400 });

    // Ensure asset exists (or upsert minimal metadata)
    const assetId = await ctx.runMutation(internal.assets.ensureAsset, {
      chainId,
      address,
      standard: standard ?? "erc20",
      symbol,
      name,
      decimals,
      status: "active",
    });

    // Ingest immediately and compute score
    const result = await ctx.runAction(internal.ingest.ingestAssetSnapshot, {
      chainId,
      address,
      standard: standard ?? "erc20",
      symbol,
      name,
      decimals,
    });

    // Trigger GitHub Actions workflow to download and store token assets
    // This runs asynchronously and doesn't block the response
    // Note: This triggers the workflow in the PRIVATE repo, which then pushes to PUBLIC assets repo
    if (process.env.GITHUB_TOKEN && process.env.PRIVATE_CODE_REPO) {
      const PRIVATE_CODE_REPO = process.env.PRIVATE_CODE_REPO; // Private repo where workflow runs
      const [owner, repo] = PRIVATE_CODE_REPO.split("/");
      
      fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
        method: "POST",
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_type: "token-added",
          client_payload: {
            chainId,
            address,
            symbol: symbol || result.assetId, // Use symbol if available
          },
        }),
      }).catch((err) => {
        // Log but don't fail - asset download is non-critical
        console.warn("Failed to trigger asset download workflow:", err);
      });
    }

    return new Response(JSON.stringify({ ok: true, assetId, ...result }), { status: 200, headers: { "content-type": "application/json" } });
  }),
});

// Debug endpoint to check cron status
router.route({
  path: "/api/jobs",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const stats = await ctx.runQuery(api.jobs.getJobStats, {});
    return new Response(JSON.stringify(stats), { status: 200, headers: { "content-type": "application/json" } });
  }),
});

// Manual trigger to test job processing (bypasses cron)
router.route({
  path: "/api/jobs/process",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const result = await ctx.runAction(internal.jobs.processQueue, {});
    return new Response(JSON.stringify(result), { status: 200, headers: { "content-type": "application/json" } });
  }),
});

function parseNumberParam(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default router;

