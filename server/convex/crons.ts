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

export default crons;

