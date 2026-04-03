import type { PageQuery } from './pagination'

export type UserStatus = 'active' | 'inactive'

export type UsersSortField = 'username' | 'phone' | 'created_at'

export interface User {
  id: string
  username: string
  phone: string
  email: string | null
  fullName: string | null
  avatarUrl: string | null
  dob: string | null
  status: UserStatus
  roles: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateUserRequest {
  username: string
  phone: string
  email?: string
  fullName?: string
}

export interface UpdateProfileRequest {
  email?: string | null
  fullName?: string | null
  avatarUrl?: string | null
  dob?: string | null
}

export interface UpdateUserRequest {
  email?: string | null
  fullName?: string | null
  status?: UserStatus
  firebaseId?: string | null
}

export interface AssignUserRolesRequest {
  roleIds: string[]
}

export interface ListUsersQuery extends PageQuery {
  sortBy?: UsersSortField
  status?: UserStatus
  roleId?: string
}
