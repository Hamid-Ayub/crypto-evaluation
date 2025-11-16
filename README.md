# Decentralization Score – Convex Backend

Single Convex deployment powering the decentralization scoring engine, HTTP APIs, JSON‑LD storage, and background jobs. Providers aggregate on-chain security (EIP‑1967 slots, OZ AccessControl roles), liquidity (DeFiLlama pools with DEX/CEX split), and governance (Snapshot + Tally).

## Layout
```
crypto-evaluation/
├── README.md
└── server/
    ├── convex/                  # All Convex functions, actions, HTTP routes
    │   ├── _generated/          # Auto-generated Convex bindings
    │   ├── _internal/           # Internal helpers (math, scoring, normalize)
    │   ├── providers/           # RPC, DeFiLlama, Snapshot, Tally adapters
    │   ├── assets.ts, jobs.ts…  # Queries, mutations, scheduled jobs
    │   └── http.ts              # Public HTTP endpoints
    ├── convex.json              # Convex project config
    ├── package.json             # Backend deps (convex, viem, cross-fetch)
    └── .env.local               # Local overrides (gitignored)
```

## Setup
```bash
cd /Users/hamid/Development/crypto-evaluation/server
npm install
```

### Required environment
Create `server/.env.local` (loaded by Convex CLI) with:
```
INFURA_PROJECT_ID=...
ALCHEMY_MAINNET_HTTP=...        # optional RPC fallbacks
ALCHEMY_ARBITRUM_HTTP=...
ALCHEMY_OPTIMISM_HTTP=...
ALCHEMY_BASE_HTTP=...
ALCHEMY_POLYGON_HTTP=...

ETHERSCAN_KEY=...
ARBISCAN_KEY=...
OPTIMISTIC_ETHERSCAN_KEY=...
BASESCAN_KEY=...
POLYGONSCAN_KEY=...
ETHPLORER_KEY=freekey          # optional, used for holder concentration

SNAPSHOT_GRAPHQL=https://hub.snapshot.org/graphql
TALLY_GRAPHQL=https://api.tally.xyz/query
TALLY_API_KEY=...

# Convex endpoints
CONVEX_DEPLOYMENT=nautical-rat-318        # project slug
CONVEX_URL=https://nautical-rat-318.convex.site
```

- Use the `.convex.cloud` URL for Convex clients (React/http clients).
- Use the `.convex.site` URL for every HTTP Action (curl, frontend fetches, monitors). The Convex edge now separates the data plane (`*.convex.cloud`) from the HTTP Actions plane (`*.convex.site`); hitting the wrong host returns 404 even if routes are registered.

## Commands
```bash
# Local dev (watches functions, runs scheduler simulators)
npx convex dev

# Deploy latest functions (queries, mutations, HTTP routes, crons)
npx convex deploy

# Type-check Convex code
npm run typecheck
```

## HTTP Endpoints
| Route | Method | Description |
|-------|--------|-------------|
| `/api/score` | GET | Fetch asset + scorecard snapshot (rate limited by IP). |
| `/api/refresh` | POST | Queue refresh for an asset (creates asset if missing). |
| `/api/jsonld` | GET | Returns signed JSON‑LD URL for an asset if available. |
| `/api/contract/security` | GET | On-demand EIP‑1967 + AccessControl analysis via `providers/composite`. |
| `/api/liquidity` | GET | Aggregated liquidity & venue split from DeFiLlama. |
| `/api/governance` | GET | Snapshot space + Tally org discovery for a token. |
| `/api/refreshNow` | POST | Immediate ingest/score bypassing cron queues. |
| `/api/jobs` | GET | Job queue stats/debug info. |
| `/api/jobs/process` | POST | Manual trigger for job processor action. |

All endpoints live in `server/convex/http.ts` and must be invoked at `https://<deployment>.convex.site/<route>`.

## Troubleshooting
- **HTTP 404s**: Double-check you are on the `.convex.site` host. Run `curl https://nautical-rat-318.convex.site/api/jobs` to verify reachability.
- **Rate limiting**: `/api/score`, `/api/refresh`, and `/api/refreshNow` call `api.rateLimit.checkAndIncrement`; repeated requests from one IP may receive HTTP 429.
- **Provider failures**: Security/liquidity/governance routes wrap errors and return `{ error: "..." }` + HTTP 500. Check Convex logs (`npx convex logs --history 50`).

## Testing Quickstart
```bash
curl "https://nautical-rat-318.convex.site/api/score?chainId=eip155:1&address=0x0000000000000000000000000000000000000000"
curl -X POST "https://nautical-rat-318.convex.site/api/refresh" \
  -H "content-type: application/json" \
  -d '{"chainId":"eip155:1","address":"0x..."}'
curl "https://nautical-rat-318.convex.site/api/contract/security?chainId=1&address=0x..."
```

That’s the entire operational surface now that all auxiliary markdown notes were removed.
