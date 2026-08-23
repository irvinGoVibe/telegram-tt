import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireProjectAccess, requireUser } from "./lib/access";

const editableRoles = ["owner", "editor"];

async function memberRows(ctx: any, projectId: any) {
  const rows = await ctx.db.query("projectMembers").withIndex("by_project", (q: any) => q.eq("projectId", projectId)).collect();
  return await Promise.all(rows.map(async (member: any) => {
    const user = await ctx.db.get(member.userId);
    return {
      ...member,
      user: user ? { id: user._id, email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl } : null,
    };
  }));
}

async function taskRows(ctx: any, projectId: any) {
  const tasks = await ctx.db.query("tasks").withIndex("by_project", (q: any) => q.eq("projectId", projectId)).order("desc").collect();
  return await Promise.all(tasks.map(async (task: any) => ({
    ...task,
    sources: (await Promise.all(task.sourceMessageIds.map(async (messageId: any, ordinal: number) => {
      const message = await ctx.db.get(messageId);
      if (!message) return null;
      const chat = await ctx.db.get(message.chatId);
      return { ordinal, message, chat };
    }))).filter(Boolean),
  })));
}

async function integrationRows(ctx: any, projectId: any) {
  const rows = await ctx.db.query("projectIntegrations").withIndex("by_project", (q: any) => q.eq("projectId", projectId)).collect();
  return rows.map(({ encryptedCredentials: _encryptedCredentials, ...integration }: any) => integration);
}

export const createProject = mutation({
  args: {
    sessionHash: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    instructions: v.optional(v.string()),
    responseLanguage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.sessionHash);
    const name = args.name.trim().slice(0, 120);
    if (!name) throw new Error("Enter a project name.");
    const now = Date.now();
    const projectId = await ctx.db.insert("projects", {
      ownerId: user._id,
      name,
      description: args.description?.trim().slice(0, 4_000) || undefined,
      instructions: args.instructions?.trim().slice(0, 20_000) || "",
      responseLanguage: ["auto", "en", "ru"].includes(args.responseLanguage || "") ? args.responseLanguage : "auto",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("projectMembers", { projectId, userId: user._id, role: "owner", createdAt: now });
    return await ctx.db.get(projectId);
  },
});

export const updateProject = mutation({
  args: {
    sessionHash: v.string(),
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    instructions: v.optional(v.string()),
    responseLanguage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireProjectAccess(ctx, args.sessionHash, args.projectId, editableRoles);
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) {
      const name = args.name.trim().slice(0, 120);
      if (!name) throw new Error("Enter a project name.");
      patch.name = name;
    }
    if (args.description !== undefined) patch.description = args.description.trim().slice(0, 4_000) || undefined;
    if (args.instructions !== undefined) patch.instructions = args.instructions.trim().slice(0, 20_000);
    if (args.responseLanguage !== undefined && ["auto", "en", "ru"].includes(args.responseLanguage)) patch.responseLanguage = args.responseLanguage;
    await ctx.db.patch(args.projectId, patch);
    return await ctx.db.get(args.projectId);
  },
});

export const listProjects = query({
  args: { sessionHash: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.sessionHash);
    const memberships = await ctx.db.query("projectMembers").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
    const projects = (await Promise.all(memberships.map((membership) => ctx.db.get(membership.projectId)))).filter(Boolean);
    return projects.sort((left, right) => (right?.updatedAt || 0) - (left?.updatedAt || 0));
  },
});

export const getWorkspace = query({
  args: { sessionHash: v.string(), projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const access = await requireProjectAccess(ctx, args.sessionHash, args.projectId);
    const links = await ctx.db.query("projectChats").withIndex("by_project", (q) => q.eq("projectId", args.projectId)).collect();
    const chats = (await Promise.all(links.map(async (link) => {
      const chat = await ctx.db.get(link.chatId);
      if (!chat) return null;
      const account = await ctx.db.get(chat.telegramAccountId);
      const owner = account ? await ctx.db.get(account.userId) : null;
      return { ...link, chat: { ...chat, ownerTelegramUserId: owner?.telegramUserId } };
    }))).filter(Boolean);
    const threads = await ctx.db.query("assistantThreads").withIndex("by_project", (q) => q.eq("projectId", args.projectId)).order("desc").collect();
    return {
      project: access.project,
      members: await memberRows(ctx, args.projectId),
      chats,
      tasks: await taskRows(ctx, args.projectId),
      threads,
      integrations: await integrationRows(ctx, args.projectId),
    };
  },
});

export const createInvite = mutation({
  args: {
    sessionHash: v.string(),
    projectId: v.id("projects"),
    email: v.string(),
    role: v.string(),
    tokenHash: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireProjectAccess(ctx, args.sessionHash, args.projectId, ["owner"]);
    const email = args.email.trim().toLowerCase();
    if (!email || !["viewer", "editor"].includes(args.role)) throw new Error("Enter an email and choose a valid role.");
    const id = await ctx.db.insert("projectInvites", {
      projectId: args.projectId,
      email,
      role: args.role,
      tokenHash: args.tokenHash,
      invitedBy: user._id,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    });
    return await ctx.db.get(id);
  },
});

export const acceptInvite = mutation({
  args: { sessionHash: v.string(), tokenHash: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.sessionHash);
    const invite = await ctx.db.query("projectInvites").withIndex("by_token_hash", (q) => q.eq("tokenHash", args.tokenHash)).unique();
    if (!invite || invite.expiresAt <= Date.now()) throw new Error("This invitation is invalid or has expired.");
    if (!user.email || user.email.toLowerCase() !== invite.email) throw new Error(`Sign in as ${invite.email} to accept this invitation.`);
    const membership = await ctx.db.query("projectMembers")
      .withIndex("by_project_user", (q) => q.eq("projectId", invite.projectId).eq("userId", user._id)).unique();
    if (!membership) await ctx.db.insert("projectMembers", {
      projectId: invite.projectId,
      userId: user._id,
      role: invite.role,
      createdAt: Date.now(),
    });
    if (!invite.acceptedAt) await ctx.db.patch(invite._id, { acceptedAt: Date.now() });
    const project = await ctx.db.get(invite.projectId);
    return { projectId: invite.projectId, projectName: project?.name || "Project" };
  },
});

export const importLocalTasks = mutation({
  args: {
    sessionHash: v.string(),
    projectId: v.id("projects"),
    tasks: v.array(v.object({ legacyImportId: v.string(), title: v.string(), description: v.string(), createdAt: v.optional(v.number()) })),
  },
  handler: async (ctx, args) => {
    const { user } = await requireProjectAccess(ctx, args.sessionHash, args.projectId, editableRoles);
    let imported = 0;
    let skipped = 0;
    for (const item of args.tasks.slice(0, 500)) {
      const legacyImportId = item.legacyImportId.trim().slice(0, 300);
      if (!legacyImportId || !item.title.trim()) continue;
      const existing = await ctx.db.query("tasks")
        .withIndex("by_project_legacy", (q) => q.eq("projectId", args.projectId).eq("legacyImportId", legacyImportId)).unique();
      if (existing) {
        skipped += 1;
        continue;
      }
      const now = Date.now();
      await ctx.db.insert("tasks", {
        projectId: args.projectId,
        sourceMessageIds: [],
        title: item.title.trim().slice(0, 300),
        description: item.description.trim().slice(0, 50_000),
        status: "open",
        createdBy: user._id,
        legacyImportId,
        createdAt: item.createdAt || now,
        updatedAt: now,
      });
      imported += 1;
    }
    return { imported, skipped };
  },
});
