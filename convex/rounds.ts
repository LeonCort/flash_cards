import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const start = mutation({
  args: {
    wordIds: v.array(v.id("words")),
    repsPerWord: v.number(),
    maxTimeMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const roundId = await ctx.db.insert("rounds", {
      createdAt: Date.now(),
      status: "active",
      repsPerWord: args.repsPerWord,
      maxTimeMs: args.maxTimeMs,
    });
    await Promise.all(
      args.wordIds.map((w) =>
        ctx.db.insert("roundItems", {
          roundId,
          wordId: w,
          repsDone: 0,
          bestTimeMs: undefined,
          solved: false,
        })
      )
    );
    return roundId;
  },
});

export const record = mutation({
  args: {
    roundId: v.id("rounds"),
    wordId: v.id("words"),
    timeMs: v.number(),
    correct: v.boolean(),
  },
  handler: async (ctx, a) => {
    // Also record a normal attempt row
    await ctx.db.insert("attempts", {
      wordId: a.wordId,
      correct: a.correct,
      timeMs: a.timeMs,
      createdAt: Date.now(),
      sessionId: a.roundId as any,
    });

    const round = await ctx.db.get(a.roundId);
    if (!round) throw new Error("Round not found");

    // Load the item for this word
    const items = await ctx.db
      .query("roundItems")
      .withIndex("by_round", (q) => q.eq("roundId", a.roundId))
      .collect();
    const item = items.find((i) => i.wordId === a.wordId);
    if (!item) throw new Error("Round item not found");

    const repsDone = item.repsDone + (a.correct ? 1 : 0);
    const best =
      item.bestTimeMs == null ? a.timeMs : Math.min(item.bestTimeMs, a.timeMs);
    const solved =
      repsDone >= round.repsPerWord &&
      (!round.maxTimeMs || (best != null && best <= round.maxTimeMs));

    await ctx.db.patch(item._id, {
      repsDone,
      bestTimeMs: best,
      solved,
    });

    // If all solved, mark the round as done
    const updatedItems = await ctx.db
      .query("roundItems")
      .withIndex("by_round", (q) => q.eq("roundId", a.roundId))
      .collect();
    const allSolved = updatedItems.every((i) => i.solved);
    if (allSolved) await ctx.db.patch(a.roundId, { status: "done" });
  },
});

export const get = query({
  args: { roundId: v.union(v.id("rounds"), v.null()) },
  handler: async (ctx, { roundId }) => {
    if (!roundId) return null;
    const round = await ctx.db.get(roundId);
    if (!round) return null;
    const items = await ctx.db
      .query("roundItems")
      .withIndex("by_round", (q) => q.eq("roundId", roundId))
      .collect();
    const solved = items.filter((i) => i.solved).length;
    return { round, items, solved, total: items.length };
  },
});

