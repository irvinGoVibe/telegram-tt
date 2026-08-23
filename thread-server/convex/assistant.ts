import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireProjectAccess } from "./lib/access";

const editableRoles = ["owner", "editor"];

async function messageWithDetails(ctx: any, message: any) {
  const citations = await ctx.db.query("assistantCitations")
    .withIndex("by_assistant_message", (q: any) => q.eq("assistantMessageId", message._id)).collect();
  const attachments = await ctx.db.query("assistantAttachments")
    .withIndex("by_assistant_message", (q: any) => q.eq("assistantMessageId", message._id)).collect();
  return { ...message, citations, attachments };
}

export const createThread = mutation({
  args: { sessionHash: v.string(), projectId: v.id("projects"), title: v.optional(v.string()), model: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { user } = await requireProjectAccess(ctx, args.sessionHash, args.projectId, editableRoles);
    const now = Date.now();
    const id = await ctx.db.insert("assistantThreads", {
      projectId: args.projectId,
      createdBy: user._id,
      title: args.title?.trim().slice(0, 160) || "New chat",
      model: args.model?.trim().slice(0, 120) || undefined,
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(id);
  },
});

export const listMessages = query({
  args: { sessionHash: v.string(), threadId: v.id("assistantThreads") },
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.threadId);
    if (!thread) throw new Error("Assistant thread not found.");
    await requireProjectAccess(ctx, args.sessionHash, thread.projectId);
    const messages = await ctx.db.query("assistantMessages").withIndex("by_thread", (q) => q.eq("threadId", args.threadId)).collect();
    return await Promise.all(messages.map((message) => messageWithDetails(ctx, message)));
  },
});

export const addUserMessage = mutation({
  args: { sessionHash: v.string(), projectId: v.id("projects"), threadId: v.id("assistantThreads"), content: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireProjectAccess(ctx, args.sessionHash, args.projectId, editableRoles);
    const thread = await ctx.db.get(args.threadId);
    if (!thread || thread.projectId !== args.projectId) throw new Error("Assistant thread not found.");
    const id = await ctx.db.insert("assistantMessages", {
      threadId: args.threadId,
      authorKind: "user",
      authorUserId: user._id,
      content: args.content.slice(0, 8_000),
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.threadId, { updatedAt: Date.now() });
    return await ctx.db.get(id);
  },
});

export const saveAssistantAttachment = mutation({
  args: {
    sessionHash: v.string(),
    projectId: v.id("projects"),
    assistantMessageId: v.id("assistantMessages"),
    storageId: v.id("_storage"),
    type: v.string(),
    fileName: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireProjectAccess(ctx, args.sessionHash, args.projectId, editableRoles);
    const message = await ctx.db.get(args.assistantMessageId);
    const thread = message ? await ctx.db.get(message.threadId) : null;
    if (!thread || thread.projectId !== args.projectId) throw new Error("Assistant message not found.");
    const id = await ctx.db.insert("assistantAttachments", {
      assistantMessageId: args.assistantMessageId,
      storageId: args.storageId,
      type: args.type.slice(0, 80),
      fileName: args.fileName?.slice(0, 500),
      mimeType: args.mimeType?.slice(0, 240),
      size: args.size,
      createdAt: Date.now(),
    });
    return await ctx.db.get(id);
  },
});

export const context = query({
  args: { sessionHash: v.string(), projectId: v.id("projects"), threadId: v.id("assistantThreads"), chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const { project } = await requireProjectAccess(ctx, args.sessionHash, args.projectId, editableRoles);
    const thread = await ctx.db.get(args.threadId);
    if (!thread || thread.projectId !== args.projectId) throw new Error("Assistant thread not found.");
    const link = await ctx.db.query("projectChats").withIndex("by_project_chat", (q) => q.eq("projectId", args.projectId).eq("chatId", args.chatId)).unique();
    const chat = link ? await ctx.db.get(args.chatId) : null;
    if (!chat) throw new Error("Project chat not found.");
    const messages = (await ctx.db.query("messages").withIndex("by_chat_sent_at", (q) => q.eq("chatId", args.chatId)).order("desc").take(2_000)).reverse();
    const history = (await ctx.db.query("assistantMessages").withIndex("by_thread", (q) => q.eq("threadId", args.threadId)).order("desc").take(8)).reverse();
    return { project, thread, chat, messages, history };
  },
});

export const saveAssistantAnswer = mutation({
  args: {
    sessionHash: v.string(),
    projectId: v.id("projects"),
    threadId: v.id("assistantThreads"),
    chatId: v.id("chats"),
    content: v.string(),
    model: v.string(),
    citationTelegramMessageIds: v.array(v.number()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireProjectAccess(ctx, args.sessionHash, args.projectId, editableRoles);
    const thread = await ctx.db.get(args.threadId);
    if (!thread || thread.projectId !== args.projectId) throw new Error("Assistant thread not found.");
    const id = await ctx.db.insert("assistantMessages", {
      threadId: args.threadId,
      authorKind: "assistant",
      content: args.content,
      model: args.model,
      createdAt: Date.now(),
    });
    let ordinal = 0;
    for (const telegramMessageId of [...new Set(args.citationTelegramMessageIds)].slice(0, 250)) {
      const message = await ctx.db.query("messages")
        .withIndex("by_chat_message", (q) => q.eq("chatId", args.chatId).eq("telegramMessageId", telegramMessageId)).unique();
      if (message) await ctx.db.insert("assistantCitations", { assistantMessageId: id, telegramMessageId: message._id, ordinal: ordinal++ });
    }
    await ctx.db.patch(args.threadId, {
      title: args.title?.trim().slice(0, 160) || thread.title,
      model: args.model,
      updatedAt: Date.now(),
    });
    return await messageWithDetails(ctx, await ctx.db.get(id));
  },
});
