import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { analyzeContract, liquidityForToken, governanceForToken } from "./providers/index";

const router = httpRouter();

// CORS headers helper
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

// Helper to add CORS headers to response
function withCors(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

// Handle OPTIONS preflight requests for POST endpoints
const postEndpoints = [
  "/api/refresh",
  "/api/refreshNow",
  "/api/scheduler/start",
  "/api/scheduler/pause",
  "/api/scheduler/discover",
  "/api/jobs/process",
  "/api/report/section",
  "/api/report/generateAll",
  "/api/project/parse",
  "/api/tokens/:tokenId/refresh-market-data",
  "/api/tokens/:tokenId/refresh-stats",
];

for (const path of postEndpoints) {
  router.route({
    path,
    method: "OPTIONS",
    handler: httpAction(async () => {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }),
  });
}

router.route({
  path: "/api/score",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const ip = req.headers.get("x-forwarded-for") ?? "anon";
    const rate = await ctx.runMutation(api.rateLimit.checkAndIncrement, { key: `ip:${ip}`, plan: "free" });
    if (!rate.ok) return withCors(new Response("Too many requests", { status: 429 }));

    const url = new URL(req.url);
    const chainId = url.searchParams.get("chainId");
    const address = url.searchParams.get("address");
    if (!chainId || !address) return withCors(new Response("Missing params", { status: 400 }));

    const asset = await ctx.runQuery(api.assets.getByChainAddress, { chainId, address });
    if (!asset) return withCors(new Response("Not found", { status: 404 }));

    const score = await ctx.runQuery(api.assets.scorecard, { assetId: asset._id });
    return withCors(new Response(JSON.stringify({ asset, score }), { status: 200, headers: { "content-type": "application/json" } }));
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
    return withCors(new Response(JSON.stringify(result), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));
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

    if (!tokenId) return withCors(new Response("Missing id or address", { status: 400 }));

    const token = await ctx.runQuery(api.assets.getEnriched, { tokenId });
    if (!token) return withCors(new Response("Not found", { status: 404 }));
    return withCors(new Response(JSON.stringify(token), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));
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
        return withCors(new Response(JSON.stringify({ error: "Too many requests" }), {
          status: 429,
          headers: { "content-type": "application/json" }
        }));
      }

      const body = await req.json();
      const { chainId, address } = body || {};
      if (!chainId || !address) {
        return withCors(new Response(JSON.stringify({ error: "Missing chainId or address" }), {
          status: 400,
          headers: { "content-type": "application/json" }
        }));
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
          return withCors(new Response(JSON.stringify({ error: "Failed to create asset" }), {
            status: 500,
            headers: { "content-type": "application/json" }
          }));
        }
      }

      // Queue refresh job
      await ctx.runMutation(api.assets.requestRefresh, { assetId: asset._id });

      return withCors(new Response(JSON.stringify({ enqueued: true }), {
        status: 200,
        headers: { "content-type": "application/json" }
      }));
    } catch (error) {
      console.error("Error in /api/refresh:", error);
      return withCors(new Response(JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error"
      }), {
        status: 500,
        headers: { "content-type": "application/json" }
      }));
    }
  }),
});

router.route({
  path: "/api/report",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const tokenId = url.searchParams.get("tokenId");
    if (!tokenId) return withCors(new Response("Missing tokenId", { status: 400 }));
    const token = await ctx.runQuery(api.assets.getEnriched, { tokenId });
    if (!token) return withCors(new Response("Not found", { status: 404 }));
    return withCors(
      new Response(JSON.stringify(token), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  }),
});

router.route({
  path: "/api/report/section",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.json();
      const { tokenId, section, context, force } = body ?? {};
      if (!tokenId || !section) {
        return withCors(
          new Response(JSON.stringify({ error: "Missing tokenId or section" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          }),
        );
      }
      const result = await ctx.runAction(internal.aiContent.generateSection, {
        tokenId,
        section,
        context,
        force,
      });
      return withCors(
        new Response(JSON.stringify(result), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    } catch (error: any) {
      console.error("Error generating report section:", error);
      return withCors(
        new Response(JSON.stringify({ error: error?.message ?? "ai-section-error" }), {
          status: 500,
          headers: { "content-type": "application/json" },
        }),
      );
    }
  }),
});

router.route({
  path: "/api/project/parse",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.json();
      const { tokenId, force } = body ?? {};
      if (!tokenId) {
        return withCors(
          new Response(JSON.stringify({ error: "Missing tokenId" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          }),
        );
      }
      const result = await ctx.runAction(api.projectParser.parseProjectData, {
        tokenId,
        force: force ?? false,
      });
      return withCors(
        new Response(JSON.stringify(result), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    } catch (error: any) {
      console.error("Error parsing project data:", error);
      return withCors(
        new Response(JSON.stringify({ error: error?.message ?? "parse-error" }), {
          status: 500,
          headers: { "content-type": "application/json" },
        }),
      );
    }
  }),
});

