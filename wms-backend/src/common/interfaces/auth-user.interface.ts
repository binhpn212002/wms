/**
 * Gắn vào `request.user` sau JwtStrategy.validate (và login response).
 */
export interface AuthUser {
  userId: string;
  username: string;
  roles: string[];
  permissions: string[];
}
