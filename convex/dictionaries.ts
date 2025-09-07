import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (!name) throw new Error("Dictionary name cannot be empty");

    // Check if dictionary with this name already exists
    const existing = await ctx.db
      .query("dictionaries")
      .filter(q => q.eq(q.field("name"), name))
      .first();
    if (existing) throw new Error("Dictionary with this name already exists");

    const id = await ctx.db.insert("dictionaries", {
      name,
      description: args.description,
      createdAt: Date.now(),
      active: true,
      color: args.color,
    });
    return id;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const dictionaries = await ctx.db
      .query("dictionaries")
      .withIndex("by_active", q => q.eq("active", true))
      .collect();

    // Get word counts for each dictionary
    const result = [];
    for (const dict of dictionaries) {
      const wordCount = await ctx.db
        .query("words")
        .withIndex("by_dictionary_and_active", q => 
          q.eq("dictionaryId", dict._id).eq("active", true))
        .collect()
        .then(words => words.length);

      result.push({
        ...dict,
        wordCount,
      });
    }

    // Sort by creation date (newest first)
    result.sort((a, b) => b.createdAt - a.createdAt);
    return result;
  },
});

export const get = query({
  args: { dictionaryId: v.id("dictionaries") },
  handler: async (ctx, args) => {
    const dictionary = await ctx.db.get(args.dictionaryId);
    if (!dictionary || !dictionary.active) {
      throw new Error("Dictionary not found");
    }

    // Get word count
    const wordCount = await ctx.db
      .query("words")
      .withIndex("by_dictionary_and_active", q => 
        q.eq("dictionaryId", args.dictionaryId).eq("active", true))
      .collect()
      .then(words => words.length);

    return {
      ...dictionary,
      wordCount,
    };
  },
});

export const update = mutation({
  args: {
    dictionaryId: v.id("dictionaries"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const dictionary = await ctx.db.get(args.dictionaryId);
    if (!dictionary || !dictionary.active) {
      throw new Error("Dictionary not found");
    }

    const updates: any = {};
    
    if (args.name !== undefined) {
      const name = args.name.trim();
      if (!name) throw new Error("Dictionary name cannot be empty");
      
      // Check if another dictionary with this name exists
      const existing = await ctx.db
        .query("dictionaries")
        .filter(q => q.and(
          q.eq(q.field("name"), name),
          q.neq(q.field("_id"), args.dictionaryId)
        ))
        .first();
      if (existing) throw new Error("Dictionary with this name already exists");
      
      updates.name = name;
    }

    if (args.description !== undefined) {
      updates.description = args.description;
    }

    if (args.color !== undefined) {
      updates.color = args.color;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.dictionaryId, updates);
    }

    return args.dictionaryId;
  },
});

export const remove = mutation({
  args: { dictionaryId: v.id("dictionaries") },
  handler: async (ctx, args) => {
    const dictionary = await ctx.db.get(args.dictionaryId);
    if (!dictionary) throw new Error("Dictionary not found");

    // Check if dictionary has words
    const words = await ctx.db
      .query("words")
      .withIndex("by_dictionary", q => q.eq("dictionaryId", args.dictionaryId))
      .collect();

    if (words.length > 0) {
      throw new Error("Cannot delete dictionary that contains words. Please move or delete all words first.");
    }

    // Soft delete by setting active to false
    await ctx.db.patch(args.dictionaryId, { active: false });
    return args.dictionaryId;
  },
});

export const getFirstDictionary = query({
  args: {},
  handler: async (ctx) => {
    const dictionary = await ctx.db
      .query("dictionaries")
      .withIndex("by_active", q => q.eq("active", true))
      .first();
    
    return dictionary;
  },
});
