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
    const address = url.searchParams.get("address");
    const chainId = url.searchParams.get("chainId");
    
    // Support both id (CAIP-19 or address) and address+chainId params
    let tokenId: string | null = null;
    if (id) {
      tokenId = id;
    } else if (address) {
      // If address provided, construct tokenId
      if (chainId) {
        tokenId = `${chainId}:erc20:${address}`;
      } else {
        tokenId = address; // Address-only, will search across chains
      }
    }
    
    if (!tokenId) return new Response("Missing id or address", { status: 400 });
    
    const token = await ctx.runQuery(api.assets.getEnriched, { tokenId });
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
    try {
      const ip = req.headers.get("x-forwarded-for") ?? "anon";
      const rate = await ctx.runMutation(api.rateLimit.checkAndIncrement, { key: `ip:${ip}`, plan: "free" });
      if (!rate.ok) {
        return new Response(JSON.stringify({ error: "Too many requests" }), { 
          status: 429, 
          headers: { "content-type": "application/json" } 
        });
      }

      const body = await req.json();
      const { chainId, address } = body || {};
      if (!chainId || !address) {
        return new Response(JSON.stringify({ error: "Missing chainId or address" }), { 
          status: 400, 
          headers: { "content-type": "application/json" } 
        });
      }

      // Normalize address
      const normalizedAddress = address.toLowerCase().trim();
      
      let asset = await ctx.runQuery(api.assets.getByChainAddress, { 
        chainId: chainId.trim(), 
        address: normalizedAddress 
      });
      
      if (!asset) {
        // Create asset if it doesn't exist
        const assetId = await ctx.runMutation(internal.assets.ensureAsset, { 
          chainId: chainId.trim(), 
          address: normalizedAddress, 
          standard: "erc20", 
          status: "pending" 
        });
        asset = await ctx.runQuery(api.assets.getAssetInternal, { assetId });
        
        if (!asset) {
          return new Response(JSON.stringify({ error: "Failed to create asset" }), { 
            status: 500, 
            headers: { "content-type": "application/json" } 
          });
        }
      }
      
      // Queue refresh job
      await ctx.runMutation(api.assets.requestRefresh, { assetId: asset._id });
      
      return new Response(JSON.stringify({ enqueued: true }), { 
        status: 200, 
        headers: { "content-type": "application/json" } 
      });
    } catch (error) {
      console.error("Error in /api/refresh:", error);
      return new Response(JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error" 
      }), { 
        status: 500, 
        headers: { "content-type": "application/json" } 
      });
    }
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

    // Note: GitHub workflow trigger removed - assets are now downloaded directly to Convex
    // and synced to GitHub via scheduled cron every 15 minutes

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

