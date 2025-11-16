import { action } from "./_generated/server";
import { internal } from "./_generated/api";

// Manual trigger to test cron job processing
export const triggerProcessQueue = action({
  args: {},
  handler: async (ctx) => {
    const result = await ctx.runAction(internal.jobs.processQueue, {});
    return result;
  },
});

