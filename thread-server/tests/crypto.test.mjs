import test from "node:test";
import assert from "node:assert/strict";
import { decryptJson, decryptSecret, encryptJson, encryptSecret } from "../lib/crypto.mjs";

const originalKey = process.env.SESSION_ENCRYPTION_KEY;

test.before(() => {
  process.env.SESSION_ENCRYPTION_KEY = "test-only-session-key-that-is-longer-than-thirty-two-bytes";
});

test.after(() => {
  if (originalKey === undefined) delete process.env.SESSION_ENCRYPTION_KEY;
  else process.env.SESSION_ENCRYPTION_KEY = originalKey;
});

test("encrypted Telegram session secrets round trip with contextual authentication", () => {
  const encrypted = encryptSecret("telegram-session-value", "connection:abc");
  assert.notEqual(encrypted, "telegram-session-value");
  assert.equal(decryptSecret(encrypted, "connection:abc"), "telegram-session-value");
  assert.throws(() => decryptSecret(encrypted, "connection:different"));
});

test("encrypted Telegram authorization challenges preserve structured data", () => {
  const payload = { phoneCodeHash: "hash", step: "code", retry: 2 };
  const encrypted = encryptJson(payload, "challenge:abc");
  assert.deepEqual(decryptJson(encrypted, "challenge:abc"), payload);
});
