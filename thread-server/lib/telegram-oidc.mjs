import { createHash, randomBytes } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { decryptJson, encryptJson } from "./crypto.mjs";
import { parseCookies } from "./convex.mjs";

const AUTHORIZATION_URL = "https://oauth.telegram.org/auth";
const TOKEN_URL = "https://oauth.telegram.org/token";
const ISSUER = "https://oauth.telegram.org";
const JWKS = createRemoteJWKSet(new URL("https://oauth.telegram.org/.well-known/jwks.json"));
const STATE_COOKIE = "thread_telegram_oidc";
const STATE_CONTEXT = "thread:telegram-oidc:v1";
const STATE_TTL_MS = 10 * 60 * 1_000;

function clean(value, max = 2_000) {
  return String(value || "").trim().slice(0, max);
}

function base64urlDigest(value) {
  return createHash("sha256").update(value).digest("base64url");
}

function secureCookie() {
  return process.env.VERCEL || process.env.NODE_ENV === "production" ? "; Secure" : "";
}

function cookie(value, maxAge) {
  return `${STATE_COOKIE}=${encodeURIComponent(value)}; Path=/api/auth/telegram; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secureCookie()}`;
}

function requestOrigin(request) {
  const protocol = clean(request.headers["x-forwarded-proto"], 20).split(",")[0] || "http";
  const host = clean(request.headers["x-forwarded-host"] || request.headers.host, 500).split(",")[0];
  if (!host || !["http", "https"].includes(protocol)) throw new Error("Unable to determine the Telegram callback URL.");
  return `${protocol}://${host}`;
}

function safeReturnPath(value) {
  const fallback = clean(process.env.THREAD_CLIENT_REDIRECT_PATH, 500) || "/";
  const candidate = clean(value, 1_000) || fallback;
  return candidate.startsWith("/") && !candidate.startsWith("//") ? candidate : fallback;
}

export function telegramOidcConfig(request) {
  const clientId = clean(process.env.TELEGRAM_OIDC_CLIENT_ID, 120);
  const clientSecret = clean(process.env.TELEGRAM_OIDC_CLIENT_SECRET, 1_000);
  const configuredRedirect = clean(process.env.TELEGRAM_OIDC_REDIRECT_URI, 1_000);
  const redirectUri = configuredRedirect || `${requestOrigin(request)}/api/auth/telegram/callback`;
  return {
    clientId,
    clientSecret,
    redirectUri,
    enabled: Boolean(clientId && clientSecret && process.env.SESSION_ENCRYPTION_KEY && process.env.THREAD_SERVER_SECRET),
  };
}

export function beginTelegramOidc(request, returnTo) {
  const config = telegramOidcConfig(request);
  if (!config.enabled) {
    const error = new Error("Telegram sign-in is not configured on this server.");
    error.statusCode = 503;
    throw error;
  }

  const state = randomBytes(24).toString("base64url");
  const nonce = randomBytes(24).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const expiresAt = Date.now() + STATE_TTL_MS;
  const statePayload = encryptJson({ state, nonce, verifier, expiresAt, returnTo: safeReturnPath(returnTo) }, STATE_CONTEXT);
  const authorizeUrl = new URL(AUTHORIZATION_URL);
  authorizeUrl.searchParams.set("client_id", config.clientId);
  authorizeUrl.searchParams.set("redirect_uri", config.redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "openid profile");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("nonce", nonce);
  authorizeUrl.searchParams.set("code_challenge", base64urlDigest(verifier));
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  return { authorizeUrl: authorizeUrl.toString(), stateCookie: cookie(statePayload, Math.ceil(STATE_TTL_MS / 1_000)) };
}

export async function completeTelegramOidc(request, url) {
  const config = telegramOidcConfig(request);
  if (!config.enabled) {
    const error = new Error("Telegram sign-in is not configured on this server.");
    error.statusCode = 503;
    throw error;
  }

  const encryptedState = parseCookies(request)[STATE_COOKIE];
  if (!encryptedState) throw new Error("Telegram sign-in expired. Please try again.");
  let pending;
  try {
    pending = decryptJson(encryptedState, STATE_CONTEXT);
  } catch {
    throw new Error("Telegram sign-in state is invalid. Please try again.");
  }
  const state = clean(url.searchParams.get("state"), 500);
  const code = clean(url.searchParams.get("code"), 4_000);
  if (!state || state !== pending.state || !code || Number(pending.expiresAt) <= Date.now()) {
    throw new Error("Telegram sign-in expired or could not be verified. Please try again.");
  }

  const tokenResponse = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      code_verifier: pending.verifier,
    }),
  });
  const tokens = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !tokens.id_token) throw new Error(clean(tokens.error_description || tokens.error, 1_000) || "Telegram sign-in failed.");

  const { payload } = await jwtVerify(tokens.id_token, JWKS, {
    issuer: ISSUER,
    audience: config.clientId,
    algorithms: ["RS256", "ES256"],
  });
  if (!payload.sub || payload.nonce !== pending.nonce) throw new Error("Telegram returned an invalid identity token.");

  return {
    identity: {
      telegramUserId: String(payload.sub),
      displayName: clean(payload.name
        || [payload.first_name, payload.last_name].filter(Boolean).join(" ")
        || payload.given_name
        || payload.preferred_username
        || payload.username
        || "Telegram user", 120),
      username: clean(payload.preferred_username || payload.username, 120) || undefined,
      avatarUrl: clean(payload.picture || payload.photo_url, 2_000) || undefined,
    },
    returnTo: safeReturnPath(pending.returnTo),
    clearStateCookie: cookie("", 0),
  };
}

export function clearTelegramOidcCookie() {
  return cookie("", 0);
}
