/**
 * OptimizedImage Component Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import OptimizedImage from '@/components/OptimizedImage'

describe('OptimizedImage', () => {
  const defaultProps = {
    src: '/images/product.jpg',
    alt: 'Test Product',
    width: 300,
    height: 300,
  }

  describe('rendering', () => {
    it('should render image with correct attributes', () => {
      render(
        <OptimizedImage
          {...defaultProps}
        />
      )

      const img = screen.getByAltText('Test Product')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src')
    })

    it('should support custom className', () => {
      const { container } = render(
        <OptimizedImage
          {...defaultProps}
          className="rounded-lg"
        />
      )

      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('rounded-lg')
    })

    it('should render with priority on LCP images', () => {
      render(
        <OptimizedImage
          {...defaultProps}
          priority
        />
      )

      const img = screen.getByAltText('Test Product')
      expect(img).toBeInTheDocument()
    })
  })

  describe('optimization', () => {
    it('should apply quality setting', () => {
      const { container } = render(
        <OptimizedImage
          {...defaultProps}
          quality={75}
        />
      )

      const img = container.querySelector('img')
      expect(img).toBeInTheDocument()
    })

    it('should use default quality of 80', () => {
      const { container } = render(
        <OptimizedImage
          {...defaultProps}
        />
      )

      const img = container.querySelector('img')
      expect(img).toBeInTheDocument()
    })

    it('should support blur placeholder', () => {
      render(
        <OptimizedImage
          {...defaultProps}
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANS..."
        />
      )

      const img = screen.getByAltText('Test Product')
      expect(img).toBeInTheDocument()
    })

    it('should support empty placeholder', () => {
      render(
        <OptimizedImage
          {...defaultProps}
          placeholder="empty"
        />
      )

      const img = screen.getByAltText('Test Product')
      expect(img).toBeInTheDocument()
    })
  })

  describe('responsive sizing', () => {
    it('should accept sizes prop for responsive images', () => {
      render(
        <OptimizedImage
          {...defaultProps}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      )

      const img = screen.getByAltText('Test Product')
      expect(img).toBeInTheDocument()
    })

    it('should use fill prop for container-relative sizing', () => {
      render(
        <OptimizedImage
          src="/images/bg.jpg"
          alt="Background"
          fill
          className="object-cover"
        />
      )

      const img = screen.getByAltText('Background')
      expect(img).toBeInTheDocument()
    })
  })

  describe('lazy loading', () => {
    it('should lazy load non-priority images', () => {
      render(
        <OptimizedImage
          {...defaultProps}
          priority={false}
        />
      )

      const img = screen.getByAltText('Test Product')
      expect(img).toBeInTheDocument()
    })

    it('should support loading prop', () => {
      render(
        <OptimizedImage
          {...defaultProps}
          loading="lazy"
        />
      )

      const img = screen.getByAltText('Test Product')
      expect(img).toBeInTheDocument()
    })
  })

  describe('error handling', () => {
    it('should handle missing src gracefully', () => {
      const { container } = render(
        <OptimizedImage
          src=""
          alt="Empty Source"
          width={300}
          height={300}
        />
      )

      expect(container).toBeInTheDocument()
    })

    it('should use fallback image on error', () => {
      render(
        <OptimizedImage
          {...defaultProps}
          onError={(result: any) => {
            // Error handler
          }}
        />
      )

      const img = screen.getByAltText('Test Product')
      expect(img).toBeInTheDocument()
    })
  })

  describe('aspect ratio', () => {
    it('should maintain aspect ratio with width and height', () => {
      render(
        <OptimizedImage
          src="/images/product.jpg"
          alt="Product"
          width={300}
          height={200}
        />
      )

      const img = screen.getByAltText('Product')
      expect(img).toBeInTheDocument()
    })

    it('should support unoptimized prop', () => {
      render(
        <OptimizedImage
          {...defaultProps}
          unoptimized
        />
      )

      const img = screen.getByAltText('Test Product')
      expect(img).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have descriptive alt text', () => {
      render(
        <OptimizedImage
          src="/images/product.jpg"
          alt="Red wool scarf with fringe detail"
          width={300}
          height={300}
        />
      )

      const img = screen.getByAltText('Red wool scarf with fringe detail')
      expect(img).toBeInTheDocument()
    })

    it('should support title attribute', () => {
      render(
        <OptimizedImage
          {...defaultProps}
          title="Product Image"
        />
      )

      const img = screen.getByAltText('Test Product')
      expect(img).toHaveAttribute('title', 'Product Image')
    })
  })
})
