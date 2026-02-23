/**
 * Utilities for dynamic component imports and code-splitting
 * 
 * Provides helpers for implementing code-splitting strategies
 * to reduce initial bundle size and improve loading performance
 */

'use client'

import dynamic from 'next/dynamic'
import type { ComponentType, ReactNode } from 'react'

/**
 * Default loading component for lazy-loaded modules
 */
export function LoadingFallback({ message = 'Carregando...' }: { message?: string }): ReactNode {
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  )
}

/**
 * Error fallback component for failed imports
 */
export function ErrorFallback({ error }: { error?: Error }): ReactNode {
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-64 bg-red-50 rounded-lg">
      <div className="text-4xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold text-red-800 mb-2">Erro ao carregar componente</h3>
      <p className="text-red-700 text-sm">{error?.message || 'Tente recarregar a página'}</p>
    </div>
  )
}

/**
 * Options for dynamic component loading
 */
export interface DynamicImportOptions {
  /** Custom loading component (defaults to LoadingFallback) */
  loadingComponent?: ComponentType
  /** Custom error component (defaults to ErrorFallback) */
  errorComponent?: ComponentType<{ error?: Error }>
  /** Whether to load component on ssr (server-side rendering) */
  ssr?: boolean
  /** Only apply loading component when using ssr: false */
  suspense?: boolean
}

/**
 * Create a dynamically imported component with loading and error states
 * 
 * @param importFn - Dynamic import function: () => import('path/to/Component')
 * @param options - Configuration options for loading/error states
 * @returns Dynamically loaded component
 * 
 * @example
 * // Basic usage
 * const AdminPanel = createDynamicComponent(
 *   () => import('@/components/AdminPanel')
 * )
 * 
 * @example
 * // With custom loading message
 * const Dashboard = createDynamicComponent(
 *   () => import('@/components/Dashboard'),
 *   {
 *     loadingComponent: () => <div>Carregando dashboard...</div>
 *   }
 * )
 * 
 * @example
 * // Disable SSR for browser-only components
 * const ClientOnlyComponent = createDynamicComponent(
 *   () => import('@/components/ClientOnly'),
 *   { ssr: false }
 * )
 */
export function createDynamicComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: DynamicImportOptions = {}
): ComponentType<React.ComponentProps<T>> {
  const {
    loadingComponent = LoadingFallback,
    ssr = true,
  } = options

  return dynamic(importFn, {
    loading: loadingComponent as any,
    ssr,
  }) as ComponentType<React.ComponentProps<T>>
}

/**
 * Preload a dynamic component to improve perceived performance
 * 
 * Starts loading the component module before it's needed
 * Useful when you know a component will be needed soon
 * 
 * @param importFn - Dynamic import function
 * 
 * @example
 * // In a parent component, preload on hover or focus
 * onMouseEnter={() => preloadComponent(() => import('@/components/HeavyModal'))}
 */
export function preloadComponent(importFn: () => Promise<any>): void {
  importFn().catch((error) => {
    console.error('Failed to preload component:', error)
  })
}

/**
 * Prefetch component on user interaction
 * Useful for components likely to be needed soon
 * 
 * @param importFn - Dynamic import function
 * @param trigger - Event that triggers preload ('hover' | 'focus' | 'visible')
 * 
 * @example
 * // Preload admin panel when user hovers over settings button
 * <button
 *   onMouseEnter={() => prefetchComponent(() => import('@/components/AdminPanel'))}
 * >
 *   Settings
 * </button>
 */
export function prefetchComponent(
  importFn: () => Promise<any>,
  trigger: 'hover' | 'focus' | 'visible' = 'visible'
): void {
  if (typeof window === 'undefined') return

  if (trigger === 'visible') {
    // Use Intersection Observer for visibility-based preloading
    if ('IntersectionObserver' in window) {
      // Create a dummy element to track visibility
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            preloadComponent(importFn)
            observer.disconnect()
          }
        },
        { rootMargin: '50px' } // Start loading 50px before element is visible
      )
    }
  }
}

