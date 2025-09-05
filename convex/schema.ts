import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  words: defineTable({
    text: v.string(),
    createdAt: v.number(),
    active: v.boolean(),
    tags: v.optional(v.array(v.string())),
    gradeLevel: v.optional(v.union(v.string(), v.number())),
    resetAt: v.optional(v.number()), // Soft reset cutoff; attempts before this are ignored
  })
    .index("by_text", ["text"])
    .index("by_active", ["active"]),

  attempts: defineTable({
    wordId: v.id("words"),
    correct: v.boolean(),
    timeMs: v.number(),
    createdAt: v.number(),
    userId: v.optional(v.string()),
    sessionId: v.optional(v.string()), // When part of a round
  })
    .index("by_word", ["wordId"])
    .index("by_word_createdAt", ["wordId", "createdAt"]),

  // Rounds (lightweight persistence for practice sessions)
  rounds: defineTable({
    createdAt: v.number(),
    status: v.string(), // "active" | "done"
    repsPerWord: v.number(),
    maxTimeMs: v.optional(v.number()),
  }),

  roundItems: defineTable({
    roundId: v.id("rounds"),
    wordId: v.id("words"),
    repsDone: v.number(),
    bestTimeMs: v.optional(v.number()),
    solved: v.boolean(),
  }).index("by_round", ["roundId"]),
});

