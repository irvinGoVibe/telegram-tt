import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOwnedTelegramAccount, requireProjectAccess, requireProjectChatAccess, requireUser } from "./lib/access";

const editableRoles = ["owner", "editor"];

const chatInput = v.object({
  telegramChatId: v.string(),
  type: v.string(),
  title: v.string(),
  username: v.optional(v.string()),
  unreadCount: v.optional(v.number()),
  lastMessageAt: v.optional(v.number()),
});

const messageInput = v.object({
  telegramMessageId: v.number(),
  senderTelegramId: v.optional(v.string()),
  senderName: v.string(),
  text: v.string(),
  entities: v.optional(v.array(v.object({
    type: v.string(),
    offset: v.number(),
    length: v.number(),
    url: v.optional(v.string()),
    language: v.optional(v.string()),
  }))),
  sentAt: v.number(),
  editedAt: v.optional(v.number()),
  replyToMessageId: v.optional(v.number()),
  telegramUrl: v.optional(v.string()),
});

export const createAccount = mutation({
  args: { sessionHash: v.string(), phoneHint: v.string(), encryptedSession: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.sessionHash);
    const now = Date.now();
    const id = await ctx.db.insert("telegramAccounts", {
      userId: user._id,
      encryptedSession: args.encryptedSession,
      phoneHint: args.phoneHint,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
    const account = await ctx.db.get(id);
    return account && { ...account, encryptedSession: undefined, encryptedChallenge: undefined };
  },
});

export const updateAuthState = mutation({
  args: {
    sessionHash: v.string(),
    accountId: v.id("telegramAccounts"),
    encryptedSession: v.optional(v.string()),
    encryptedChallenge: v.optional(v.string()),
    challengeExpiresAt: v.optional(v.number()),
    status: v.optional(v.string()),
    lastError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOwnedTelegramAccount(ctx, args.sessionHash, args.accountId);
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const key of ["encryptedSession", "encryptedChallenge", "challengeExpiresAt", "status", "lastError"] as const) {
      if (args[key] !== undefined) patch[key] = args[key];
    }
    await ctx.db.patch(args.accountId, patch);
    return null;
  },
});

