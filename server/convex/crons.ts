import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.cron(
  "process-jobs",
  "* * * * *",  // Every minute
  internal.jobs.processQueue
);

crons.cron(
  "rate-limit-gc",
  "0 * * * *",  // Every hour at minute 0
  internal.rateLimit.gc
);

crons.cron(
  "sync-assets-to-github",
  "*/15 * * * *",  // Every 15 minutes
  internal.assetDownload.syncAssetsToGitHub
);

// Token discovery scheduler - distributed across chains
// Each chain runs at a different minute to spread load and avoid rate limits
// Note: Convex cron jobs don't support arguments, so we use wrapper actions
crons.cron(
  "discover-tokens-ethereum",
  "5 * * * *",  // Every hour at minute 5
  internal.schedulerActions.discoverEthereum
);

crons.cron(
  "discover-tokens-arbitrum",
  "10 * * * *",  // Every hour at minute 10
  internal.schedulerActions.discoverArbitrum
);

crons.cron(
  "discover-tokens-base",
  "15 * * * *",  // Every hour at minute 15
  internal.schedulerActions.discoverBase
);

crons.cron(
  "discover-tokens-polygon",
  "20 * * * *",  // Every hour at minute 20
  internal.schedulerActions.discoverPolygon
);

crons.cron(
  "discover-tokens-optimism",
  "25 * * * *",  // Every hour at minute 25
  internal.schedulerActions.discoverOptimism
);

export default crons;

