/**
 * SWR Configuration
 * 
 * Global configuration for SWR data fetching with caching strategy
 */

import { SWRConfiguration } from 'swr'

/**
 * Default cache duration (in milliseconds)
 */
export const CACHE_DURATIONS = {
  SHORT: 1000 * 60,        // 1 minute
  MEDIUM: 1000 * 60 * 5,   // 5 minutes
  LONG: 1000 * 60 * 60,    // 1 hour
  VERY_LONG: 1000 * 60 * 60 * 24, // 24 hours
}

/**
 * SWR configuration presets for different data types
 */
export const swrConfig = {
  /**
   * Config for products (moderate cache - 5 min)
   * Products don't change frequently but should be fresh enough
   */
  products: {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: CACHE_DURATIONS.MEDIUM,
    focusThrottleInterval: CACHE_DURATIONS.MEDIUM,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
  } as SWRConfiguration,

  /**
   * Config for user data (long cache - 1 hour)
   * User data is relatively stable, revalidate after long interval
   */
  user: {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: CACHE_DURATIONS.LONG,
    focusThrottleInterval: CACHE_DURATIONS.LONG,
    errorRetryCount: 2,
    errorRetryInterval: 3000,
  } as SWRConfiguration,

  /**
   * Config for frequently changing data (short cache - 1 min)
   * Stock, availability, etc
   */
  dynamic: {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: CACHE_DURATIONS.SHORT,
    focusThrottleInterval: CACHE_DURATIONS.SHORT,
    errorRetryCount: 2,
    errorRetryInterval: 2000,
  } as SWRConfiguration,

  /**
   * Config for one-time fetches (no cache revalidation)
   * Search results, specific queries
   */
  oneTime: {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    errorRetryCount: 1,
    errorRetryInterval: 2000,
  } as SWRConfiguration,
}

/**
 * Global SWR config with common settings
 */
export const globalSWRConfig: SWRConfiguration = {
  // Don't revalidate immediately on mount if data exists
  revalidateOnMount: false,
  
  // Revalidate on window focus with throttling
  revalidateOnFocus: false,
  
  // Revalidate when network is reconnected
  revalidateOnReconnect: true,
  
  // Deduplicate requests
  dedupingInterval: CACHE_DURATIONS.MEDIUM,
  
  // Throttle revalidation on focus
  focusThrottleInterval: CACHE_DURATIONS.SHORT,
  
  // Compare cached data to detect changes
  compare: (a, b) => {
    try {
      return JSON.stringify(a) === JSON.stringify(b)
    } catch {
      return a === b
    }
  },
}
