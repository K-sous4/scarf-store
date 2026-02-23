/**
 * Storage Validators
 * 
 * Schema validation for localStorage data using simple type checking.
 * Prevents data corruption and provides type-safe storage operations.
 */

import type { User } from '@/types'

export interface StorageValidator<T> {
  key: string
  validate: (data: unknown) => T | null
  serialize: (data: T) => string
  deserialize: (data: string) => T | null
}

/**
 * User Validator Schema
 * Validates user data before storing/retrieving from localStorage
 */
const userSchema = {
  validate: (data: unknown): User | null => {
    if (!data || typeof data !== 'object') return null
    
    const user = data as Record<string, unknown>
    
    // Validate required fields
    if (typeof user.id !== 'number') return null
    if (typeof user.username !== 'string') return null
    if (typeof user.email !== 'string') return null
    if (typeof user.role !== 'string') return null
    
    // Validate role is one of allowed values
    const validRoles = ['admin', 'user']
    if (!validRoles.includes(user.role)) return null
    
    // Return validated user
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role as 'admin' | 'user',
      // Optional fields
      full_name: typeof user.full_name === 'string' ? user.full_name : undefined,
      is_active: typeof user.is_active === 'boolean' ? user.is_active : undefined,
      created_at: typeof user.created_at === 'string' ? user.created_at : undefined,
    }
  },

  serialize: (user: User): string => {
    return JSON.stringify(user)
  },

  deserialize: (data: string): User | null => {
    try {
      const parsed = JSON.parse(data)
      return userSchema.validate(parsed)
    } catch (err) {
      console.error('Failed to deserialize user data:', err)
      return null
    }
  },
}

/**
 * Create a storage validator with custom schema
 */
export function createStorageValidator<T>(
  key: string,
  validator: (data: unknown) => T | null
): StorageValidator<T> {
  return {
    key,
    validate: validator,
    serialize: (data: T) => JSON.stringify(data),
    deserialize: (data: string) => {
      try {
        const parsed = JSON.parse(data)
        return validator(parsed)
      } catch (err) {
        console.error(`Failed to deserialize ${key}:`, err)
        return null
      }
    },
  }
}

/**
 * Safe localStorage operations
 */
export const storage = {
  /**
   * Get value from localStorage with validation
   */
  getItem<T>(key: string, validator: (data: unknown) => T | null): T | null {
    if (typeof window === 'undefined') return null

    try {
      const item = localStorage.getItem(key)
      if (!item) return null
      
      return validator(JSON.parse(item))
    } catch (err) {
      console.error(`Error retrieving ${key} from storage:`, err)
      return null
    }
  },

  /**
   * Set value in localStorage
   */
  setItem<T>(key: string, value: T): boolean {
    if (typeof window === 'undefined') return false

    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (err) {
      console.error(`Error storing ${key}:`, err)
      return false
    }
  },

  /**
   * Remove item from localStorage
   */
  removeItem(key: string): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(key)
    } catch (err) {
      console.error(`Error removing ${key}:`, err)
    }
  },

  /**
   * Clear all localStorage
   */
  clear(): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.clear()
    } catch (err) {
      console.error('Error clearing storage:', err)
    }
  },
}

/**
 * Pre-configured validators for application data
 */
export const validators = {
  user: createStorageValidator('scarf_user', userSchema.validate),
}
