import { Api } from "teleproto";
import { api, convexClient } from "./convex.mjs";
import { createAuthorizedTelegramClient, loadSession } from "./telegram-service.mjs";

const DEFAULT_MEDIA_BYTES = 15 * 1024 * 1024;
const DEFAULT_MEDIA_PER_SYNC = 200;
const TASK_HISTORY_LIMIT = 10_000;
const UPSERT_BATCH_SIZE = 500;
const ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "audio/mpeg", "audio/ogg", "application/pdf",
]);
const ALLOWED_MESSAGE_ENTITY_TYPES = new Set(["bold", "italic", "underline", "strike", "code", "pre"]);

function clean(value, max = 10_000) {
  return String(value ?? "").trim().slice(0, max);
}

function bigIntegerString(value) {
  if (value === undefined || value === null) return "";
  return typeof value === "object" && typeof value.toString === "function" ? value.toString() : String(value);
}

function dateMs(seconds) {
  const value = Number(seconds);
  return Number.isFinite(value) && value > 0 ? value * 1_000 : Date.now();
}

function entityName(entity, fallback = "Unknown") {
  if (!entity) return fallback;
  return [entity.firstName, entity.lastName].map((part) => clean(part, 120)).filter(Boolean).join(" ")
    || clean(entity.title || entity.username, 240)
    || fallback;
}

function mediaKind(message) {
  if (message.photo) return "photo";
  if (message.voice) return "voice";
  if (message.audio) return "audio";
  if (message.video || message.videoNote) return "video";
  if (message.sticker) return "sticker";
  if (message.gif) return "animation";
  if (message.document) return "document";
  return message.media ? "other" : "";
}

function messageUrl(chat, messageId) {
  const username = clean(chat.username, 120).replace(/^@/, "");
  if (username) return `https://t.me/${username}/${messageId}`;
  if (!["supergroup", "channel"].includes(chat.type)) return undefined;
  const internalId = clean(chat.telegramChatId, 80).replace(/^-100/, "").replace(/^\+/, "");
  return /^\d+$/.test(internalId) ? `https://t.me/c/${internalId}/${messageId}` : undefined;
}

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

export function outgoingTelegramMessageText(value) {
  const message = String(value ?? "").trim();
  if (!message) {
    const error = new Error("Write a message before sending.");
    error.statusCode = 400;
    throw error;
  }
  if ([...message].length > 4_096) {
    const error = new Error("Telegram messages can contain at most 4,096 characters.");
    error.statusCode = 400;
    throw error;
  }
  return message;
}

export function outgoingTelegramMessagePayload(value, entities = []) {
  const raw = String(value ?? "");
  const message = outgoingTelegramMessageText(raw);
  const leading = raw.length - raw.trimStart().length;
  const end = leading + message.length;
  const normalized = [];
  for (const entity of Array.isArray(entities) ? entities : []) {
    const type = clean(entity?.type, 24).toLowerCase();
    const offset = Number(entity?.offset);
    const length = Number(entity?.length);
    if (!ALLOWED_MESSAGE_ENTITY_TYPES.has(type) || !Number.isInteger(offset) || !Number.isInteger(length)
      || offset < 0 || length <= 0 || offset + length > raw.length) continue;
    const entityStart = Math.max(leading, offset);
    const entityEnd = Math.min(end, offset + length);
    if (entityEnd <= entityStart) continue;
    normalized.push({
      type,
      offset: entityStart - leading,
      length: entityEnd - entityStart,
      ...(type === "pre" && clean(entity?.language, 64) ? { language: clean(entity.language, 64) } : {}),
    });
  }
  return { message, entities: normalized.slice(0, 100) };
}

function normalizeMessageEntities(entities) {
  return (Array.isArray(entities) ? entities : []).flatMap((entity) => {
    const className = clean(entity?.className || entity?.constructor?.name, 80);
    const type = {
      MessageEntityBold: "bold",
      MessageEntityItalic: "italic",
      MessageEntityUnderline: "underline",
      MessageEntityStrike: "strike",
      MessageEntityCode: "code",
      MessageEntityPre: "pre",
      MessageEntityUrl: "url",
      MessageEntityTextUrl: "text_url",
    }[className];
    const offset = Number(entity?.offset);
    const length = Number(entity?.length);
    if (!type || !Number.isInteger(offset) || !Number.isInteger(length) || length <= 0) return [];
    return [{
      type,
      offset,
      length,
      ...(type === "text_url" && clean(entity?.url, 4_000) ? { url: clean(entity.url, 4_000) } : {}),
      ...(type === "pre" && clean(entity?.language, 64) ? { language: clean(entity.language, 64) } : {}),
    }];
  });
}

