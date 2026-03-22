import * as admin from 'firebase-admin';
import { loadFirebaseServiceAccountJson } from '../../config/firebase-service-account.util';

/** Tránh trùng init khi seed chạy trong cùng process với app Nest (đã có Firebase app). */
export function tryInitFirebaseAdminForSeed(): boolean {
  if (admin.apps.length > 0) {
    return true;
  }
  const json = loadFirebaseServiceAccountJson();
  if (!json) {
    return false;
  }
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(json) as admin.ServiceAccount),
    });
    return true;
  } catch (e) {
    console.warn(
      `[seed] Firebase Admin init failed: ${e instanceof Error ? e.message : e}`,
    );
    return false;
  }
}

/** SĐT nội địa (vd. 090…) → E.164 cho Firebase */
export function toE164VN(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('84')) {
    return `+${digits}`;
  }
  if (digits.startsWith('0')) {
    return `+84${digits.slice(1)}`;
  }
  return `+84${digits}`;
}

/**
 * Tạo user Firebase Auth theo SĐT (Admin SDK) hoặc lấy uid thật nếu SĐT đã đăng ký.
 * Trả null nếu không cấu hình Firebase Admin (thiếu JSON / init lỗi).
 */
export async function createOrGetFirebaseUidByPhone(
  phoneLocal: string,
  displayName: string,
): Promise<string | null> {
  if (!tryInitFirebaseAdminForSeed()) {
    return null;
  }
  const phoneE164 = toE164VN(phoneLocal);
  try {
    const user = await admin.auth().createUser({
      phoneNumber: phoneE164,
      displayName,
    });
    console.log(
      `[seed] Firebase Auth: created ${phoneE164} → uid=${user.uid}`,
    );
    return user.uid;
  } catch (e: unknown) {
    const code =
      e && typeof e === 'object' && 'code' in e
        ? String((e as { code?: string }).code)
        : '';
    const errorInfo =
      e && typeof e === 'object' && 'errorInfo' in e
        ? (e as { errorInfo?: { code?: string } }).errorInfo
        : undefined;
    const errCode = errorInfo?.code ?? code;
    if (errCode === 'auth/phone-number-already-exists') {
      const existing = await admin.auth().getUserByPhoneNumber(phoneE164);
      console.log(
        `[seed] Firebase Auth: phone exists → uid=${existing.uid} (${phoneE164})`,
      );
      return existing.uid;
    }
    console.warn(`[seed] Firebase Auth createUser failed: ${String(e)}`);
    throw e;
  }
}