/**
 * Batch preload multiple components
 * Useful for loading a set of related components together
 * 
 * @param importFns - Array of import functions
 * 
 * @example
 * // Preload all admin components
 * batchPreloadComponents([
 *   () => import('@/components/AdminPanel'),
 *   () => import('@/components/Analytics'),
 *   () => import('@/components/Settings')
 * ])
 */
export function batchPreloadComponents(importFns: Array<() => Promise<any>>): void {
  importFns.forEach((importFn) => {
    preloadComponent(importFn)
  })
}

/**
 * Route-based code splitting - preload components needed for a route
 * 
 * @param routePath - Next.js route path
 * @param componentImportMap - Map of routes to their component imports
 * 
 * @example
 * // Define route-component mapping
 * const routeComponents = {
 *   '/admin': () => import('@/components/AdminPanel'),
 *   '/profile': () => import('@/components/UserProfile'),
 *   '/settings': () => import('@/components/Settings')
 * }
 * 
 * // Preload when routing to admin page
 * preloadRouteComponents('/admin', routeComponents)
 */
export function preloadRouteComponents(
  routePath: string,
  componentImportMap: Record<string, () => Promise<any>>
): void {
  const importFn = componentImportMap[routePath]
  if (importFn) {
    preloadComponent(importFn)
  }
}

/**
 * Statistics for monitoring dynamic import performance
 */
export interface DynamicImportStats {
  componentName: string
  importTime: number // milliseconds
  size?: number // bytes
  cached: boolean
  timestamp: number
}

/**
 * Track performance metrics for dynamic imports
 * Useful for monitoring and optimizing code-splitting strategy
 */
class DynamicImportMonitor {
  private stats: Map<string, DynamicImportStats> = new Map()
  private maxStats = 50 // Keep only recent stats

  recordImport(
    name: string,
    duration: number,
    cached: boolean = false,
    size?: number
  ): void {
    const stat: DynamicImportStats = {
      componentName: name,
      importTime: duration,
      size,
      cached,
      timestamp: Date.now(),
    }

    this.stats.set(name, stat)

    // Keep only recent stats
    if (this.stats.size > this.maxStats) {
      const firstKey = this.stats.keys().next().value
      if (firstKey) {
        this.stats.delete(firstKey)
      }
    }

    console.debug(`[Dynamic Import] ${name}: ${duration}ms ${cached ? '(cached)' : ''}`)
  }

  getStats(name: string): DynamicImportStats | undefined {
    return this.stats.get(name)
  }

  getAllStats(): DynamicImportStats[] {
    return Array.from(this.stats.values())
  }

  getAverageImportTime(): number {
    const stats = this.getAllStats()
    if (stats.length === 0) return 0
    const total = stats.reduce((sum, stat) => sum + stat.importTime, 0)
    return total / stats.length
  }

  getTotalSize(): number {
    const stats = this.getAllStats()
    return stats.reduce((sum, stat) => sum + (stat.size || 0), 0)
  }

  clear(): void {
    this.stats.clear()
  }
}

export const dynamicImportMonitor = new DynamicImportMonitor()

/**
 * Advanced dynamic import with performance monitoring
 * 
 * @param name - Component identifier for tracking
 * @param importFn - Dynamic import function
 * @param options - Dynamic import options
 * @returns Component with built-in performance tracking
 * 
 * @example
 * const Dashboard = createMonitoredDynamicComponent(
 *   'AdminDashboard',
 *   () => import('@/components/AdminDashboard')
 * )
 */
export function createMonitoredDynamicComponent<T extends ComponentType<any>>(
  name: string,
  importFn: () => Promise<{ default: T }>,
  options: DynamicImportOptions = {}
): ComponentType<React.ComponentProps<T>> {
  const monitoredImportFn = async () => {
    const startTime = performance.now()
    try {
      const module = await importFn()
      const duration = performance.now() - startTime
      dynamicImportMonitor.recordImport(name, duration, false)
      return module
    } catch (error) {
      dynamicImportMonitor.recordImport(name, performance.now() - startTime, false)
      throw error
    }
  }

  return createDynamicComponent(monitoredImportFn, options)
}
