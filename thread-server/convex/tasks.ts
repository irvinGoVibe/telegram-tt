import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query } from "./_generated/server";
import { requireProjectAccess } from "./lib/access";

const editableRoles = ["owner", "editor"];
const statuses = new Set(["open", "in_progress", "done", "cancelled"]);
const DAY_MS = 24 * 60 * 60 * 1_000;
const clientSourceValidator = v.object({
  telegramChatId: v.string(),
  telegramMessageId: v.number(),
  chatTitle: v.string(),
  senderName: v.string(),
  text: v.string(),
  sentAt: v.number(),
  telegramUrl: v.optional(v.string()),
});

async function withSources(ctx: any, task: any) {
  const sources = (await Promise.all(task.sourceMessageIds.map(async (messageId: any, ordinal: number) => {
    const message = await ctx.db.get(messageId);
    if (!message) return null;
    const chat = await ctx.db.get(message.chatId);
    return { ordinal, message, chat };
  }))).filter(Boolean);
  return { ...task, sources };
}

export const createTaskFromMessages = mutation({
  args: {
    sessionHash: v.string(),
    projectId: v.id("projects"),
    sourceMessageIds: v.array(v.id("messages")),
    anchorMessageIds: v.optional(v.array(v.id("messages"))),
    contextWindowDays: v.optional(v.number()),
    generationModel: v.optional(v.string()),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireProjectAccess(ctx, args.sessionHash, args.projectId, editableRoles);
    const title = args.title.trim().slice(0, 300);
    if (!title || !args.sourceMessageIds.length) throw new Error("A task needs a title and at least one source message.");
    const uniqueIds = [...new Set(args.sourceMessageIds)].slice(0, 100);
    const anchorIds = [...new Set(args.anchorMessageIds || [])].slice(0, 20);
    let sourceChatId: any = undefined;
    for (const messageId of [...new Set([...uniqueIds, ...anchorIds])]) {
      const message = await ctx.db.get(messageId);
      if (!message) throw new Error("A selected source message no longer exists.");
      const projectChat = await ctx.db.query("projectChats")
        .withIndex("by_project_chat", (q) => q.eq("projectId", args.projectId).eq("chatId", message.chatId)).unique();
      if (!projectChat) throw new Error("A selected message is not part of this project.");
      sourceChatId ||= message.chatId;
      if (message.chatId !== sourceChatId) throw new Error("Task sources must belong to one project chat.");
    }
    const now = Date.now();
    const id = await ctx.db.insert("tasks", {
      projectId: args.projectId,
      sourceChatId,
      sourceMessageIds: uniqueIds,
      anchorMessageIds: anchorIds.length ? anchorIds : undefined,
      contextWindowDays: args.contextWindowDays ? Math.min(Math.max(Math.floor(args.contextWindowDays), 1), 30) : undefined,
      generationModel: args.generationModel?.trim().slice(0, 120) || undefined,
      generatedAt: args.generationModel ? now : undefined,
      title,
      description: args.description?.trim().slice(0, 50_000) || "",
      status: "open",
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
    return await withSources(ctx, await ctx.db.get(id));
  },
});

export const createTaskFromClientMessages = mutation({
  args: {
    sessionHash: v.string(),
    projectId: v.id("projects"),
    sources: v.array(clientSourceValidator),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireProjectAccess(ctx, args.sessionHash, args.projectId, editableRoles);
    const title = args.title.trim().slice(0, 300);
    const sources = args.sources.slice(0, 20).map((source) => ({
      telegramChatId: source.telegramChatId.trim().slice(0, 200),
      telegramMessageId: Math.floor(source.telegramMessageId),
      chatTitle: source.chatTitle.trim().slice(0, 300) || "Telegram chat",
      senderName: source.senderName.trim().slice(0, 300) || "Telegram user",
      text: source.text.trim().slice(0, 12_000),
      sentAt: Number.isFinite(source.sentAt) ? source.sentAt : Date.now(),
      telegramUrl: source.telegramUrl?.trim().slice(0, 4_000) || undefined,
    })).filter((source) => source.telegramChatId && Number.isFinite(source.telegramMessageId));
    if (!title || !sources.length) throw new Error("A task needs a title and at least one Telegram source.");

    const now = Date.now();
    const id = await ctx.db.insert("tasks", {
      projectId: args.projectId,
      sourceMessageIds: [],
      clientSources: sources,
      title,
      description: args.description?.trim().slice(0, 50_000) || "",
      status: "open",
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
    return await withSources(ctx, await ctx.db.get(id));
  },
});

async function draftAnchorContext(ctx: any, args: { sessionHash: string; projectId: any; chatId: any; anchorMessageIds: any[]; rangeDays: number }) {
  const { project } = await requireProjectAccess(ctx, args.sessionHash, args.projectId, editableRoles);
  const link = await ctx.db.query("projectChats")
    .withIndex("by_project_chat", (q: any) => q.eq("projectId", args.projectId).eq("chatId", args.chatId)).unique();
  const chat = link ? await ctx.db.get(args.chatId) : null;
  if (!chat) throw new Error("Project chat not found.");
  const anchorIds = [...new Set(args.anchorMessageIds)].slice(0, 20);
  if (!anchorIds.length) throw new Error("Select at least one anchor message.");
  const anchors = [];
  for (const messageId of anchorIds) {
    const message = await ctx.db.get(messageId);
    if (!message || message.chatId !== args.chatId) throw new Error("An anchor message is not part of this project chat.");
    anchors.push(message);
  }
  const rangeDays = Math.min(Math.max(Math.floor(args.rangeDays || 10), 1), 30);
  const startAt = Math.min(...anchors.map((message) => message.sentAt)) - rangeDays * DAY_MS;
  const endAt = Math.max(...anchors.map((message) => message.sentAt));
  return { project, chat, anchors, rangeDays, startAt, endAt };
}

export const taskDraftAnchors = query({
  args: {
    sessionHash: v.string(),
    projectId: v.id("projects"),
    chatId: v.id("chats"),
    anchorMessageIds: v.array(v.id("messages")),
    rangeDays: v.number(),
  },
  handler: async (ctx, args) => await draftAnchorContext(ctx, args),
});

export const taskDraftContextPage = query({
  args: {
    sessionHash: v.string(),
    projectId: v.id("projects"),
    chatId: v.id("chats"),
    anchorMessageIds: v.array(v.id("messages")),
    rangeDays: v.number(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const context = await draftAnchorContext(ctx, args);
    const page = await ctx.db.query("messages")
      .withIndex("by_chat_sent_at", (q: any) => q.eq("chatId", args.chatId).gte("sentAt", context.startAt).lte("sentAt", context.endAt))
      .order("asc")
      .paginate(args.paginationOpts);
    return {
      ...page,
      rangeDays: context.rangeDays,
      startAt: context.startAt,
      endAt: context.endAt,
    };
  },
});

export const listProjectTasks = query({
  args: { sessionHash: v.string(), projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await requireProjectAccess(ctx, args.sessionHash, args.projectId);
    const tasks = await ctx.db.query("tasks").withIndex("by_project", (q) => q.eq("projectId", args.projectId)).order("desc").collect();
    return await Promise.all(tasks.map((task) => withSources(ctx, task)));
  },
});

export const getTask = query({
  args: { sessionHash: v.string(), taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found.");
    await requireProjectAccess(ctx, args.sessionHash, task.projectId, editableRoles);
    return await withSources(ctx, task);
  },
});

export const updateTask = mutation({
  args: {
    sessionHash: v.string(),
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    externalUrl: v.optional(v.string()),
    externalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found.");
    await requireProjectAccess(ctx, args.sessionHash, task.projectId, editableRoles);
    if (task.externalUrl && (args.title !== undefined || args.description !== undefined)) {
      throw new Error("This task is already published to Linear and can no longer be edited here.");
    }
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) {
      const title = args.title.trim().slice(0, 300);
      if (!title) throw new Error("Enter a task title.");
      patch.title = title;
    }
    if (args.description !== undefined) patch.description = args.description.trim().slice(0, 50_000);
    if (args.status !== undefined) {
      if (!statuses.has(args.status)) throw new Error("Choose a valid task status.");
      patch.status = args.status;
    }
    if (args.externalUrl !== undefined) patch.externalUrl = args.externalUrl.trim().slice(0, 4_000) || undefined;
    if (args.externalId !== undefined) patch.externalId = args.externalId.trim().slice(0, 200) || undefined;
    await ctx.db.patch(args.taskId, patch);
    return await withSources(ctx, await ctx.db.get(args.taskId));
  },
});
