/**
 * PrefetchLink Component
 * 
 * Enhanced Next.js Link with intelligent prefetch strategies
 * Reduces latency for navigation by preloading route data
 */

'use client'

import React, { useRef, useCallback } from 'react'
import Link, { LinkProps } from 'next/link'
import { useRouter } from 'next/navigation'

/**
 * Prefetch strategy options
 */
export type PrefetchStrategy = 'hover' | 'focus' | 'immediate' | 'visible' | 'none' | 'manual'

/**
 * Enhanced Link props
 */
export interface PrefetchLinkProps extends LinkProps {
  children: React.ReactNode
  className?: string
  prefetchStrategy?: PrefetchStrategy
  prefetchHint?: string // Data to prefetch (e.g., '/api/user')
  onPrefetch?: () => void | Promise<void>
  prefetchDelay?: number // Delay before prefetch in ms (for hover)
  disabled?: boolean
  analytics?: {
    eventName: string
    properties?: Record<string, any>
  }
}

/**
 * Track prefetch performance metrics
 */
interface PrefetchMetrics {
  route: string
  strategy: PrefetchStrategy
  prefetchTime: number
  navigateTime?: number
  cached: boolean
  timestamp: number
}

/**
 * Prefetch metrics monitor
 */
class PrefetchMonitor {
  private metrics: Map<string, PrefetchMetrics> = new Map()
  private maxMetrics = 100

  record(metrics: PrefetchMetrics): void {
    const key = `${metrics.route}-${Date.now()}`
    this.metrics.set(key, metrics)

    if (this.metrics.size > this.maxMetrics) {
      const firstKey = this.metrics.keys().next().value
      if (typeof firstKey === 'string') {
        this.metrics.delete(firstKey)
      }
    }

    console.debug(`[Prefetch] ${metrics.route}: ${metrics.prefetchTime}ms via ${metrics.strategy}`)
  }

  getMetrics(route: string): PrefetchMetrics[] {
    return Array.from(this.metrics.values()).filter((m) => m.route === route)
  }

  getAllMetrics(): PrefetchMetrics[] {
    return Array.from(this.metrics.values())
  }

  getAveragePrefetchTime(): number {
    const metrics = this.getAllMetrics()
    if (metrics.length === 0) return 0
    const total = metrics.reduce((sum, m) => sum + m.prefetchTime, 0)
    return total / metrics.length
  }

  clear(): void {
    this.metrics.clear()
  }
}

export const prefetchMonitor = new PrefetchMonitor()

/**
 * PrefetchLink Component
 * 
 * Drop-in replacement for Next.js Link with intelligent prefetching
 * 
 * @example
 * // Basic usage - defaults to prefetch on hover
 * <PrefetchLink href="/products">Products</PrefetchLink>
 * 
 * @example
 * // Prefetch on navigation attempt
 * <PrefetchLink href="/checkout" prefetchStrategy="focus">
 *   Checkout
 * </PrefetchLink>
 * 
 * @example
 * // Immediate prefetch for critical routes
 * <PrefetchLink href="/admin" prefetchStrategy="immediate">
 *   Admin
 * </PrefetchLink>
 * 
 * @example
 * // Custom callback and analytics
 * <PrefetchLink
 *   href="/products"
 *   onPrefetch={() => loadProductCache()}
 *   analytics={{ eventName: 'product_link_clicked' }}
 * >
 *   Products
 * </PrefetchLink>
 */
export const PrefetchLink = React.forwardRef<
  HTMLAnchorElement,
  PrefetchLinkProps
