import assert from "node:assert/strict";
import test from "node:test";
import { outgoingTelegramMessagePayload, outgoingTelegramMessageText } from "../lib/telegram-sync.mjs";

test("outgoing Telegram messages are trimmed without changing their content", () => {
  assert.equal(outgoingTelegramMessageText("  Ship it today  "), "Ship it today");
});

test("outgoing Telegram messages reject empty and oversized text", () => {
  assert.throws(() => outgoingTelegramMessageText("   "), /write a message/i);
  assert.throws(() => outgoingTelegramMessageText("a".repeat(4_097)), /4,096/);
});

test("outgoing Telegram message length counts Unicode characters", () => {
  assert.equal(outgoingTelegramMessageText("🚀".repeat(4_096)), "🚀".repeat(4_096));
});

test("outgoing Telegram formatting entities stay aligned after trimming", () => {
  assert.deepEqual(outgoingTelegramMessagePayload("  Ship bold now  ", [
    { type: "bold", offset: 7, length: 4 },
    { type: "unsupported", offset: 2, length: 4 },
  ]), {
    message: "Ship bold now",
    entities: [{ type: "bold", offset: 5, length: 4 }],
  });
});