router.route({
  path: "/api/report/generateAll",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.json();
      const { tokenId, sections, context, force } = body ?? {};
      if (!tokenId) {
        return withCors(
          new Response(JSON.stringify({ error: "Missing tokenId" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          }),
        );
      }
      const result = await ctx.runAction(api.aiContent.generateSectionsForToken, {
        tokenId,
        sections,
        context,
        force,
      });
      return withCors(
        new Response(JSON.stringify(result), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    } catch (error: any) {
      console.error("Error generating full report sections:", error);
      return withCors(
        new Response(JSON.stringify({ error: error?.message ?? "ai-section-error" }), {
          status: 500,
          headers: { "content-type": "application/json" },
        }),
      );
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
    if (!chainId || !address) return withCors(new Response("Missing params", { status: 400 }));

    const asset = await ctx.runQuery(api.assets.getByChainAddress, { chainId, address });
    if (!asset) return withCors(new Response("Not found", { status: 404 }));

    const score = await ctx.runQuery(api.assets.scorecard, { assetId: asset._id });
    if (!score?.jsonldStorageId) return withCors(new Response("No JSON-LD", { status: 404 }));

    const fileUrl = await ctx.storage.getUrl(score.jsonldStorageId);
    return withCors(new Response(JSON.stringify({ url: fileUrl }), { status: 200, headers: { "content-type": "application/json" } }));
  }),
});

router.route({
  path: "/api/github",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const repoUrl = url.searchParams.get("repoUrl");
    if (!repoUrl) return withCors(new Response("Missing repoUrl", { status: 400 }));
    try {
      const { getGitHubStats } = await import("./providers/github");
      const stats = await getGitHubStats(repoUrl);
      return withCors(
        new Response(JSON.stringify(stats), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    } catch (error: any) {
      return withCors(
        new Response(
          JSON.stringify({ error: error?.message ?? "github-error" }),
          { status: 500, headers: { "content-type": "application/json" } },
        ),
      );
    }
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
    if (!chainId || !address) return withCors(new Response("Missing params", { status: 400 }));
    try {
      const data = await analyzeContract(chainId, address as any);
      return withCors(new Response(JSON.stringify(data), { status: 200, headers: { "content-type": "application/json" } }));
    } catch (e: any) {
      return withCors(new Response(JSON.stringify({ error: e?.message || "introspection-failed" }), { status: 500 }));
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
    if (!chainName || !token) return withCors(new Response("Missing params", { status: 400 }));
    try {
      const data = await liquidityForToken(chainName, token);
      return withCors(new Response(JSON.stringify(data), { status: 200, headers: { "content-type": "application/json" } }));
    } catch (e: any) {
      return withCors(new Response(JSON.stringify({ error: e?.message || "liquidity-failed" }), { status: 500 }));
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
    if (!chainId || !token) return withCors(new Response("Missing params", { status: 400 }));
    try {
      const data = await governanceForToken(chainId, token);
      return withCors(new Response(JSON.stringify(data), { status: 200, headers: { "content-type": "application/json" } }));
    } catch (e: any) {
      return withCors(new Response(JSON.stringify({ error: e?.message || "governance-failed" }), { status: 500 }));
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
    if (!rate.ok) return withCors(new Response("Too many requests", { status: 429 }));

    const body = await req.json();
    const { chainId, address, standard, symbol, name, decimals } = body || {};
    if (!chainId || !address) return withCors(new Response("Bad request", { status: 400 }));

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

    return withCors(new Response(JSON.stringify({ ok: true, assetId, ...result }), { status: 200, headers: { "content-type": "application/json" } }));
  }),
});

// Debug endpoint to check cron status
router.route({
  path: "/api/jobs",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const stats = await ctx.runQuery(api.jobs.getJobStats, {});
    return withCors(new Response(JSON.stringify(stats), { status: 200, headers: { "content-type": "application/json" } }));
  }),
});

// Manual trigger to test job processing (bypasses cron)
router.route({
  path: "/api/jobs/process",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const result = await ctx.runAction(internal.jobs.processQueue, {});
    return withCors(new Response(JSON.stringify(result), { status: 200, headers: { "content-type": "application/json" } }));
  }),
});

// Scheduler control endpoints
router.route({
  path: "/api/scheduler/status",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const config = await ctx.runQuery(api.scheduler.getSchedulerConfig, {});
    return withCors(new Response(JSON.stringify(config), { status: 200, headers: { "content-type": "application/json" } }));
  }),
});

router.route({
  path: "/api/scheduler/start",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const result = await ctx.runMutation(api.scheduler.enable, {});
    return withCors(new Response(JSON.stringify(result), { status: 200, headers: { "content-type": "application/json" } }));
  }),
});

router.route({
  path: "/api/scheduler/pause",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const result = await ctx.runMutation(api.scheduler.disable, {});
    return withCors(new Response(JSON.stringify(result), { status: 200, headers: { "content-type": "application/json" } }));
  }),
});

