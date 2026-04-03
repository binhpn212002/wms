import type { CreateUserRequest, LoginRequest, LoginResponse, User } from '../types'
import { postJson } from './request'

export const authService = {
  login(body: LoginRequest) {
    return postJson<LoginResponse, LoginRequest>('/auth/login', body)
  },

  register(body: CreateUserRequest) {
    return postJson<User, CreateUserRequest>('/auth/register', body)
  },
}
