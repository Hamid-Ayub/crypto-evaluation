"use node";

import crypto from "crypto";
import { action } from "./_generated/server";
import { v } from "convex/values";

function hashString(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export const hashPayloads = action({
  args: {
    prompt: v.string(),
    sourceData: v.string(),
  },
  handler: async (_, args) => {
    return {
      promptHash: hashString(args.prompt),
      sourceDataHash: hashString(args.sourceData),
    };
  },
});


