/**
 * Gắn vào `request.user` sau JwtAuthGuard (Firebase ID token) / login response.
 */
export interface AuthUser {
  userId: string;
  username: string;
  roles: string[];
  permissions: string[];
}
