import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const SESSION_COOKIE = "thread_session";
const SESSION_SECONDS = 30 * 24 * 60 * 60;
const APP_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function clean(value) {
  return String(value || "").trim();
}

export function convexConfig() {
  const runtimeFile = path.join(APP_ROOT, ".convex-runtime-url");
  const builtUrl = existsSync(runtimeFile) ? clean(readFileSync(runtimeFile, "utf8")) : "";
  const url = clean(process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || process.env.VITE_CONVEX_URL || builtUrl);
  return { url, enabled: /^https:\/\/[a-z0-9-]+\.convex\.cloud$/i.test(url) };
}

let client;
let clientUrl = "";

export function convexClient() {
  const config = convexConfig();
  if (!config.enabled) {
    const error = new Error("Convex is not configured.");
    error.statusCode = 503;
    throw error;
  }
  if (!client || clientUrl !== config.url) {
    client = new ConvexHttpClient(config.url);
    clientUrl = config.url;
  }
  return client;
}

export { api };

export function parseCookies(request) {
  return Object.fromEntries(String(request.headers.cookie || "").split(";").map((part) => {
    const separator = part.indexOf("=");
    if (separator < 0) return ["", ""];
    return [decodeURIComponent(part.slice(0, separator).trim()), decodeURIComponent(part.slice(separator + 1).trim())];
  }).filter(([name]) => name));
}

export function rawSessionToken(request, required = true) {
  const token = clean(parseCookies(request)[SESSION_COOKIE]);
  if (!token && required) {
    const error = new Error("Sign in to continue.");
    error.statusCode = 401;
    throw error;
  }
  return token;
}

export function sessionHash(value) {
  return value ? createHash("sha256").update(value).digest("hex") : "";
}

export function requestSessionHash(request, required = true) {
  return sessionHash(rawSessionToken(request, required));
}

export async function requireUser(request) {
  const hash = requestSessionHash(request);
  try {
    const user = await convexClient().query(api.auth.me, { sessionHash: hash });
    return { user, sessionHash: hash, client: convexClient() };
  } catch (error) {
    error.statusCode ||= /session|sign in/i.test(error.message) ? 401 : 403;
    throw error;
  }
}

export function sessionCookie(token, expiresAt) {
  const secure = process.env.VERCEL || process.env.NODE_ENV === "production" ? "; Secure" : "";
  const maxAge = Math.max(0, Math.min(SESSION_SECONDS, Math.floor((Number(expiresAt) - Date.now()) / 1000)));
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function clearSessionCookie() {
  const secure = process.env.VERCEL || process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function asId(value, label = "resource") {
  const id = clean(value);
  if (!id) {
    const error = new Error(`Choose a valid ${label}.`);
    error.statusCode = 400;
    throw error;
  }
  return id;
}
