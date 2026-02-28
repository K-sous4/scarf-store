export interface User {
  id: number
  username: string
  role: "user" | "admin"
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface LoginRequest {
  username: string
  password: string
}

export interface SignUpRequest {
  username: string
  password: string
  email?: string
}

export interface AuthResponse {
  user: User
}