function telegramFormattingEntities(entities) {
  return entities.map((entity) => {
    const values = { offset: entity.offset, length: entity.length };
    if (entity.type === "bold") return new Api.MessageEntityBold(values);
    if (entity.type === "italic") return new Api.MessageEntityItalic(values);
    if (entity.type === "underline") return new Api.MessageEntityUnderline(values);
    if (entity.type === "strike") return new Api.MessageEntityStrike(values);
    if (entity.type === "pre") return new Api.MessageEntityPre({ ...values, language: entity.language || "" });
    return new Api.MessageEntityCode(values);
  });
}

function mediaMetadata(message) {
  const type = mediaKind(message);
  if (!type) return null;
  const file = message.file;
  const mimeType = clean(file?.mimeType, 240).toLowerCase()
    || (type === "photo" ? "image/jpeg" : type === "sticker" ? "image/webp" : "");
  return {
    type,
    fileName: clean(file?.name, 500) || `${type}-${message.id}`,
    mimeType,
    size: positiveInteger(file?.size, 0) || undefined,
  };
}

export async function normalizeTelegramMessage(chat, message) {
  let sender = message.sender;
  if (!sender && typeof message.getSender === "function") sender = await message.getSender().catch(() => undefined);
  return {
    row: {
      telegramMessageId: Number(message.id),
      senderTelegramId: bigIntegerString(message.senderId) || undefined,
      senderName: entityName(sender, message.postAuthor || "Unknown"),
      text: String(message.message || ""),
      entities: normalizeMessageEntities(message.entities),
      sentAt: dateMs(message.date),
      editedAt: message.editDate ? dateMs(message.editDate) : undefined,
      replyToMessageId: Number(message.replyToMsgId) || undefined,
      telegramUrl: messageUrl(chat, Number(message.id)),
    },
    media: mediaMetadata(message),
    source: message,
  };
}

async function uploadMedia({ sessionHash, projectId, telegram, normalized, budget }) {
  if (!normalized.media || budget.remaining <= 0) return null;
  const { media } = normalized;
  if (!ALLOWED_MEDIA_TYPES.has(media.mimeType) || (media.size && media.size > budget.maxBytes)) return null;
  budget.remaining -= 1;
  const downloaded = await telegram.downloadMedia(normalized.source, {});
  if (!Buffer.isBuffer(downloaded) || !downloaded.length || downloaded.length > budget.maxBytes) return null;
  const uploadUrl = await convexClient().mutation(api.storage.generateUploadUrl, { sessionHash, projectId });
  const uploaded = await fetch(uploadUrl, {
    method: "POST",
    headers: { "content-type": media.mimeType },
    body: downloaded,
  });
  if (!uploaded.ok) throw new Error(`Convex Storage returned ${uploaded.status}.`);
  const result = await uploaded.json();
  if (!result.storageId) throw new Error("Convex Storage did not return a storage ID.");
  return { ...media, size: downloaded.length, storageId: result.storageId };
}

async function projectTelegramContext({ sessionHash, projectId, chatId }) {
  const context = await convexClient().query(api.telegram.syncContext, { sessionHash, projectId, chatId });
  const telegram = createAuthorizedTelegramClient(await loadSession(sessionHash, context.accountId));
  try {
    await telegram.connect();
    const dialogs = await telegram.getDialogs({ limit: 500 });
    const dialog = dialogs.find((candidate) => bigIntegerString(candidate.id) === context.chat.telegramChatId);
    if (!dialog) throw new Error(`Telegram chat ${context.chat.title} is no longer accessible.`);
    return { context, dialog, telegram };
  } catch (error) {
    await telegram.disconnect().catch(() => {});
    throw error;
  }
}

