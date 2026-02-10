/**
 * Shared Types
 * 
 * Types used across the frontend application
 */

export interface Product {
  id: number
  sku: string
  name: string
  short_description?: string
  long_description?: string
  price: number
  discount_percentage: number
  discount_price?: number
  stock: number
  reserved_stock?: number
  color?: string
  size?: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  material?: string
  care_instructions?: string
  images?: string[]
  is_featured?: boolean
  is_new?: boolean
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface ProductsResponse {
  products: Product[]
  total: number
  skip: number
  limit: number
}

export interface User {
  id: number
  username: string
  role: 'admin' | 'user'
  email?: string
  full_name?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  user: User
  csrf_token: string
}

export interface PaginationParams {
  skip?: number
  limit?: number
}

export interface APIResponse<T = unknown> {
  data?: T
  error?: string
  status: number
  message?: string
}

export interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export interface MutationState {
  loading: boolean
  error: string | null
  success: boolean
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
