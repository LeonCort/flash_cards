import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const record = mutation({
  args: {
    wordId: v.id("words"),
    correct: v.boolean(),
    timeMs: v.number(),
    userId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("attempts", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

