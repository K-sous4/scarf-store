/**
 * Cache Provider
 * 
 * Provides SWR configuration globally to the application
 * Enables cache invalidation and centralized cache management
 */

'use client'

import React, { ReactNode } from 'react'
import { SWRConfig } from 'swr'
import { globalSWRConfig } from './swr-config'

interface CacheProviderProps {
  children: ReactNode
}

/**
 * CacheProvider
 * 
 * Wraps the application with SWR configuration provider
 * Place this at the root of your app to enable caching
 * 
 * @example
 * export default function RootLayout({ children }) {
 *   return (
 *     <CacheProvider>
 *       {children}
 *     </CacheProvider>
 *   )
 * }
 */
export function CacheProvider({ children }: CacheProviderProps) {
  return (
    <SWRConfig value={globalSWRConfig}>
      {children}
    </SWRConfig>
  )
}

/**
 * Cache Manager
 * 
 * Utility functions for cache management
 */
export const cacheManager = {
  /**
   * Get cache from localStorage
   */
  getCache: (key: string): unknown => {
    if (typeof window === 'undefined') return null
    try {
      const cached = localStorage.getItem(`swr:${key}`)
      return cached ? JSON.parse(cached) : null
    } catch (err) {
      console.error('Failed to read cache:', err)
      return null
    }
  },

  /**
   * Set cache in localStorage
   */
  setCache: (key: string, value: unknown): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(`swr:${key}`, JSON.stringify(value))
    } catch (err) {
      console.error('Failed to set cache:', err)
    }
  },

  /**
   * Clear specific cache entry
   */
  clearCache: (key: string): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(`swr:${key}`)
    } catch (err) {
      console.error('Failed to clear cache:', err)
    }
  },

  /**
   * Clear all SWR cache
   */
  clearAllCache: (): void => {
    if (typeof window === 'undefined') return
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('swr:')) {
          localStorage.removeItem(key)
        }
      })
    } catch (err) {
      console.error('Failed to clear all cache:', err)
    }
  },

  /**
   * Get cache statistics
   */
  getCacheStats: (): { total: number; keys: string[] } => {
    if (typeof window === 'undefined') {
      return { total: 0, keys: [] }
    }
    
    const keys = Object.keys(localStorage).filter(key => key.startsWith('swr:'))
    return {
      total: keys.length,
      keys: keys.map(k => k.replace('swr:', '')),
    }
  },
}