export const finalizeAccount = mutation({
  args: {
    sessionHash: v.string(),
    accountId: v.id("telegramAccounts"),
    encryptedSession: v.string(),
    telegramUserId: v.string(),
    username: v.optional(v.string()),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireOwnedTelegramAccount(ctx, args.sessionHash, args.accountId);
    const now = Date.now();
    await ctx.db.patch(args.accountId, {
      encryptedSession: args.encryptedSession,
      encryptedChallenge: undefined,
      challengeExpiresAt: undefined,
      status: "connected",
      lastError: undefined,
      lastSyncAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(user._id, {
      telegramUserId: args.telegramUserId,
      username: args.username,
      displayName: args.displayName || user.displayName,
      updatedAt: now,
    });
    return { accountId: args.accountId, status: "connected" };
  },
});

export const getAccountSecret = query({
  args: { sessionHash: v.string(), accountId: v.id("telegramAccounts") },
  handler: async (ctx, args) => {
    const { account } = await requireOwnedTelegramAccount(ctx, args.sessionHash, args.accountId);
    return {
      encryptedSession: account.encryptedSession,
      encryptedChallenge: account.encryptedChallenge,
      challengeExpiresAt: account.challengeExpiresAt,
      status: account.status,
    };
  },
});

export const listAccounts = query({
  args: { sessionHash: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.sessionHash);
    const accounts = await ctx.db.query("telegramAccounts").withIndex("by_user", (q) => q.eq("userId", user._id)).order("desc").collect();
    return accounts.map(({ encryptedSession: _session, encryptedChallenge: _challenge, ...account }) => account);
  },
});

export const deleteAccount = mutation({
  args: { sessionHash: v.string(), accountId: v.id("telegramAccounts") },
  handler: async (ctx, args) => {
    await requireOwnedTelegramAccount(ctx, args.sessionHash, args.accountId);
    const chats = await ctx.db.query("chats").withIndex("by_account", (q) => q.eq("telegramAccountId", args.accountId)).collect();
    for (const chat of chats) {
      const links = await ctx.db.query("projectChats").withIndex("by_chat", (q) => q.eq("chatId", chat._id)).collect();
      if (links.length) throw new Error("Remove this account's chats from projects before disconnecting it.");
      await ctx.db.delete(chat._id);
    }
    await ctx.db.delete(args.accountId);
    return null;
  },
});

export const upsertChat = mutation({
  args: { sessionHash: v.string(), accountId: v.id("telegramAccounts"), chat: chatInput },
  handler: async (ctx, args) => {
    await requireOwnedTelegramAccount(ctx, args.sessionHash, args.accountId);
    const now = Date.now();
    const existing = await ctx.db.query("chats")
      .withIndex("by_account_telegram_chat", (q) => q.eq("telegramAccountId", args.accountId).eq("telegramChatId", args.chat.telegramChatId)).unique();
    const values = { ...args.chat, updatedAt: now };
    if (existing) {
      await ctx.db.patch(existing._id, values);
      return await ctx.db.get(existing._id);
    }
    const id = await ctx.db.insert("chats", { telegramAccountId: args.accountId, ...values, createdAt: now });
    return await ctx.db.get(id);
  },
});

export const upsertChats = mutation({
  args: { sessionHash: v.string(), accountId: v.id("telegramAccounts"), chats: v.array(chatInput) },
  handler: async (ctx, args) => {
    await requireOwnedTelegramAccount(ctx, args.sessionHash, args.accountId);
    const now = Date.now();
    const ids = [];
    for (const chat of args.chats.slice(0, 500)) {
      const existing = await ctx.db.query("chats")
        .withIndex("by_account_telegram_chat", (q) => q.eq("telegramAccountId", args.accountId).eq("telegramChatId", chat.telegramChatId)).unique();
      if (existing) {
        await ctx.db.patch(existing._id, { ...chat, updatedAt: now });
        ids.push(existing._id);
      } else {
        ids.push(await ctx.db.insert("chats", { telegramAccountId: args.accountId, ...chat, createdAt: now, updatedAt: now }));
      }
    }
    return ids;
  },
});

export const listChats = query({
  args: { sessionHash: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.sessionHash);
    const accounts = await ctx.db.query("telegramAccounts").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
    const groups = await Promise.all(accounts.map((account) => ctx.db.query("chats").withIndex("by_account", (q) => q.eq("telegramAccountId", account._id)).collect()));
    return groups.flat().sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
  },
});

export const addChatToProject = mutation({
  args: { sessionHash: v.string(), projectId: v.id("projects"), chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const { user } = await requireProjectAccess(ctx, args.sessionHash, args.projectId, editableRoles);
    const chat = await ctx.db.get(args.chatId);
    const account = chat ? await ctx.db.get(chat.telegramAccountId) : null;
    if (!chat || !account || account.userId !== user._id) throw new Error("You can only add chats from your own Telegram account.");
    const existing = await ctx.db.query("projectChats")
      .withIndex("by_project_chat", (q) => q.eq("projectId", args.projectId).eq("chatId", args.chatId)).unique();
    if (existing) return existing;
    const id = await ctx.db.insert("projectChats", { projectId: args.projectId, chatId: args.chatId, createdAt: Date.now() });
    return await ctx.db.get(id);
  },
});

export const removeChatFromProject = mutation({
  args: { sessionHash: v.string(), projectId: v.id("projects"), chatId: v.id("chats") },
  handler: async (ctx, args) => {
    await requireProjectAccess(ctx, args.sessionHash, args.projectId, editableRoles);
    const existing = await ctx.db.query("projectChats")
      .withIndex("by_project_chat", (q) => q.eq("projectId", args.projectId).eq("chatId", args.chatId)).unique();
    if (existing) await ctx.db.delete(existing._id);
    return null;
  },
});

export const listProjectChats = query({
  args: { sessionHash: v.string(), projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await requireProjectAccess(ctx, args.sessionHash, args.projectId);
    const links = await ctx.db.query("projectChats").withIndex("by_project", (q) => q.eq("projectId", args.projectId)).collect();
    return (await Promise.all(links.map(async (link) => {
      const chat = await ctx.db.get(link.chatId);
      return chat ? { ...link, chat } : null;
    }))).filter(Boolean);
  },
});

