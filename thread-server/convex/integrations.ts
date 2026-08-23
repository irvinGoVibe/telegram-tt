import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireProjectAccess, requireUser } from "./lib/access";

const editableRoles = ["owner", "editor"];

function publicIntegration(integration: any) {
  if (!integration) return null;
  const { encryptedCredentials: _encryptedCredentials, ...safe } = integration;
  return safe;
}

export const createOAuthState = mutation({
  args: {
    sessionHash: v.string(),
    projectId: v.id("projects"),
    provider: v.string(),
    stateHash: v.string(),
    encryptedCodeVerifier: v.string(),
    redirectUri: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireProjectAccess(ctx, args.sessionHash, args.projectId, ["owner"]);
    const existing = await ctx.db.query("integrationOAuthStates")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId)).collect();
    await Promise.all(existing.filter((row) => row.provider === args.provider && (row.userId === user._id || row.expiresAt <= Date.now()))
      .map((row) => ctx.db.delete(row._id)));
    return await ctx.db.insert("integrationOAuthStates", {
      projectId: args.projectId,
      provider: args.provider,
      userId: user._id,
      stateHash: args.stateHash,
      encryptedCodeVerifier: args.encryptedCodeVerifier,
      redirectUri: args.redirectUri,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    });
  },
});

export const consumeOAuthState = mutation({
  args: { sessionHash: v.string(), stateHash: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.sessionHash);
    const row = await ctx.db.query("integrationOAuthStates").withIndex("by_state_hash", (q) => q.eq("stateHash", args.stateHash)).unique();
    if (!row || row.userId !== user._id || row.expiresAt <= Date.now()) throw new Error("The Linear authorization session has expired. Start the connection again.");
    await requireProjectAccess(ctx, args.sessionHash, row.projectId, ["owner"]);
    await ctx.db.delete(row._id);
    return row;
  },
});

export const saveConnection = mutation({
  args: {
    sessionHash: v.string(),
    projectId: v.id("projects"),
    encryptedCredentials: v.string(),
    externalWorkspaceId: v.string(),
    externalWorkspaceName: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireProjectAccess(ctx, args.sessionHash, args.projectId, ["owner"]);
    const existing = await ctx.db.query("projectIntegrations")
      .withIndex("by_project_provider", (q) => q.eq("projectId", args.projectId).eq("provider", "linear")).unique();
    const now = Date.now();
    const patch = {
      status: "connected",
      encryptedCredentials: args.encryptedCredentials,
      externalWorkspaceId: args.externalWorkspaceId,
      externalWorkspaceName: args.externalWorkspaceName,
      connectedBy: user._id,
      lastError: undefined,
      updatedAt: now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, {
        ...patch,
        teamId: existing.externalWorkspaceId === args.externalWorkspaceId ? existing.teamId : undefined,
        teamName: existing.externalWorkspaceId === args.externalWorkspaceId ? existing.teamName : undefined,
        teamKey: existing.externalWorkspaceId === args.externalWorkspaceId ? existing.teamKey : undefined,
        externalProjectId: existing.externalWorkspaceId === args.externalWorkspaceId ? existing.externalProjectId : undefined,
        externalProjectName: existing.externalWorkspaceId === args.externalWorkspaceId ? existing.externalProjectName : undefined,
      });
      return publicIntegration(await ctx.db.get(existing._id));
    }
    const id = await ctx.db.insert("projectIntegrations", {
      projectId: args.projectId,
      provider: "linear",
      ...patch,
      createdAt: now,
    });
    return publicIntegration(await ctx.db.get(id));
  },
});

export const getConnection = query({
  args: { sessionHash: v.string(), projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await requireProjectAccess(ctx, args.sessionHash, args.projectId, editableRoles);
    return await ctx.db.query("projectIntegrations")
      .withIndex("by_project_provider", (q) => q.eq("projectId", args.projectId).eq("provider", "linear")).unique();
  },
});

export const updateCredentials = mutation({
  args: { sessionHash: v.string(), projectId: v.id("projects"), encryptedCredentials: v.string() },
  handler: async (ctx, args) => {
    await requireProjectAccess(ctx, args.sessionHash, args.projectId, editableRoles);
    const integration = await ctx.db.query("projectIntegrations")
      .withIndex("by_project_provider", (q) => q.eq("projectId", args.projectId).eq("provider", "linear")).unique();
    if (!integration) throw new Error("Connect Linear first.");
    await ctx.db.patch(integration._id, { encryptedCredentials: args.encryptedCredentials, status: "connected", lastError: undefined, updatedAt: Date.now() });
    return publicIntegration(await ctx.db.get(integration._id));
  },
});

export const setDestination = mutation({
  args: {
    sessionHash: v.string(),
    projectId: v.id("projects"),
    teamId: v.string(),
    teamName: v.string(),
    teamKey: v.string(),
    externalProjectId: v.string(),
    externalProjectName: v.string(),
  },
  handler: async (ctx, args) => {
    await requireProjectAccess(ctx, args.sessionHash, args.projectId, ["owner"]);
    const integration = await ctx.db.query("projectIntegrations")
      .withIndex("by_project_provider", (q) => q.eq("projectId", args.projectId).eq("provider", "linear")).unique();
    if (!integration || integration.status !== "connected") throw new Error("Connect Linear first.");
    await ctx.db.patch(integration._id, {
      teamId: args.teamId,
      teamName: args.teamName,
      teamKey: args.teamKey,
      externalProjectId: args.externalProjectId,
      externalProjectName: args.externalProjectName,
      lastError: undefined,
      updatedAt: Date.now(),
    });
    return publicIntegration(await ctx.db.get(integration._id));
  },
});

export const markError = mutation({
  args: { sessionHash: v.string(), projectId: v.id("projects"), message: v.string() },
  handler: async (ctx, args) => {
    await requireProjectAccess(ctx, args.sessionHash, args.projectId, editableRoles);
    const integration = await ctx.db.query("projectIntegrations")
      .withIndex("by_project_provider", (q) => q.eq("projectId", args.projectId).eq("provider", "linear")).unique();
    if (!integration) return null;
    await ctx.db.patch(integration._id, { status: "error", lastError: args.message.trim().slice(0, 1_000), updatedAt: Date.now() });
    return publicIntegration(await ctx.db.get(integration._id));
  },
});
