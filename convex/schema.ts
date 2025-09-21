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
    userId: v.optional(v.string()), // Owner when authenticated
    sessionId: v.optional(v.string()), // Owner when anonymous (deviceId)
  })
    .index("by_active", ["active"])
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"])
    .index("by_user_active", ["userId", "active"])
    .index("by_session_active", ["sessionId", "active"]),

  words: defineTable({
    text: v.string(),
    dictionaryId: v.optional(v.id("dictionaries")), // Link to dictionary (optional for migration)
    createdAt: v.number(),
    active: v.boolean(),
    tags: v.optional(v.array(v.string())),
    gradeLevel: v.optional(v.union(v.string(), v.number())),
    resetAt: v.optional(v.number()), // Soft reset cutoff; attempts before this are ignored
    userId: v.optional(v.string()), // Owner when authenticated
    sessionId: v.optional(v.string()), // Owner when anonymous (deviceId)
  })
    .index("by_text_and_dictionary", ["text", "dictionaryId"]) // Prevent duplicates per dictionary
    .index("by_dictionary", ["dictionaryId"])
    .index("by_dictionary_and_active", ["dictionaryId", "active"])
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"])
    .index("by_user_dictionary", ["userId", "dictionaryId"])
    .index("by_session_dictionary", ["sessionId", "dictionaryId"]),

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
    userId: v.optional(v.string()), // Owner when authenticated
    sessionId: v.optional(v.string()), // Owner when anonymous (deviceId)
  })
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"]),

  roundItems: defineTable({
    roundId: v.id("rounds"),
    wordId: v.id("words"),
    repsDone: v.number(),
    bestTimeMs: v.optional(v.number()),
    solved: v.boolean(),
  }).index("by_round", ["roundId"]),
});