export async function syncProjectChat({ sessionHash, projectId, chatId }) {
  const { context, dialog, telegram } = await projectTelegramContext({ sessionHash, projectId, chatId });
  try {
    const minId = positiveInteger(context.chat.lastMessageId, 0);
    const messages = await telegram.getMessages(dialog.inputEntity, { limit: 500, minId });
    const fresh = messages.filter((message) => Number(message.id) > minId).sort((left, right) => Number(left.id) - Number(right.id));
    const normalized = [];
    for (const message of fresh) normalized.push(await normalizeTelegramMessage(context.chat, message));
    const syncedAt = Date.now();
    const persisted = await convexClient().mutation(api.telegram.upsertMessages, {
      sessionHash,
      projectId,
      chatId,
      messages: normalized.map((item) => item.row),
      lastMessageId: normalized.at(-1)?.row.telegramMessageId || minId || undefined,
      syncedAt,
    });
    const messageIds = new Map(persisted.map((item) => [item.telegramMessageId, item.messageId]));
    const budget = {
      maxBytes: positiveInteger(process.env.TELEGRAM_MEDIA_MAX_BYTES, DEFAULT_MEDIA_BYTES),
      remaining: positiveInteger(process.env.TELEGRAM_MEDIA_PER_SYNC, DEFAULT_MEDIA_PER_SYNC),
    };
    let attachments = 0;
    let attachmentErrors = 0;
    for (const item of normalized) {
      try {
        const uploaded = await uploadMedia({ sessionHash, projectId, telegram, normalized: item, budget });
        if (!uploaded) continue;
        const messageId = messageIds.get(item.row.telegramMessageId);
        if (!messageId) continue;
        await convexClient().mutation(api.storage.saveAttachmentMetadata, {
          sessionHash,
          projectId,
          messageId,
          storageId: uploaded.storageId,
          type: uploaded.type,
          fileName: uploaded.fileName,
          mimeType: uploaded.mimeType,
          size: uploaded.size,
        });
        attachments += 1;
      } catch (error) {
        attachmentErrors += 1;
        console.warn("Telegram attachment sync skipped", {
          chatId: String(chatId),
          telegramMessageId: item.row.telegramMessageId,
          error: clean(error?.errorMessage || error?.message || "Attachment sync failed.", 500),
        });
      }
    }
    return { messages: persisted.length, attachments, attachmentErrors, lastMessageId: normalized.at(-1)?.row.telegramMessageId || minId };
  } finally {
    await telegram.disconnect().catch(() => {});
  }
}

export async function syncProjectChatWindow({ sessionHash, projectId, chatId, startAt, endAt }) {
  const from = Number(startAt);
  const through = Number(endAt);
  if (!Number.isFinite(from) || !Number.isFinite(through) || from > through) {
    const error = new Error("Choose a valid Telegram history window.");
    error.statusCode = 400;
    throw error;
  }
  const { context, dialog, telegram } = await projectTelegramContext({ sessionHash, projectId, chatId });
  try {
    const history = await telegram.getMessages(dialog.inputEntity, {
      limit: TASK_HISTORY_LIMIT + 1,
      offsetDate: Math.floor((through + 1_000) / 1_000),
      waitTime: 0.1,
    });
    const matching = history
      .filter((message) => {
        const sentAt = dateMs(message.date);
        return sentAt >= from && sentAt <= through;
      })
      .slice(0, TASK_HISTORY_LIMIT);
    const normalized = [];
    for (const message of matching) normalized.push(await normalizeTelegramMessage(context.chat, message));
    normalized.sort((left, right) => left.row.telegramMessageId - right.row.telegramMessageId);

    const syncedAt = Date.now();
    let persisted = 0;
    for (let offset = 0; offset < normalized.length; offset += UPSERT_BATCH_SIZE) {
      const batch = normalized.slice(offset, offset + UPSERT_BATCH_SIZE);
      const rows = await convexClient().mutation(api.telegram.upsertMessages, {
        sessionHash,
        projectId,
        chatId,
        messages: batch.map((item) => item.row),
        lastMessageId: batch.at(-1)?.row.telegramMessageId,
        syncedAt,
      });
      persisted += rows.length;
    }
    return {
      fetched: matching.length,
      persisted,
      truncated: history.length > TASK_HISTORY_LIMIT,
      startAt: from,
      endAt: through,
    };
  } finally {
    await telegram.disconnect().catch(() => {});
  }
}

export async function sendProjectChatMessage({ sessionHash, projectId, chatId, text, entities, replyToMessageId }) {
  const outgoing = outgoingTelegramMessagePayload(text, entities);
  const replyTo = positiveInteger(replyToMessageId, 0) || undefined;
  const { context, dialog, telegram } = await projectTelegramContext({ sessionHash, projectId, chatId });
  try {
    const self = await telegram.getMe();
    const sent = await telegram.sendMessage(dialog.inputEntity, {
      message: outgoing.message,
      replyTo,
      formattingEntities: telegramFormattingEntities(outgoing.entities),
      clearDraft: true,
    });
    const normalized = await normalizeTelegramMessage(context.chat, sent);
    normalized.row.senderTelegramId ||= bigIntegerString(self?.id) || undefined;
    normalized.row.senderName = entityName(self, normalized.row.senderName);
    const syncedAt = Date.now();
    const [persisted] = await convexClient().mutation(api.telegram.upsertMessages, {
      sessionHash,
      projectId,
      chatId,
      messages: [normalized.row],
      lastMessageId: normalized.row.telegramMessageId,
      syncedAt,
    });
    return {
      _id: persisted.messageId,
      chatId,
      ...normalized.row,
      attachments: [],
    };
  } finally {
    await telegram.disconnect().catch(() => {});
  }
}