export const syncContext = query({
  args: { sessionHash: v.string(), projectId: v.id("projects"), chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const { user, chat } = await requireProjectChatAccess(ctx, args.sessionHash, args.projectId, args.chatId);
    const account = await ctx.db.get(chat.telegramAccountId);
    if (!account || account.userId !== user._id) throw new Error("Only the connected Telegram account owner can sync this chat.");
    return { chat, encryptedSession: account.encryptedSession, accountId: account._id };
  },
});

export const upsertMessages = mutation({
  args: {
    sessionHash: v.string(),
    projectId: v.id("projects"),
    chatId: v.id("chats"),
    messages: v.array(messageInput),
    lastMessageId: v.optional(v.number()),
    syncedAt: v.number(),
  },
  handler: async (ctx, args) => {
    await requireProjectChatAccess(ctx, args.sessionHash, args.projectId, args.chatId);
    const ids: Array<{ telegramMessageId: number; messageId: any }> = [];
    for (const message of args.messages.slice(0, 1_000)) {
      const existing = await ctx.db.query("messages")
        .withIndex("by_chat_message", (q) => q.eq("chatId", args.chatId).eq("telegramMessageId", message.telegramMessageId)).unique();
      if (existing) {
        await ctx.db.patch(existing._id, message);
        ids.push({ telegramMessageId: message.telegramMessageId, messageId: existing._id });
      } else {
        const messageId = await ctx.db.insert("messages", { chatId: args.chatId, ...message, createdAt: Date.now() });
        ids.push({ telegramMessageId: message.telegramMessageId, messageId });
      }
    }
    const chat = await ctx.db.get(args.chatId);
    const latest = Math.max(chat?.lastMessageId || 0, args.lastMessageId || 0);
    await ctx.db.patch(args.chatId, { lastMessageId: latest || undefined, lastSyncAt: args.syncedAt, updatedAt: args.syncedAt });
    const account = chat ? await ctx.db.get(chat.telegramAccountId) : null;
    if (account) await ctx.db.patch(account._id, { lastSyncAt: args.syncedAt, lastError: undefined, updatedAt: args.syncedAt });
    return ids;
  },
});

export const listMessages = query({
  args: {
    sessionHash: v.string(),
    projectId: v.id("projects"),
    chatId: v.id("chats"),
    limit: v.optional(v.number()),
    sourceId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    await requireProjectChatAccess(ctx, args.sessionHash, args.projectId, args.chatId);
    const limit = Math.min(Math.max(args.limit || 250, 1), 1_000);
    let messages;
    if (args.sourceId) {
      const source = await ctx.db.get(args.sourceId);
      if (!source || source.chatId !== args.chatId) throw new Error("Source message is not available in this project chat.");
      const beforeLimit = Math.max(1, Math.floor(limit / 2));
      const before = (await ctx.db.query("messages")
        .withIndex("by_chat_sent_at", (q) => q.eq("chatId", args.chatId).lte("sentAt", source.sentAt))
        .order("desc")
        .take(beforeLimit))
        .reverse();
      const after = await ctx.db.query("messages")
        .withIndex("by_chat_sent_at", (q) => q.eq("chatId", args.chatId).gte("sentAt", source.sentAt))
        .order("asc")
        .take(Math.max(1, limit - before.length + 1));
      messages = [...new Map([...before, source, ...after].map((message) => [String(message._id), message])).values()]
        .sort((left, right) => left.sentAt - right.sentAt)
        .slice(0, limit);
    } else {
      messages = (await ctx.db.query("messages")
        .withIndex("by_chat_sent_at", (q) => q.eq("chatId", args.chatId))
        .order("desc")
        .take(limit))
        .reverse();
    }
    return await Promise.all(messages.map(async (message) => ({
      ...message,
      attachments: await ctx.db.query("attachments").withIndex("by_message", (q) => q.eq("messageId", message._id)).collect(),
    })));
  },
});

export const searchMessages = query({
  args: {
    sessionHash: v.string(),
    projectId: v.id("projects"),
    chatId: v.id("chats"),
    search: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireProjectChatAccess(ctx, args.sessionHash, args.projectId, args.chatId);
    const search = args.search.trim().slice(0, 200);
    if (!search) return [];
    const limit = Math.min(Math.max(args.limit || 50, 1), 100);
    const messages = await ctx.db.query("messages")
      .withSearchIndex("search_text", (q) => q.search("text", search).eq("chatId", args.chatId))
      .take(limit);
    return messages.sort((left, right) => left.sentAt - right.sentAt);
  },
});
