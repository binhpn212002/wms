/** So khớp số VN / E.164 (Firebase) với số lưu trong DB — chỉ dùng cho liên kết Firebase. */
export function normalizePhoneDigitsForCompare(s: string): string {
  const d = s.replace(/\D/g, '');
  if (d.length >= 9) {
    return d.slice(-9);
  }
  return d;
}
