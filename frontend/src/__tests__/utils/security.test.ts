/**
 * Security utilities tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  sanitizeHtml,
  isValidRedirectUrl,
  getCsrfToken,
  verifyCsrfToken,
  analyzeCspViolation,
} from '@/utils/security'

describe('Security Utils', () => {
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const dirty = '<div>Hello <script>alert("xss")</script></div>'
      const clean = sanitizeHtml(dirty)
      expect(clean).not.toContain('<script>')
      expect(clean).toContain('Hello')
    })

    it('should remove onclick handlers', () => {
      const dirty = '<button onclick="alert(\'xss\')">Click</button>'
      const clean = sanitizeHtml(dirty)
      expect(clean).not.toContain('onclick')
    })

    it('should remove iframe tags', () => {
      const dirty = '<div><iframe src="evil.com"></iframe></div>'
      const clean = sanitizeHtml(dirty)
      expect(clean).not.toContain('<iframe>')
    })

    it('should preserve safe HTML', () => {
      const safe = '<p>Hello <strong>World</strong></p>'
      const result = sanitizeHtml(safe)
      expect(result).toContain('<strong>')
      expect(result).toContain('Hello')
      expect(result).toContain('World')
    })

    it('should remove dangling attributes', () => {
      const dirty = '<a href="javascript:alert(\'xss\')">Click</a>'
      const clean = sanitizeHtml(dirty)
      expect(clean).not.toContain('javascript:')
    })
  })

  describe('isValidRedirectUrl', () => {
    beforeEach(() => {
      // Simulate window.location.origin
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost:3000',
          href: 'http://localhost:3000/',
        },
        writable: true,
      })
    })

    it('should allow same-origin URLs', () => {
      expect(isValidRedirectUrl('/products')).toBe(true)
      expect(isValidRedirectUrl('http://localhost:3000/admin')).toBe(true)
    })

    it('should reject different-origin URLs', () => {
      expect(isValidRedirectUrl('http://evil.com')).toBe(false)
      expect(isValidRedirectUrl('https://example.com')).toBe(false)
    })

    it('should handle protocol mismatch', () => {
      expect(isValidRedirectUrl('https://localhost:3000')).toBe(false)
    })

    it('should handle invalid URLs', () => {
      expect(isValidRedirectUrl('not a url')).toBe(false)
    })
  })

  describe('getCsrfToken', () => {
    beforeEach(() => {
      // Clear meta tags
      document.querySelectorAll('meta[name="csrf-token"]').forEach((el) => el.remove())
      localStorage.clear()
      vi.clearAllMocks()
    })

    it('should get CSRF token from meta tag', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'csrf-token')
      meta.setAttribute('content', 'test-token-123')
      document.head.appendChild(meta)

      expect(getCsrfToken()).toBe('test-token-123')

      document.head.removeChild(meta)
    })

    it('should get CSRF token from localStorage fallback', () => {
      localStorage.setItem('csrf-token', 'fallback-token')

      expect(getCsrfToken()).toBe('fallback-token')

      localStorage.removeItem('csrf-token')
    })

    it('should return null if no token found', () => {
      expect(getCsrfToken()).toBeNull()
    })

    it('should prefer meta tag over localStorage', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'csrf-token')
      meta.setAttribute('content', 'meta-token')
      document.head.appendChild(meta)

      localStorage.setItem('csrf-token', 'storage-token')

      expect(getCsrfToken()).toBe('meta-token')

      document.head.removeChild(meta)
      localStorage.removeItem('csrf-token')
    })
  })

  describe('verifyCsrfToken', () => {
    beforeEach(() => {
      document.querySelectorAll('meta[name="csrf-token"]').forEach((el) => el.remove())
      localStorage.clear()
    })

    it('should verify matching CSRF tokens', () => {
      const token = 'test-token-123'
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'csrf-token')
      meta.setAttribute('content', token)
      document.head.appendChild(meta)

      expect(verifyCsrfToken(token)).toBe(true)

      document.head.removeChild(meta)
    })

    it('should reject non-matching tokens', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'csrf-token')
      meta.setAttribute('content', 'correct-token')
      document.head.appendChild(meta)

      expect(verifyCsrfToken('wrong-token')).toBe(false)

      document.head.removeChild(meta)
    })

    it('should return false if no token stored', () => {
      expect(verifyCsrfToken('any-token')).toBe(false)
    })
  })

  describe('analyzeCspViolation', () => {
    it('should analyze critical CSP violations', () => {
      const report = {
        'csp-report': {
          'document-uri': 'https://example.com',
          'violated-directive': 'script-src',
          'effective-directive': 'script-src',
          'original-policy': "script-src 'self'",
          'disposition': 'enforce',
          'blocked-uri': 'https://evil.com',
          'source-file': 'https://example.com/page.js',
          'line-number': 10,
        },
      }

      const analysis = analyzeCspViolation(report)

      expect(analysis.severity).toBe('critical')
      expect(analysis.message).toContain('script-src')
      expect(analysis.details.blockedUri).toBe('https://evil.com')
    })

    it('should analyze low-severity violations', () => {
      const report = {
        'csp-report': {
          'document-uri': 'https://example.com',
          'violated-directive': 'img-src',
          'effective-directive': 'img-src',
          'original-policy': "img-src 'self'",
          'disposition': 'enforce',
          'blocked-uri': 'https://cdn.example.com/image.png',
        },
      }

      const analysis = analyzeCspViolation(report)

      expect(analysis.severity).toBe('low')
      expect(analysis.message).toContain('img-src')
    })

    it('should include all details', () => {
      const report = {
        'csp-report': {
          'document-uri': 'https://example.com',
          'violated-directive': 'style-src',
          'effective-directive': 'style-src',
          'original-policy': "style-src 'self'",
          'disposition': 'report',
          'blocked-uri': 'https://cdn.com/style.css',
          'source-file': 'https://example.com/app.js',
          'line-number': 42,
          'column-number': 5,
          'status-code': 200,
        },
      }

      const analysis = analyzeCspViolation(report)

      expect(analysis.details).toHaveProperty('documentUri')
      expect(analysis.details).toHaveProperty('violatedDirective')
      expect(analysis.details).toHaveProperty('blockedUri')
      expect(analysis.details.lineNumber).toBe(42)
    })
  })
})
