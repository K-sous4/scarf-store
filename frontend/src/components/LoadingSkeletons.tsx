/**
 * Loading Skeleton Components
 * 
 * Skeleton loaders for better user experience
 */

'use client'

export function SkeletonProductCard() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="h-48 bg-gray-300"></div>
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Name skeleton */}
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        
        {/* Description skeleton */}
        <div className="h-3 bg-gray-300 rounded w-full"></div>
        <div className="h-3 bg-gray-300 rounded w-5/6"></div>
        
        {/* Price skeleton */}
        <div className="pt-2 space-y-2">
          <div className="h-4 bg-gray-300 rounded w-1/3"></div>
          <div className="h-3 bg-gray-300 rounded w-1/4"></div>
        </div>
        
        {/* Button skeleton */}
        <div className="pt-2 h-10 bg-gray-300 rounded"></div>
      </div>
    </div>
  )
}

export function SkeletonProductGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <SkeletonProductCard key={index} />
      ))}
    </div>
  )
}

export function SkeletonHero() {
  return (
    <div className="h-96 bg-gradient-to-br from-gray-300 to-gray-400 animate-pulse rounded-lg"></div>
  )
}

export function SkeletonNavigation() {
  return (
    <div className="h-16 bg-gray-300 animate-pulse"></div>
  )
}
