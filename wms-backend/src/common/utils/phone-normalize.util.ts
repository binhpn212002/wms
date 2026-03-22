/** SĐT nội địa VN (vd. 090…) hoặc đã có +84… → E.164 cho Firebase Admin. */
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

/** So khớp số VN / E.164 (Firebase) với số lưu trong DB — chỉ dùng cho liên kết Firebase. */
export function normalizePhoneDigitsForCompare(s: string): string {
  const d = s.replace(/\D/g, '');
  if (d.length >= 9) {
    return d.slice(-9);
  }
  return d;
}
