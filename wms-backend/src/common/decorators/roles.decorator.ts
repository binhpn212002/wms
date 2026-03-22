import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** Yêu cầu user có ít nhất một role (theo `code`). */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