>(
  (
    {
      href,
      children,
      className,
      prefetchStrategy = 'hover',
      prefetchHint,
      onPrefetch,
      prefetchDelay = 100,
      disabled = false,
      analytics,
      ...linkProps
    },
    ref
  ) => {
    const router = useRouter()
    const linkRef = useRef<HTMLAnchorElement>(null)
    const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const prefetchObserverRef = useRef<IntersectionObserver | null>(null)
    const hasPrefetchedRef = useRef(false)

    // Handle prefetch logic
    const handlePrefetch = useCallback(async () => {
      if (hasPrefetchedRef.current || prefetchStrategy === 'none') return

      try {
        const startTime = performance.now()

        // Custom prefetch function if provided
        if (onPrefetch) {
          await onPrefetch()
        }

        // Prefetch route using router
        if (typeof href === 'string') {
          router.prefetch(href)

          // Track metrics
          const prefetchTime = performance.now() - startTime
          prefetchMonitor.record({
            route: href,
            strategy: prefetchStrategy,
            prefetchTime,
            cached: false,
            timestamp: Date.now(),
          })

          console.debug(`[Prefetch] ${href} prefetched in ${prefetchTime}ms`)
        }

        hasPrefetchedRef.current = true
      } catch (error) {
        console.error('[Prefetch] Error prefetching route:', error)
      }
    }, [href, router, prefetchStrategy, onPrefetch])

    // Setup prefetch strategies
    React.useEffect(() => {
      const link = linkRef.current
      if (!link || disabled || prefetchStrategy === 'none') return

      const cleanup = () => {
        if (prefetchTimeoutRef.current) {
          clearTimeout(prefetchTimeoutRef.current)
        }
        if (prefetchObserverRef.current) {
          prefetchObserverRef.current.disconnect()
        }
      }

      if (prefetchStrategy === 'hover') {
        const handleMouseEnter = () => {
          prefetchTimeoutRef.current = setTimeout(handlePrefetch, prefetchDelay)
        }

        const handleMouseLeave = () => {
          if (prefetchTimeoutRef.current) {
            clearTimeout(prefetchTimeoutRef.current)
          }
        }

        link.addEventListener('mouseenter', handleMouseEnter)
        link.addEventListener('mouseleave', handleMouseLeave)
        link.addEventListener('touchstart', handleMouseEnter)

        return () => {
          link.removeEventListener('mouseenter', handleMouseEnter)
          link.removeEventListener('mouseleave', handleMouseLeave)
          link.removeEventListener('touchstart', handleMouseEnter)
          cleanup()
        }
      }

      if (prefetchStrategy === 'focus') {
        const handleFocus = () => {
          handlePrefetch()
        }

        link.addEventListener('focus', handleFocus)

        return () => {
          link.removeEventListener('focus', handleFocus)
          cleanup()
        }
      }

      if (prefetchStrategy === 'visible') {
        if ('IntersectionObserver' in window) {
          prefetchObserverRef.current = new IntersectionObserver(
            ([entry]) => {
              if (entry.isIntersecting) {
                handlePrefetch()
                prefetchObserverRef.current?.unobserve(link)
              }
            },
            { rootMargin: '50px' }
          )

          prefetchObserverRef.current.observe(link)

          return () => {
            prefetchObserverRef.current?.disconnect()
          }
        }
      }

      if (prefetchStrategy === 'immediate') {
        handlePrefetch()
      }

      return cleanup
    }, [prefetchStrategy, handlePrefetch, prefetchDelay, disabled])

    // Track navigation analytics
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (analytics) {
        // Send analytics event
        if (typeof window !== 'undefined' && (window as any).gtag) {
          ;(window as any).gtag('event', analytics.eventName, {
            page_path: href,
            ...analytics.properties,
          })
        }
      }
    }

    return (
      <Link
        ref={(node) => {
          linkRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        href={href}
        className={className}
        onClick={handleClick}
        {...(linkProps as any)}
      >
        <span className={disabled ? 'opacity-50 cursor-not-allowed' : ''}>
          {children}
        </span>
      </Link>
    )
  }
)

PrefetchLink.displayName = 'PrefetchLink'

/**
 * Hook to get prefetch metrics
 */
export function usePrefetchMetrics() {
  const [metrics, setMetrics] = React.useState<PrefetchMetrics[]>([])

  const refreshMetrics = React.useCallback(() => {
    setMetrics(prefetchMonitor.getAllMetrics())
  }, [])

  React.useEffect(() => {
    const interval = setInterval(refreshMetrics, 5000) // Update every 5 seconds
    refreshMetrics()

    return () => clearInterval(interval)
  }, [refreshMetrics])

  return {
    metrics,
    averagePrefetchTime: prefetchMonitor.getAveragePrefetchTime(),
    totalMetrics: metrics.length,
    clear: () => {
      prefetchMonitor.clear()
      setMetrics([])
    },
  }
}

/**
 * Hook to prefetch a route manually
 */
export function usePrefetch() {
  const router = useRouter()

  return React.useCallback(
    (href: string) => {
      const startTime = performance.now()
      router.prefetch(href)
      const duration = performance.now() - startTime

      prefetchMonitor.record({
        route: href,
        strategy: 'manual',
        prefetchTime: duration,
        cached: false,
        timestamp: Date.now(),
      })
    },
    [router]
  )
}
