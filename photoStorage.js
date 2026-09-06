import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const UPLOADS_DIR = process.env.UPLOADS_DIR || "./uploads";
const UPLOADS_URL_PREFIX = process.env.UPLOADS_URL_PREFIX || "/uploads";

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const EXT_BY_MIME = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * Accepts a data URL (e.g. "data:image/png;base64,...."), validates it is an
 * image under maxBytes, writes it to disk, and returns the public URL path.
 * Returns null if photoDataUrl is falsy. Throws on invalid/oversized input.
 */
export function savePhotoFromDataUrl(photoDataUrl, { maxBytes = 8 * 1024 * 1024 } = {}) {
  if (!photoDataUrl) return null;

  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(photoDataUrl);
  if (!match) throw new Error("Photo must be a base64-encoded image data URL.");

  const [, mime, base64] = match;
  const ext = EXT_BY_MIME[mime.toLowerCase()];
  if (!ext) throw new Error(`Unsupported image type: ${mime}`);

  const buffer = Buffer.from(base64, "base64");
  if (buffer.byteLength > maxBytes) {
    throw new Error(`Image is too large (max ${Math.round(maxBytes / (1024 * 1024))}MB).`);
  }

  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  return `${UPLOADS_URL_PREFIX}/${filename}`;
}

export { UPLOADS_DIR };
