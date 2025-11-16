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

export default crons;

