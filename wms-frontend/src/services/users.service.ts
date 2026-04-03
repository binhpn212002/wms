import type {
  AssignUserRolesRequest,
  CreateUserRequest,
  ListResponse,
  ListUsersQuery,
  UpdateProfileRequest,
  UpdateUserRequest,
  User,
} from '../types'
import { deleteJson, getJson, patchJson, postJson, putJson } from './request'

export const usersService = {
  me() {
    return getJson<User>('/users/me')
  },

  updateMe(body: UpdateProfileRequest) {
    return patchJson<User, UpdateProfileRequest>('/users/me', body)
  },

  create(body: CreateUserRequest) {
    return postJson<User, CreateUserRequest>('/users', body)
  },

  list(params?: ListUsersQuery) {
    return getJson<ListResponse<User>>('/users', { params })
  },

  findOne(id: string) {
    return getJson<User>(`/users/${id}`)
  },

  update(id: string, body: UpdateUserRequest) {
    return patchJson<User, UpdateUserRequest>(`/users/${id}`, body)
  },

  assignRoles(id: string, body: AssignUserRolesRequest) {
    return putJson<User, AssignUserRolesRequest>(`/users/${id}/roles`, body)
  },

  remove(id: string) {
    return deleteJson(`/users/${id}`)
  },
}
