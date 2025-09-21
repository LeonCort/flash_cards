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

    const dictionariesWithoutUser = await ctx.db
      .query("dictionaries")
      .collect()
      .then(dicts => dicts.filter(d => !d.userId && !d.sessionId).length);

    const wordsWithoutUser = await ctx.db
      .query("words")
      .collect()
      .then(words => words.filter(w => !w.userId && !w.sessionId).length);

    return {
      dictionariesExist: dictionariesCount > 0,
      dictionariesCount,
      wordsWithoutDictionary,
      dictionariesWithoutUser,
      wordsWithoutUser,
      migrationNeeded: dictionariesCount === 0 && wordsWithoutDictionary > 0,
      userMigrationNeeded: dictionariesWithoutUser > 0 || wordsWithoutUser > 0,
    };
  },
});

/**
 * Migrate existing data to add user scoping.
 * Assigns all existing dictionaries/words to a default sessionId.
 */
export const migrateToUserScoping = internalMutation({
  args: {},
  handler: async (ctx) => {
    const defaultSessionId = "legacy-data";

    // Migrate dictionaries
    const dictionaries = await ctx.db
      .query("dictionaries")
      .collect();

    for (const dict of dictionaries) {
      if (!dict.userId && !dict.sessionId) {
        await ctx.db.patch(dict._id, { sessionId: defaultSessionId });
      }
    }

    // Migrate words
    const words = await ctx.db
      .query("words")
      .collect();

    for (const word of words) {
      if (!word.userId && !word.sessionId) {
        await ctx.db.patch(word._id, { sessionId: defaultSessionId });
      }
    }

    // Migrate rounds
    const rounds = await ctx.db
      .query("rounds")
      .collect();

    for (const round of rounds) {
      if (!round.userId && !round.sessionId) {
        await ctx.db.patch(round._id, { sessionId: defaultSessionId });
      }
    }

    return {
      migratedDictionaries: dictionaries.filter(d => !d.userId && !d.sessionId).length,
      migratedWords: words.filter(w => !w.userId && !w.sessionId).length,
      migratedRounds: rounds.filter(r => !r.userId && !r.sessionId).length,
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
