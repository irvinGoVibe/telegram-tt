import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function encryptionKey() {
  const value = String(process.env.SESSION_ENCRYPTION_KEY || "").trim();
  if (!value) {
    const error = new Error("SESSION_ENCRYPTION_KEY is not configured.");
    error.statusCode = 503;
    throw error;
  }

  if (/^[a-f0-9]{64}$/i.test(value)) return Buffer.from(value, "hex");

  try {
    const decoded = Buffer.from(value, "base64");
    if (decoded.length === 32) return decoded;
  } catch {
    // Fall through to a deterministic digest for legacy text secrets.
  }

  if (Buffer.byteLength(value, "utf8") < 32) {
    const error = new Error("SESSION_ENCRYPTION_KEY must contain at least 32 bytes.");
    error.statusCode = 503;
    throw error;
  }
  return createHash("sha256").update(value, "utf8").digest();
}

export function encryptSecret(value, context = "thread") {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(context, "utf8"));
  const encrypted = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptSecret(payload, context = "thread") {
  const [version, ivValue, tagValue, encryptedValue] = String(payload || "").split(".");
  if (version !== "v1" || !ivValue || !tagValue || !encryptedValue) throw new Error("Encrypted secret has an invalid format.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAAD(Buffer.from(context, "utf8"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function encryptJson(value, context) {
  return encryptSecret(JSON.stringify(value), context);
}

export function decryptJson(value, context) {
  return JSON.parse(decryptSecret(value, context));
}
