import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentIdentity } from "./auth";

export const record = mutation({
  args: {
    wordId: v.id("words"),
    correct: v.boolean(),
    timeMs: v.number(),
    sessionId: v.optional(v.string()), // For anonymous users (deviceId) or round tracking
  },
  handler: async (ctx, args) => {
    // Get user identity - this will automatically use userId if authenticated
    // or sessionId if anonymous (when sessionId is provided)
    const { userId, sessionId } = await getCurrentIdentity(ctx, args.sessionId);

    return await ctx.db.insert("attempts", {
      wordId: args.wordId,
      correct: args.correct,
      timeMs: args.timeMs,
      userId,
      sessionId,
      createdAt: Date.now(),
    });
  },
});

