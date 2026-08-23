import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { requireUser } from "./lib/access";

export const credentialByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", args.email)).unique();
    if (!user) return null;
    const credential = await ctx.db
      .query("authCredentials")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    return credential ? { user, passwordHash: credential.passwordHash } : null;
  },
});

export const createIdentity = internalMutation({
  args: { email: v.string(), displayName: v.string(), passwordHash: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", args.email)).unique();
    if (existing) throw new Error("An account with this email already exists.");
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      email: args.email,
      displayName: args.displayName,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("authCredentials", { userId, passwordHash: args.passwordHash, createdAt: now, updatedAt: now });
    return userId;
  },
});

export const upsertTelegramIdentity = internalMutation({
  args: {
    telegramUserId: v.string(),
    displayName: v.string(),
    username: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_telegram_user_id", (q) => q.eq("telegramUserId", args.telegramUserId))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        displayName: args.displayName || existing.displayName,
        username: args.username,
        avatarUrl: args.avatarUrl,
        updatedAt: now,
      });
      return existing._id;
    }
    return await ctx.db.insert("users", {
      telegramUserId: args.telegramUserId,
      displayName: args.displayName,
      username: args.username,
      avatarUrl: args.avatarUrl,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const createSession = internalMutation({
  args: { userId: v.id("users"), tokenHash: v.string(), expiresAt: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.insert("authSessions", { ...args, createdAt: Date.now() });
    return await ctx.db.get(args.userId);
  },
});

export const me = query({
  args: { sessionHash: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.sessionHash);
    return {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      telegramUserId: user.telegramUserId,
      username: user.username,
      avatarUrl: user.avatarUrl,
    };
  },
});

export const signOut = mutation({
  args: { sessionHash: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("authSessions")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", args.sessionHash))
      .unique();
    if (session) await ctx.db.delete(session._id);
    return null;
  },
});
