import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const add = mutation({
  args: {
    text: v.string(),
    tags: v.optional(v.array(v.string())),
    gradeLevel: v.optional(v.union(v.string(), v.number())),
  },
  handler: async (ctx, args) => {
    const text = args.text.trim().toLowerCase();
    if (!text) throw new Error("Word cannot be empty");

    const existing = await ctx.db
      .query("words")
      .withIndex("by_text", q => q.eq("text", text))
      .unique();
    if (existing) throw new Error("Word already exists");

    const id = await ctx.db.insert("words", {
      text,
      createdAt: Date.now(),
      active: true,
      tags: args.tags ?? [],
      gradeLevel: args.gradeLevel,
    });
    return id;
  },
});

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const arr = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 === 0 ? Math.round((arr[mid - 1] + arr[mid]) / 2) : arr[mid];
}

export const listWithStats = query({
  args: {},
  handler: async (ctx) => {
    const words = await ctx.db
      .query("words")
      .withIndex("by_active", q => q.eq("active", true))
      .collect();

    const result: any[] = [];
    for (const w of words) {
      const all = await ctx.db
        .query("attempts")
        .withIndex("by_word", q => q.eq("wordId", w._id))
        .collect();

      const cutoff = w.resetAt ?? 0;
      const atts = all.filter(a => a.createdAt > cutoff);

      const total = atts.length;
      const correctCount = atts.filter(a => a.correct).length;
      const correctRate = total === 0 ? null : correctCount / total;

      const timesAll = atts.map(a => a.timeMs);
      const typicalTimeMs = median(timesAll);

      const bestCorrectTimes = atts.filter(a => a.correct).map(a => a.timeMs);
      const highScoreMs =
        bestCorrectTimes.length === 0 ? null : Math.min(...bestCorrectTimes);

      result.push({
        ...w,
        stats: {
          total,
          correctRate,
          typicalTimeMs,
          highScoreMs,
        },
      });
    }

    result.sort((a, b) => a.text.localeCompare(b.text));
    return result;
  },
});

export const resetStats = mutation({
  args: { wordId: v.optional(v.id("words")) },
  handler: async (ctx, { wordId }) => {
    const ts = Date.now();
    if (wordId) {
      const word = await ctx.db.get(wordId);
      if (!word) throw new Error("Word not found");
      await ctx.db.patch(wordId, { resetAt: ts });
    } else {
      const all = await ctx.db.query("words").collect();
      for (const w of all) await ctx.db.patch(w._id, { resetAt: ts });
    }
  },
});

