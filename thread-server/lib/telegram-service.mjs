import { Api, TelegramClient } from "teleproto";
import { computeCheck } from "teleproto/Password.js";
import { StringSession } from "teleproto/sessions/index.js";
import { decryptJson, decryptSecret, encryptJson, encryptSecret } from "./crypto.mjs";
import { api, convexClient } from "./convex.mjs";

function clean(value, max = 10_000) {
  return String(value ?? "").trim().slice(0, max);
}

function telegramCredentials() {
  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = clean(process.env.TELEGRAM_API_HASH, 200);
  if (!Number.isSafeInteger(apiId) || apiId <= 0 || !apiHash) {
    const error = new Error("Telegram API credentials are not configured.");
    error.statusCode = 503;
    throw error;
  }
  return { apiId, apiHash };
}

function telegramClient(session = "") {
  const { apiId, apiHash } = telegramCredentials();
  return new TelegramClient(new StringSession(session), apiId, apiHash, {
    connectionRetries: 5,
    retryDelay: 1_000,
    autoReconnect: true,
    useWSS: true,
  });
}

function normalizePhone(value) {
  const phone = clean(value, 32).replace(/[\s()-]/g, "");
  if (!/^\+[1-9]\d{6,14}$/.test(phone)) {
    const error = new Error("Enter the phone number in international format, for example +12025550123.");
    error.statusCode = 400;
    throw error;
  }
  return phone;
}

function sessionContext(accountId) {
  return `telegram-session:${accountId}`;
}

function challengeContext(accountId) {
  return `telegram-auth:${accountId}`;
}

function bigIntegerString(value) {
  if (value === undefined || value === null) return "";
  return typeof value === "object" && typeof value.toString === "function" ? value.toString() : String(value);
}

function dateMs(seconds) {
  const value = Number(seconds);
  return Number.isFinite(value) && value > 0 ? value * 1_000 : undefined;
}

function entityName(entity, fallback = "Unknown") {
  if (!entity) return fallback;
  return [entity.firstName, entity.lastName].map((part) => clean(part, 120)).filter(Boolean).join(" ")
    || clean(entity.title || entity.username, 240)
    || fallback;
}

function dialogKind(dialog) {
  if (dialog.isUser) return "private";
  if (dialog.isChannel) return dialog.entity?.broadcast ? "channel" : "supergroup";
  if (dialog.isGroup) return "basic_group";
  return "unknown";
}

function dialogRow(dialog) {
  return {
    telegramChatId: bigIntegerString(dialog.id),
    title: clean(dialog.title || dialog.name, 240) || "Untitled chat",
    type: dialogKind(dialog),
    username: clean(dialog.entity?.username, 120) || undefined,
    unreadCount: Math.max(0, Number(dialog.unreadCount || 0)),
    lastMessageAt: dateMs(dialog.date || dialog.message?.date),
  };
}

async function accountSecret(sessionHash, accountId) {
  return await convexClient().query(api.telegram.getAccountSecret, { sessionHash, accountId });
}

export async function loadSession(sessionHash, accountId) {
  const stored = await accountSecret(sessionHash, accountId);
  if (!stored.encryptedSession || stored.encryptedSession === "pending") {
    const error = new Error("Telegram session was not found.");
    error.statusCode = 409;
    throw error;
  }
  return decryptSecret(stored.encryptedSession, sessionContext(accountId));
}

async function loadChallenge(sessionHash, accountId) {
  const stored = await accountSecret(sessionHash, accountId);
  if (!stored.encryptedChallenge || !stored.challengeExpiresAt || stored.challengeExpiresAt <= Date.now()) {
    const error = new Error("The Telegram login code expired. Start the connection again.");
    error.statusCode = 409;
    throw error;
  }
  return decryptJson(stored.encryptedChallenge, challengeContext(accountId));
}

export async function syncDialogs(sessionHash, accountId, client) {
  const dialogs = await client.getDialogs({ limit: 500 });
  const chats = dialogs.map(dialogRow).filter((row) => row.telegramChatId);
  if (chats.length) await convexClient().mutation(api.telegram.upsertChats, { sessionHash, accountId, chats });
  return { dialogs, count: chats.length };
}

async function finalizeConnection(sessionHash, accountId, client, user) {
  await convexClient().mutation(api.telegram.finalizeAccount, {
    sessionHash,
    accountId,
    encryptedSession: encryptSecret(client.session.save(), sessionContext(accountId)),
    telegramUserId: bigIntegerString(user?.id),
    username: clean(user?.username, 120) || undefined,
    displayName: entityName(user, "Telegram user"),
  });
  const result = await syncDialogs(sessionHash, accountId, client);
  return { connectionId: accountId, status: "connected", chatCount: result.count };
}

