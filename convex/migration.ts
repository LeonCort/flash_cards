import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Migration function to handle existing words when introducing multiple dictionaries.
 * This creates a default dictionary and assigns all existing words to it.
 */
export const migrateToMultipleDictionaries = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if migration has already been run
    const existingDictionary = await ctx.db
      .query("dictionaries")
      .first();
    
    if (existingDictionary) {
      console.log("Migration already completed - dictionaries exist");
      return { success: true, message: "Migration already completed" };
    }

    // Create default dictionary
    const defaultDictionaryId = await ctx.db.insert("dictionaries", {
      name: "My Dictionary",
      description: "Default dictionary containing all existing words",
      createdAt: Date.now(),
      active: true,
      color: "#3b82f6", // Blue color
    });

    // Get all existing words that don't have a dictionaryId
    const wordsToMigrate = await ctx.db
      .query("words")
      .collect();

    let migratedCount = 0;
    let skippedCount = 0;

    for (const word of wordsToMigrate) {
      // Check if word already has a dictionaryId (shouldn't happen in fresh migration)
      if ('dictionaryId' in word && word.dictionaryId) {
        skippedCount++;
        continue;
      }

      // Update word to include dictionaryId
      await ctx.db.patch(word._id, {
        dictionaryId: defaultDictionaryId,
      });
      migratedCount++;
    }

    console.log(`Migration completed: ${migratedCount} words migrated, ${skippedCount} words skipped`);
    
    return {
      success: true,
      message: `Migration completed successfully`,
      defaultDictionaryId,
      migratedCount,
      skippedCount,
    };
  },
});

/**
 * Check migration status
 */
export const checkMigrationStatus = internalQuery({
  args: {},
  handler: async (ctx) => {
    const dictionariesCount = await ctx.db
      .query("dictionaries")
      .collect()
      .then(dicts => dicts.length);

    const wordsWithoutDictionary = await ctx.db
      .query("words")
      .collect()
      .then(words => words.filter(w => !('dictionaryId' in w) || !w.dictionaryId).length);

    return {
      dictionariesExist: dictionariesCount > 0,
      dictionariesCount,
      wordsWithoutDictionary,
      migrationNeeded: dictionariesCount === 0 && wordsWithoutDictionary > 0,
    };
  },
});

/**
 * Force migration (for development/testing purposes)
 * This will create a new default dictionary even if one exists
 */
export const forceMigration = internalMutation({
  args: { 
    dictionaryName: v.optional(v.string()),
    assignExistingWords: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const dictionaryName = args.dictionaryName || "Default Dictionary";
    const assignExistingWords = args.assignExistingWords ?? true;

    // Create new dictionary
    const dictionaryId = await ctx.db.insert("dictionaries", {
      name: dictionaryName,
      description: "Dictionary created during forced migration",
      createdAt: Date.now(),
      active: true,
      color: "#10b981", // Green color
    });

    let migratedCount = 0;

    if (assignExistingWords) {
      // Get words without dictionaryId
      const wordsToMigrate = await ctx.db
        .query("words")
        .collect()
        .then(words => words.filter(w => !('dictionaryId' in w) || !w.dictionaryId));

      for (const word of wordsToMigrate) {
        await ctx.db.patch(word._id, {
          dictionaryId,
        });
        migratedCount++;
      }
    }

    return {
      success: true,
      dictionaryId,
      dictionaryName,
      migratedCount,
    };
  },
});
