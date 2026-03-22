import { existsSync, readFileSync } from 'fs';
import { isAbsolute, join } from 'path';

/**
 * JSON service account cho Firebase Admin (đọc từ `process.env`, thường qua `.env` / ConfigModule).
 * Thứ tự: `FIREBASE_SERVICE_ACCOUNT_JSON_FILE` → `FIREBASE_SERVICE_ACCOUNT_JSON_B64` → `FIREBASE_SERVICE_ACCOUNT_JSON`.
 */
export function loadFirebaseServiceAccountJson(): string | undefined {
  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_FILE?.trim();
  if (filePath) {
    const resolved = isAbsolute(filePath)
      ? filePath
      : join(process.cwd(), filePath);
    const pathToRead = existsSync(filePath)
      ? filePath
      : existsSync(resolved)
        ? resolved
        : null;
    if (!pathToRead) {
      return undefined;
    }
    try {
      return readFileSync(pathToRead, 'utf8').trim();
    } catch {
      return undefined;
    }
  }
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_B64?.trim();
  if (b64) {
    try {
      return Buffer.from(b64, 'base64').toString('utf8').trim();
    } catch {
      return undefined;
    }
  }
  return process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
}
