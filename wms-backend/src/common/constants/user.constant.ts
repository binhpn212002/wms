/** User / role / permission — thống nhất với specs/user/detail-design.md */

export const TABLE_USERS = 'users';
export const TABLE_ROLES = 'roles';
export const TABLE_PERMISSIONS = 'permissions';
export const TABLE_USER_ROLES = 'user_roles';
export const TABLE_ROLE_PERMISSIONS = 'role_permissions';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

/** Mã role seed — dùng trong guard / seed */
export enum RoleCode {
  ADMIN = 'admin',
  WAREHOUSE = 'warehouse',
  MANAGER = 'manager',
}

/** Mã permission seed — tham chiếu khi gắn @Permissions() */
export const PermissionCode = {
  USER_CREATE: 'user.create',
  USER_READ: 'user.read',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_ASSIGN_ROLE: 'user.assign_role',
  INBOUND_COMPLETE: 'inbound.complete',
  OUTBOUND_COMPLETE: 'outbound.complete',
} as const;

export type PermissionCodeValue =
  (typeof PermissionCode)[keyof typeof PermissionCode];
