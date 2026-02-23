/**
 * Image Optimization Utilities
 * 
 * Helper functions for image optimization and management
 */

/**
 * Get responsive size string based on image type and viewport
 * 
 * @param type - Type of image (hero, product, thumbnail, etc)
 * @returns CSS media query size string for Next.js Image
 */
export function getResponsiveSizes(
  type: 'hero' | 'product' | 'thumbnail' | 'avatar' | 'banner' | 'full'
): string {
  const sizes: Record<string, string> = {
    hero: '100vw',
    product: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    banner: '(max-width: 1024px) 100vw, 1200px',
    thumbnail: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
    avatar: '48px',
    full: '100vw',
  }
  return sizes[type] || sizes.product
}

/**
 * Determine if image should be prioritized
 * 
 * Priority images:
 * - Above the fold
 * - Critical for LCP (Largest Contentful Paint)
 * - Hero images
 * - First N images in grid
 * 
 * @param index - Index in grid/list
 * @param threshold - Number of priority images (default 4 for 2x2 grid)
 * @returns boolean
 */
export function shouldPrioritizeImage(index: number, threshold = 4): boolean {
  return index < threshold
}

/**
 * Calculate quality based on image type and device
 * 
 * Lower quality for thumbnails, higher for hero
 * Could be dynamic based on device type
 */
export function getImageQuality(
  type: 'hero' | 'product' | 'thumbnail' | 'avatar' | 'background'
): number {
  const qualities: Record<string, number> = {
    hero: 85,
    product: 80,
    thumbnail: 75,
    avatar: 70,
    background: 60,
  }
  return qualities[type] || 75
}

/**
 * Generate a solid color data URL for placeholder
 * Useful when you don't have LQIP
 * 
 * @param color - Hex color (e.g. '#f5f1e6')
 * @returns SVG data URL
 */
export function generateColorPlaceholder(color: string): string {
  const sanitizedColor = color.replace('#', '')
  return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3Crect fill="%23${sanitizedColor}" width="1" height="1"/%3E%3C/svg%3E`
}

/**
 * Generate gradient placeholder data URL
 * 
 * @param fromColor - Start color (hex)
 * @param toColor - End color (hex)
 * @returns SVG data URL with gradient
 */
export function generateGradientPlaceholder(
  fromColor: string,
  toColor: string
): string {
  const from = fromColor.replace('#', '')
  const to = toColor.replace('#', '')
  
  return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23${from};stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23${to};stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill="url(%23g)" width="100" height="100"/%3E%3C/svg%3E`
}

/**
 * Check if image is already cached
 * 
 * Useful for determining if we need to show placeholder
 */
export function isImageCached(src: string): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const img = new Image()
    return img.width > 0 || img.height > 0
  } catch {
    return false
  }
}

/**
 * Preload image for better performance
 * 
 * Useful for prefetching next images before user navigates
 * 
 * @param src - Image source
 */
export function preloadImage(src: string): void {
  if (typeof window === 'undefined') return
  
  try {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = src
    document.head.appendChild(link)
  } catch (err) {
    console.warn('Failed to preload image:', err)
  }
}

/**
 * Get optimal image dimensions for container
 * 
 * Helps calculate width/height to prevent layout shift
 */
export function getOptimalDimensions(
  containerWidth: number,
  containerHeight: number,
  aspectRatio: number
): { width: number; height: number } {
  if (containerHeight === 0) {
    // Height is container height
    return {
      width: containerHeight * aspectRatio,
      height: containerHeight,
    }
  }

  // Width is container width
  return {
    width: containerWidth,
    height: containerWidth / aspectRatio,
  }
}

/**
 * Image optimization statistics for debugging
 * 
 * Track which images are being optimized
 */
export const imageStats = {
  prioritized: new Set<string>(),
  lazy: new Set<string>(),
  cached: new Map<string, number>(),

  /**
   * Track prioritized image
   */
  trackPriority(src: string): void {
    this.prioritized.add(src)
  },

  /**
   * Track lazy loaded image
   */
  trackLazy(src: string): void {
    this.lazy.add(src)
  },

  /**
   * Get statistics
   */
  getStats() {
    return {
      prioritized: this.prioritized.size,
      lazy: this.lazy.size,
      total: this.prioritized.size + this.lazy.size,
      ratio: `${this.prioritized.size}:${this.lazy.size}`,
    }
  },

  /**
   * Clear statistics
   */
  clear(): void {
    this.prioritized.clear()
    this.lazy.clear()
    this.cached.clear()
  },
}
