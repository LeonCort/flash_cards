import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Development helper to run migration
 * Call this from the Convex dashboard or via npx convex run dev:runMigration
 */
export const runMigration = mutation({
  args: {},
  handler: async (ctx) => {
    // Run the migration
    await ctx.scheduler.runAfter(0, internal.migration.migrateToMultipleDictionaries);
    return { success: true, message: "Migration scheduled" };
  },
});

/**
 * Check migration status
 */
export const checkMigrationStatus = mutation({
  args: {},
  handler: async (ctx) => {
    // Get dictionaries count directly
    const dictionariesCount = await ctx.db
      .query("dictionaries")
      .collect()
      .then(dicts => dicts.length);

    const wordsWithoutDictionary = await ctx.db
      .query("words")
      .collect()
      .then(words => words.filter(w => !('dictionaryId' in w) || !w.dictionaryId).length);

    return {
      success: true,
      dictionariesExist: dictionariesCount > 0,
      dictionariesCount,
      wordsWithoutDictionary,
      migrationNeeded: dictionariesCount === 0 && wordsWithoutDictionary > 0,
    };
  },
});