export async function beginTelegramConnection({ sessionHash, phoneNumber }) {
  const phone = normalizePhone(phoneNumber);
  const account = await convexClient().mutation(api.telegram.createAccount, {
    sessionHash,
    phoneHint: `•••• ${phone.slice(-4)}`,
    encryptedSession: "pending",
  });
  const telegram = telegramClient();
  try {
    await telegram.connect();
    const code = await telegram.sendCode(telegramCredentials(), phone, false);
    if (code.emailRequired || code.emailCodeSent) {
      const error = new Error("This Telegram account requires email verification, which is not supported yet.");
      error.statusCode = 409;
      throw error;
    }
    await convexClient().mutation(api.telegram.updateAuthState, {
      sessionHash,
      accountId: account._id,
      encryptedSession: encryptSecret(telegram.session.save(), sessionContext(account._id)),
      encryptedChallenge: encryptJson({ phone, phoneCodeHash: code.phoneCodeHash }, challengeContext(account._id)),
      challengeExpiresAt: Date.now() + 10 * 60_000,
      status: "code_required",
      lastError: "",
    });
    return { connectionId: account._id, status: "code_required", delivery: code.isCodeViaApp ? "telegram" : "sms" };
  } catch (error) {
    await convexClient().mutation(api.telegram.updateAuthState, {
      sessionHash,
      accountId: account._id,
      status: "error",
      lastError: clean(error.errorMessage || error.message, 1_000),
    }).catch(() => {});
    throw error;
  } finally {
    await telegram.disconnect().catch(() => {});
  }
}

export async function verifyTelegramCode({ sessionHash, connectionId, code }) {
  const accountId = clean(connectionId, 80);
  const phoneCode = clean(code, 24).replace(/\s/g, "");
  if (!/^\d{3,12}$/.test(phoneCode)) {
    const error = new Error("Enter the Telegram login code.");
    error.statusCode = 400;
    throw error;
  }
  const challenge = await loadChallenge(sessionHash, accountId);
  const telegram = telegramClient(await loadSession(sessionHash, accountId));
  try {
    await telegram.connect();
    const result = await telegram.invoke(new Api.auth.SignIn({
      phoneNumber: challenge.phone,
      phoneCodeHash: challenge.phoneCodeHash,
      phoneCode,
    }));
    if (result instanceof Api.auth.AuthorizationSignUpRequired) {
      const error = new Error("Create this Telegram account in the official app before connecting it here.");
      error.statusCode = 409;
      throw error;
    }
    return await finalizeConnection(sessionHash, accountId, telegram, result.user);
  } catch (error) {
    if (error.errorMessage === "SESSION_PASSWORD_NEEDED") {
      await convexClient().mutation(api.telegram.updateAuthState, {
        sessionHash,
        accountId,
        encryptedSession: encryptSecret(telegram.session.save(), sessionContext(accountId)),
        status: "password_required",
        lastError: "",
      });
      return { connectionId: accountId, status: "password_required" };
    }
    await convexClient().mutation(api.telegram.updateAuthState, {
      sessionHash,
      accountId,
      lastError: clean(error.errorMessage || error.message, 1_000),
    }).catch(() => {});
    throw error;
  } finally {
    await telegram.disconnect().catch(() => {});
  }
}

export async function verifyTelegramPassword({ sessionHash, connectionId, password }) {
  const accountId = clean(connectionId, 80);
  const value = String(password || "");
  if (!value || value.length > 256) {
    const error = new Error("Enter the Telegram 2FA password.");
    error.statusCode = 400;
    throw error;
  }
  await loadChallenge(sessionHash, accountId);
  const telegram = telegramClient(await loadSession(sessionHash, accountId));
  try {
    await telegram.connect();
    const passwordState = await telegram.invoke(new Api.account.GetPassword());
    const check = await computeCheck(passwordState, value);
    const authorization = await telegram.invoke(new Api.auth.CheckPassword({ password: check }));
    return await finalizeConnection(sessionHash, accountId, telegram, authorization.user);
  } catch (error) {
    await convexClient().mutation(api.telegram.updateAuthState, {
      sessionHash,
      accountId,
      lastError: clean(error.errorMessage || error.message, 1_000),
    }).catch(() => {});
    throw error;
  } finally {
    await telegram.disconnect().catch(() => {});
  }
}

export async function refreshTelegramDialogs({ sessionHash, connectionId }) {
  const accountId = clean(connectionId, 80);
  const telegram = telegramClient(await loadSession(sessionHash, accountId));
  try {
    await telegram.connect();
    return await syncDialogs(sessionHash, accountId, telegram);
  } finally {
    await telegram.disconnect().catch(() => {});
  }
}

export async function disconnectTelegramConnection({ sessionHash, connectionId }) {
  const accountId = clean(connectionId, 80);
  try {
    const telegram = telegramClient(await loadSession(sessionHash, accountId));
    await telegram.connect();
    await telegram.logOut();
  } catch {
    // Remove the local connection after a remotely revoked Telegram session.
  }
  await convexClient().mutation(api.telegram.deleteAccount, { sessionHash, accountId });
  return { disconnected: true };
}

export function createAuthorizedTelegramClient(session) {
  return telegramClient(session);
}

export function telegramErrorMessage(error) {
  const raw = clean(error?.errorMessage || error?.message || "Telegram request failed.", 1_000);
  return raw
    .replace(/^PHONE_CODE_INVALID$/i, "The Telegram login code is invalid.")
    .replace(/^PHONE_CODE_EXPIRED$/i, "The Telegram login code expired. Start again.")
    .replace(/^PASSWORD_HASH_INVALID$/i, "The Telegram 2FA password is invalid.")
    .replace(/^FLOOD_WAIT_(\d+)$/i, "Telegram temporarily rate-limited this login. Try again later.");
}
