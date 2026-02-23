/**
 * Test Setup Configuration
 * 
 * Runs before each test file
 * Configures test environment and utilities
 */

import { afterEach, vi, beforeAll, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

/**
 * Cleanup DOM after each test
 */
afterEach(() => {
  cleanup()
  // Clear storage mocks after each test
  localStorage.clear()
  sessionStorage.clear()
})

/**
 * Functional localStorage implementation
 */
class StorageMock implements Storage {
  private store: Record<string, string> = {}

  getItem(key: string): string | null {
    return this.store[key] ?? null
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value)
  }

  removeItem(key: string): void {
    delete this.store[key]
  }

  clear(): void {
    this.store = {}
  }

  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null
  }

  get length(): number {
    return Object.keys(this.store).length
  }
}

const localStorageMock = new StorageMock()
const sessionStorageMock = new StorageMock()

// Set up storage mocks on window
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
})

/**
 * Mock IntersectionObserver
 */
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
} as any

/**
 * Mock ResizeObserver
 */
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any

/**
 * Suppress console errors in tests (optional)
 */
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
