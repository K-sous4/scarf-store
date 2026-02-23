/**
 * API Configuration and Client
 * 
 * Centralized API client for all backend requests
 * Automatically includes CSRF tokens for mutating requests
 * Integrated with ErrorHandler for centralized error management
 */

import { config } from '@/config'
import { APIResponse as APIResponseType } from '@/types'
import { ErrorHandler } from './error-handler'

const API_BASE_URL = config.api.baseUrl

export interface APIResponse<T> {
  data?: T
  error?: string
  message?: string
  status: number
}

export class APIClient {
  private baseUrl: string
  private timeout: number
  private retries: number

  constructor(
    baseUrl: string = API_BASE_URL,
    timeout: number = config.api.timeout,
    retries: number = config.api.retries
  ) {
    this.baseUrl = baseUrl
    this.timeout = timeout
    this.retries = retries
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    attempt: number = 1
  ): Promise<APIResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      // Set headers
      const method = options.method?.toUpperCase() || 'GET'
      const headers = new Headers(options.headers)
      headers.set('Content-Type', 'application/json')

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: headers,
        credentials: 'include', // Include cookies for session management
      })

      clearTimeout(timeoutId)

      // Debug: Log response status
      console.log(`[API] ${method} ${endpoint} -> ${response.status}`)

      let data: any
      try {
        data = await response.json()
      } catch {
        data = { detail: `HTTP ${response.status}` }
      }

      if (!response.ok) {
        // Extract error message
        const errorMessage = data?.detail || data?.message || `HTTP ${response.status}`
        
        // Log error through centralized handler
        ErrorHandler.handleAPIError(response.status, errorMessage, undefined)
        
        // Don't retry on 4xx errors (client errors)
        if (response.status >= 400 && response.status < 500) {
          return {
            error: errorMessage,
            status: response.status,
          }
        }

        // Retry on 5xx errors (server errors)
        if (attempt < this.retries) {
          return this.request<T>(endpoint, options, attempt + 1)
        }

        return {
          error: errorMessage,
          status: response.status,
        }
      }

      return {
        data: data as T,
        status: response.status,
      }
    } catch (error) {
      // Network/connection error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        ErrorHandler.handleNetworkError(error)
      }

      // Don't retry on abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          error: 'Request timeout',
          status: 0,
        }
      }

      if (attempt < this.retries) {
        return this.request<T>(endpoint, options, attempt + 1)
      }

      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 0,
      }
    }
  }

  async get<T = unknown>(endpoint: string, options?: RequestInit): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    })
  }

  async post<T = unknown>(
    endpoint: string,
    body?: any,
    options?: RequestInit
  ): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async put<T = unknown>(
    endpoint: string,
    body?: any,
    options?: RequestInit
  ): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async delete<T = unknown>(
    endpoint: string,
    options?: RequestInit
  ): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    })
  }
}

// Export singleton instance
export const apiClient = new APIClient()
