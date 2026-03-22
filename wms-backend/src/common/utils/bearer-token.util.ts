/**
 * Lấy chuỗi JWT từ `Authorization`.
 * Hỗ trợ bỏ lặp `Bearer ` (hay gặp khi dán cả "Bearer eyJ..." vào ô token của Swagger).
 */
export function extractBearerTokenFromAuthorizationHeader(
  authHeader: string | undefined,
): string | null {
  if (typeof authHeader !== 'string') {
    return null;
  }
  let token = authHeader.trim();
  if (!token) {
    return null;
  }
  while (token.toLowerCase().startsWith('bearer ')) {
    token = token.slice(7).trim();
  }
  return token || null;
}

/** Firebase ID token là JWT chuẩn (3 phần base64url). Refresh token không phải JWT. */
export function isLikelyJwtIdToken(token: string): boolean {
  const parts = token.split('.');
  return (
    parts.length === 3 &&
    parts[0].length > 0 &&
    parts[1].length > 0 &&
    parts[2].length > 0
  );
}