// Manual trigger for token discovery (bypasses cron, for testing)
router.route({
  path: "/api/scheduler/discover",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json().catch(() => ({}));
    const chain = body.chain || "ethereum";

    const result = await ctx.runAction(internal.schedulerActions.discoverAndQueueTokens, { chain });
    return withCors(new Response(JSON.stringify(result), { status: 200, headers: { "content-type": "application/json" } }));
  }),
});

// Refresh volatile data (market price/volume) for a token
router.route({
  path: "/api/tokens/:tokenId/refresh-market-data",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const tokenId = req.params.tokenId;
    if (!tokenId) {
      return withCors(new Response(JSON.stringify({ error: "Missing tokenId" }), {
        status: 400,
        headers: { "content-type": "application/json" }
      }));
    }

    try {
      // Get token by ID (CAIP-19)
      const token = await ctx.runQuery(api.assets.getEnriched, { tokenId });
      if (!token) {
        return withCors(new Response(JSON.stringify({ error: "Token not found" }), {
          status: 404,
          headers: { "content-type": "application/json" }
        }));
      }

      // Get asset by chain/address
      const asset = await ctx.runQuery(api.assets.getByChainAddress, {
        chainId: token.chain,
        address: token.address,
      });
      if (!asset) {
        return withCors(new Response(JSON.stringify({ error: "Token not found" }), {
          status: 404,
          headers: { "content-type": "application/json" }
        }));
      }

      // Check if refresh is already in progress
      const inProgress = await ctx.runQuery(api.refresh.isRefreshInProgress, {
        assetId: asset._id,
        refreshType: "volatile",
      });

      if (inProgress) {
        return withCors(new Response(JSON.stringify({ error: "Refresh already in progress" }), {
          status: 409,
          headers: { "content-type": "application/json" }
        }));
      }

      // Trigger refresh action
      const result = await ctx.runAction(internal.refreshActions.refreshVolatileData, {
        assetId: asset._id,
      });

      return withCors(new Response(JSON.stringify(result), {
        status: 200,
        headers: { "content-type": "application/json" }
      }));
    } catch (error: any) {
      console.error("Refresh market data error:", error);
      return withCors(new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "content-type": "application/json" }
      }));
    }
  }),
});

// Refresh semi-volatile data (holders, liquidity, governance, GitHub) for a token
router.route({
  path: "/api/tokens/:tokenId/refresh-stats",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const tokenId = req.params.tokenId;
    if (!tokenId) {
      return withCors(new Response(JSON.stringify({ error: "Missing tokenId" }), {
        status: 400,
        headers: { "content-type": "application/json" }
      }));
    }

    try {
      // Get token by ID (CAIP-19)
      const token = await ctx.runQuery(api.assets.getEnriched, { tokenId });
      if (!token) {
        return withCors(new Response(JSON.stringify({ error: "Token not found" }), {
          status: 404,
          headers: { "content-type": "application/json" }
        }));
      }

      // Get asset by chain/address
      const asset = await ctx.runQuery(api.assets.getByChainAddress, {
        chainId: token.chain,
        address: token.address,
      });
      if (!asset) {
        return withCors(new Response(JSON.stringify({ error: "Token not found" }), {
          status: 404,
          headers: { "content-type": "application/json" }
        }));
      }

      // Check if refresh is already in progress
      const inProgress = await ctx.runQuery(api.refresh.isRefreshInProgress, {
        assetId: asset._id,
        refreshType: "semiVolatile",
      });

      if (inProgress) {
        return withCors(new Response(JSON.stringify({ error: "Refresh already in progress" }), {
          status: 409,
          headers: { "content-type": "application/json" }
        }));
      }

      // Trigger refresh action
      const result = await ctx.runAction(internal.refreshActions.refreshSemiVolatileData, {
        assetId: asset._id,
      });

      return withCors(new Response(JSON.stringify(result), {
        status: 200,
        headers: { "content-type": "application/json" }
      }));
    } catch (error: any) {
      console.error("Refresh stats error:", error);
      return withCors(new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "content-type": "application/json" }
      }));
    }
  }),
});

function parseNumberParam(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

// Job status endpoint for frontend polling
router.route({
  path: "/api/jobs/status/:assetId",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const assetId = request.pathParams.assetId;

    try {
      const status = await ctx.runQuery(api.jobs.getJobStatusForAsset, { assetId: assetId as any });
      return new Response(JSON.stringify(status), {
        status: 200,
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }
  }),
});

// Queue stats endpoint for frontend polling
router.route({
  path: "/api/jobs/queue-stats",
  method: "GET",
  handler: httpAction(async (ctx) => {
    try {
      const stats = await ctx.runQuery(api.jobs.getQueueStats, {});
      return new Response(JSON.stringify(stats), {
        status: 200,
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }
  }),
});

export default router;

