import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireProjectAccess } from "./lib/access";

export const getProjectSettings = query({
  args: { sessionHash: v.string(), projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const { role } = await requireProjectAccess(ctx, args.sessionHash, args.projectId);
    const settings = await ctx.db
      .query("projectAiSettings")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .unique();
    return { settings, role };
  },
});

export const setProjectDefaultModel = mutation({
  args: { sessionHash: v.string(), projectId: v.id("projects"), defaultModel: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireProjectAccess(ctx, args.sessionHash, args.projectId, ["owner"]);
    const defaultModel = args.defaultModel.trim().slice(0, 120);
    if (!defaultModel) throw new Error("Choose a default model.");
    const existing = await ctx.db
      .query("projectAiSettings")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { defaultModel, updatedBy: user._id, updatedAt: now });
      return await ctx.db.get(existing._id);
    }
    const id = await ctx.db.insert("projectAiSettings", {
      projectId: args.projectId,
      defaultModel,
      updatedBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(id);
  },
});
