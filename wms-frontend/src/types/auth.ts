export interface LoginRequest {
  username: string
  password: string
}

/** Khớp `AuthService.login` hiện tại (Firebase idToken + refresh). */
export interface LoginResponse {
  accessToken: string
  refreshToken: string
}
