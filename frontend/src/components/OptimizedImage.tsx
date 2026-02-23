/**
 * Optimized Image Component
 * 
 * Wrapper around Next.js Image with:
 * - Priority loading for critical images
 * - Blur placeholder for better perceived performance
 * - Responsive sizes
 * - Quality optimization
 */

import Image, { ImageProps } from 'next/image'
import React from 'react'

interface OptimizedImageProps extends Omit<ImageProps, 'alt'> {
  alt: string
  /** Show as priority (will load immediately) */
  priority?: boolean
  /** Placeholder type: 'blur' | 'empty' */
  placeholderType?: 'blur' | 'empty'
  /** Blur data URL for placeholder (if placeholderType is 'blur') */
  blurDataUrl?: string
  /** Responsive sizes string */
  sizes?: string
  /** Image quality (1-100, default 75) */
  quality?: number
}

/**
 * OptimizedImage Component
 * 
 * Default blur placeholder (solid color) for faster perceived performance
 * Use priority for above-the-fold images (hero, first products in grid)
 * 
 * @example
 * // Product thumbnail (lazy loaded with blur)
 * <OptimizedImage
 *   src="/products/scarf-blue.jpg"
 *   alt="Blue scarf"
 *   width={300}
 *   height={300}
 * />
 * 
 * @example
 * // Hero image (priority, no placeholder needed)
 * <OptimizedImage
 *   src="/hero-banner.jpg"
 *   alt="Hero banner"
 *   width={1200}
 *   height={400}
 *   priority
 *   placeholderType="empty"
 * />
 * 
 * @example
 * // With custom blur placeholder
 * <OptimizedImage
 *   src="/product.jpg"
 *   alt="Product"
 *   width={300}
 *   height={300}
 *   blurDataUrl="data:image/jpeg;base64,..."
 *   placeholderType="blur"
 * />
 */
export default function OptimizedImage({
  alt,
  priority = false,
  placeholderType = 'blur',
  blurDataUrl,
  sizes,
  quality = 75,
  className,
  ...props
}: OptimizedImageProps) {
  // Default blur placeholder - solid semi-transparent color
  const defaultBlurUrl =
    blurDataUrl ||
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3Crect fill="%23f5f1e6" width="1" height="1"/%3E%3C/svg%3E'

  return (
    <Image
      alt={alt}
      priority={priority}
      quality={quality}
      sizes={sizes}
      placeholder={placeholderType === 'blur' ? 'blur' : 'empty'}
      blurDataURL={placeholderType === 'blur' ? defaultBlurUrl : undefined}
      className={className}
      {...props}
    />
  )
}

/**
 * Responsive sizes for different image types
 */
export const imageSizes = {
  /** Thumbnail/avatar 48px */
  thumb: '48px',
  
  /** Small card 150px */
  small: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 150px',
  
  /** Product card ~300px */
  product: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  
  /** Hero section full width */
  hero: '100vw',
  
  /** Large image 2 columns */
  large: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 50vw',
  
  /** Full width responsive */
  full: '100vw',
}

/**
 * Generate blur placeholder from image URL
 * Note: This requires a backend endpoint that generates LQIP
 * 
 * @param imageUrl - Original image URL
 * @returns Promise with base64 blur data URL
 * 
 * @example
 * const blurUrl = await generateBlurPlaceholder('/products/image.jpg')
 */
export async function generateBlurPlaceholder(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(`/api/image-placeholder?url=${encodeURIComponent(imageUrl)}`)
    if (!response.ok) throw new Error('Failed to generate placeholder')
    
    const { blurDataUrl } = await response.json()
    return blurDataUrl
  } catch (err) {
    console.warn('Failed to generate blur placeholder:', err)
    // Return default placeholder on error
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3Crect fill="%23f5f1e6" width="1" height="1"/%3E%3C/svg%3E'
  }
}
