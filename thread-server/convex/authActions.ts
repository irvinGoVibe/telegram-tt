"use node";

import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

function normalizedEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) throw new Error("Enter a valid email address.");
  return email;
}

function passwordDigest(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function passwordMatches(password: string, encoded: string) {
  const [algorithm, salt, expectedHex] = encoded.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function serverSecretMatches(value: string) {
  const expected = String(process.env.THREAD_SERVER_SECRET || "");
  const actual = String(value || "");
  const expectedBytes = Buffer.from(expected);
  const actualBytes = Buffer.from(actual);
  if (expectedBytes.length < 32 || actualBytes.length !== expectedBytes.length) return false;
  return timingSafeEqual(actualBytes, expectedBytes);
}

async function issueSession(ctx: any, userId: any) {
  const sessionToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(sessionToken).digest("hex");
  const user = await ctx.runMutation(internal.auth.createSession, {
    userId,
    tokenHash,
    expiresAt: Date.now() + SESSION_MS,
  });
  return { sessionToken, expiresAt: Date.now() + SESSION_MS, user };
}

export const signUp = action({
  args: { email: v.string(), password: v.string(), displayName: v.string() },
  handler: async (ctx, args) => {
    const email = normalizedEmail(args.email);
    if (args.password.length < 8 || args.password.length > 256) throw new Error("Use a password between 8 and 256 characters.");
    const displayName = args.displayName.trim().slice(0, 120) || email.split("@")[0];
    const userId = await ctx.runMutation(internal.auth.createIdentity, {
      email,
      displayName,
      passwordHash: passwordDigest(args.password),
    });
    return await issueSession(ctx, userId);
  },
});

export const signIn = action({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const credential = await ctx.runQuery(internal.auth.credentialByEmail, { email: normalizedEmail(args.email) });
    if (!credential || !passwordMatches(args.password, credential.passwordHash)) throw new Error("Invalid email or password.");
    return await issueSession(ctx, credential.user._id);
  },
});

export const signInWithTelegram = action({
  args: {
    serverSecret: v.string(),
    telegramUserId: v.string(),
    displayName: v.string(),
    username: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!serverSecretMatches(args.serverSecret)) throw new Error("Telegram sign-in is not authorized.");
    const telegramUserId = args.telegramUserId.trim();
    if (!/^\d{1,24}$/.test(telegramUserId)) throw new Error("Telegram returned an invalid user identifier.");
    const userId = await ctx.runMutation(internal.auth.upsertTelegramIdentity, {
      telegramUserId,
      displayName: args.displayName.trim().slice(0, 120) || "Telegram user",
      username: args.username?.trim().replace(/^@/, "").slice(0, 120) || undefined,
      avatarUrl: args.avatarUrl?.trim().slice(0, 2_000) || undefined,
    });
    return await issueSession(ctx, userId);
  },
});
