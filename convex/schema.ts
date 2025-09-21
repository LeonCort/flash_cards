import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  // Dictionaries table for organizing words into separate collections
  dictionaries: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    active: v.boolean(),
    color: v.optional(v.string()), // For UI theming
  }).index("by_active", ["active"]),

  words: defineTable({
    text: v.string(),
    dictionaryId: v.optional(v.id("dictionaries")), // Link to dictionary (optional for migration)
    createdAt: v.number(),
    active: v.boolean(),
    tags: v.optional(v.array(v.string())),
    gradeLevel: v.optional(v.union(v.string(), v.number())),
    resetAt: v.optional(v.number()), // Soft reset cutoff; attempts before this are ignored
  })
    .index("by_text_and_dictionary", ["text", "dictionaryId"]) // Prevent duplicates per dictionary
    .index("by_dictionary", ["dictionaryId"])
    .index("by_dictionary_and_active", ["dictionaryId", "active"]),

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

