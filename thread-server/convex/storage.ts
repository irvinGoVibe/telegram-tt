import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireProjectAccess, requireProjectChatAccess } from "./lib/access";

const editableRoles = ["owner", "editor"];

export const generateUploadUrl = mutation({
  args: { sessionHash: v.string(), projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await requireProjectAccess(ctx, args.sessionHash, args.projectId, editableRoles);
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveAttachmentMetadata = mutation({
  args: {
    sessionHash: v.string(),
    projectId: v.id("projects"),
    messageId: v.id("messages"),
    storageId: v.id("_storage"),
    type: v.string(),
    fileName: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found.");
    await requireProjectChatAccess(ctx, args.sessionHash, args.projectId, message.chatId);
    const existing = await ctx.db.query("attachments")
      .withIndex("by_message_storage", (q) => q.eq("messageId", args.messageId).eq("storageId", args.storageId)).unique();
    if (existing) return existing;
    const id = await ctx.db.insert("attachments", {
      messageId: args.messageId,
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

export const attachmentUrl = query({
  args: { sessionHash: v.string(), projectId: v.id("projects"), attachmentId: v.id("attachments") },
  handler: async (ctx, args) => {
    const attachment = await ctx.db.get(args.attachmentId);
    if (!attachment) throw new Error("Attachment not found.");
    const message = await ctx.db.get(attachment.messageId);
    if (!message) throw new Error("Message not found.");
    await requireProjectChatAccess(ctx, args.sessionHash, args.projectId, message.chatId);
    return { attachment, url: await ctx.storage.getUrl(attachment.storageId) };
  },
});

export const assistantAttachmentUrl = query({
  args: { sessionHash: v.string(), attachmentId: v.id("assistantAttachments") },
  handler: async (ctx, args) => {
    const attachment = await ctx.db.get(args.attachmentId);
    if (!attachment) throw new Error("Attachment not found.");
    const message = await ctx.db.get(attachment.assistantMessageId);
    const thread = message ? await ctx.db.get(message.threadId) : null;
    if (!thread) throw new Error("Assistant thread not found.");
    await requireProjectAccess(ctx, args.sessionHash, thread.projectId);
    return { attachment, url: await ctx.storage.getUrl(attachment.storageId) };
  },
});
