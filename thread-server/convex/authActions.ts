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
