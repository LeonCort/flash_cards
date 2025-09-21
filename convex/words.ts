import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentIdentity } from "./auth";

export const add = mutation({
  args: {
    text: v.string(),
    dictionaryId: v.id("dictionaries"),
    tags: v.optional(v.array(v.string())),
    gradeLevel: v.optional(v.union(v.string(), v.number())),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const text = args.text.trim().toLowerCase();
    if (!text) throw new Error("Word cannot be empty");

    const { userId, sessionId } = await getCurrentIdentity(ctx, args.sessionId);

    // Verify dictionary exists and is active and belongs to user
    const dictionary = await ctx.db.get(args.dictionaryId);
    if (!dictionary || !dictionary.active) {
      throw new Error("Dictionary not found");
    }

    // Verify user owns this dictionary
    const ownsDict = userId ? dictionary.userId === userId : dictionary.sessionId === sessionId;
    if (!ownsDict) {
      throw new Error("Dictionary not found");
    }

    // Check for duplicates within the specific dictionary
    const existing = await ctx.db
      .query("words")
      .withIndex("by_text_and_dictionary", q =>
        q.eq("text", text).eq("dictionaryId", args.dictionaryId))
      .unique();
    if (existing) throw new Error("Word already exists in this dictionary");

    const id = await ctx.db.insert("words", {
      text,
      dictionaryId: args.dictionaryId,
      createdAt: Date.now(),
      active: true,
      tags: args.tags ?? [],
      gradeLevel: args.gradeLevel,
      userId,
      sessionId,
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
  args: { dictionaryId: v.id("dictionaries") },
  handler: async (ctx, args) => {
    // Verify dictionary exists and is active
    const dictionary = await ctx.db.get(args.dictionaryId);
    if (!dictionary || !dictionary.active) {
      throw new Error("Dictionary not found");
    }

    const words = await ctx.db
      .query("words")
      .withIndex("by_dictionary_and_active", q =>
        q.eq("dictionaryId", args.dictionaryId).eq("active", true))
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
  args: {
    wordId: v.optional(v.id("words")),
    dictionaryId: v.optional(v.id("dictionaries"))
  },
  handler: async (ctx, { wordId, dictionaryId }) => {
    const ts = Date.now();
    if (wordId) {
      const word = await ctx.db.get(wordId);
      if (!word) throw new Error("Word not found");
      await ctx.db.patch(wordId, { resetAt: ts });
    } else if (dictionaryId) {
      // Reset all words in a specific dictionary
      const dictionary = await ctx.db.get(dictionaryId);
      if (!dictionary || !dictionary.active) {
        throw new Error("Dictionary not found");
      }
      const words = await ctx.db
        .query("words")
        .withIndex("by_dictionary", q => q.eq("dictionaryId", dictionaryId))
        .collect();
      for (const w of words) await ctx.db.patch(w._id, { resetAt: ts });
    } else {
      // Reset all words across all dictionaries (legacy support)
      const all = await ctx.db.query("words").collect();
      for (const w of all) await ctx.db.patch(w._id, { resetAt: ts });
    }
  },
});

export const deleteWord = mutation({
  args: {
    wordId: v.id("words"),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, sessionId } = await getCurrentIdentity(ctx, args.sessionId);

    // Get the word to verify ownership
    const word = await ctx.db.get(args.wordId);
    if (!word || !word.active) {
      throw new Error("Word not found");
    }

    // Verify user owns this word
    const ownsWord = userId ? word.userId === userId : word.sessionId === sessionId;
    if (!ownsWord) {
      throw new Error("Word not found");
    }

    // Soft delete by setting active to false
    await ctx.db.patch(args.wordId, { active: false });

    // Also delete all attempts for this word to clean up data
    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_word", q => q.eq("wordId", args.wordId))
      .collect();

    for (const attempt of attempts) {
      await ctx.db.delete(attempt._id);
    }

    return { success: true };
  },
});

