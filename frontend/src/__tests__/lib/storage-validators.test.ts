/**
 * Storage Validators Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createStorageValidator,
  storage,
  validators,
} from '@/lib/storage-validators'
import type { User } from '@/types'

describe('createStorageValidator', () => {
  it('should create validator with correct key', () => {
    const userValidator = (data: unknown): User | null => {
      if (!data || typeof data !== 'object') return null
      const user = data as Record<string, unknown>
      
      if (typeof user.id !== 'number') return null
      if (typeof user.username !== 'string') return null
      if (typeof user.email !== 'string') return null
      if (typeof user.role !== 'string') return null
      
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role as 'admin' | 'user',
      }
    }

    const validator = createStorageValidator('test_user', userValidator)
    expect(validator).toBeDefined()
    expect(validator.key).toBe('test_user')
    expect(typeof validator.validate).toBe('function')
  })

  it('should validate data correctly', () => {
    const userValidator = (data: unknown): User | null => {
      if (!data || typeof data !== 'object') return null
      const user = data as Record<string, unknown>
      
      if (typeof user.id !== 'number') return null
      if (typeof user.username !== 'string') return null
      if (typeof user.email !== 'string') return null
      if (typeof user.role !== 'string') return null
      
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role as 'admin' | 'user',
      }
    }

    const validator = createStorageValidator('test_user', userValidator)
    
    const validUser = {
      id: 1,
      username: 'testuser',
      email: 'user@example.com',
      role: 'user',
    }

    const result = validator.validate(validUser)
    expect(result).toEqual(validUser)
  })

  it('should return null on invalid data', () => {
    const userValidator = (data: unknown): User | null => {
      if (!data || typeof data !== 'object') return null
      return null // Always invalid
    }

    const validator = createStorageValidator('test_user', userValidator)
    
    const invalidUser = {
      id: '123',
      email: 'bad',
    }

    const result = validator.validate(invalidUser)
    expect(result).toBeNull()
  })

  it('should serialize and deserialize correctly', () => {
    const userValidator = (data: unknown): User | null => {
      if (!data || typeof data !== 'object') return null
      const user = data as Record<string, unknown>
      
      if (typeof user.id !== 'number') return null
      if (typeof user.username !== 'string') return null
      if (typeof user.email !== 'string') return null
      if (typeof user.role !== 'string') return null
      
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role as 'admin' | 'user',
      }
    }

    const validator = createStorageValidator('test_user', userValidator)
    
    const user = {
      id: 1,
      username: 'testuser',
      email: 'user@example.com',
      role: 'user' as const,
    }

    const serialized = validator.serialize(user)
    const deserialized = validator.deserialize(serialized)
    
    expect(deserialized).toEqual(user)
  })
})

describe('storage.getItem', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should get item from localStorage with validation', () => {
    const user = {
      id: 1,
      username: 'testuser',
      email: 'user@example.com',
      role: 'user' as const,
    }

    localStorage.setItem('user', JSON.stringify(user))

    const validator = (data: unknown): User | null => {
      if (!data || typeof data !== 'object') return null
      return data as User
    }

    const result = storage.getItem('user', validator)
    expect(result).toEqual(user)
  })

  it('should return null if key does not exist', () => {
    const validator = (data: unknown) => data as User | null

    const result = storage.getItem('nonexistent', validator)
    expect(result).toBeNull()
  })

  it('should return null if value is invalid JSON', () => {
    localStorage.setItem('user', 'invalid json')

    const validator = (data: unknown) => data as User | null

    const result = storage.getItem('user', validator)
    expect(result).toBeNull()
  })
})

describe('storage.setItem', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should set item in localStorage', () => {
    const user = {
      id: 1,
      username: 'testuser',
      email: 'user@example.com',
      role: 'user' as const,
    }

    const success = storage.setItem('user', user)
    expect(success).toBe(true)
    expect(localStorage.getItem('user')).toBe(JSON.stringify(user))
  })

  it('should return true on successful set', () => {
    const result = storage.setItem('key', { data: 'value' })
    expect(result).toBe(true)
  })
})

describe('storage.removeItem', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should remove item from localStorage', () => {
    localStorage.setItem('user', JSON.stringify({ id: 1 }))
    
    storage.removeItem('user')
    
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('should not throw on non-existent item', () => {
    expect(() => storage.removeItem('nonexistent')).not.toThrow()
  })
})

describe('storage.clear', () => {
  it('should clear all localStorage', () => {
    localStorage.setItem('key1', 'value1')
    localStorage.setItem('key2', 'value2')
    
    storage.clear()
    
    expect(localStorage.length).toBe(0)
  })
})

describe('validators.user', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should be pre-configured for user validation', () => {
    expect(validators.user).toBeDefined()
    expect(validators.user.key).toBe('scarf_user')
  })

  it('should validate user data', () => {
    const validUser = {
      id: 1,
      username: 'testuser',
      email: 'user@example.com',
      role: 'user',
    }

    const result = validators.user.validate(validUser)
    expect(result).toBeDefined()
  })
})
