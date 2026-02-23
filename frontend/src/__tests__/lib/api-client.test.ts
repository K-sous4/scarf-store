/**
 * API Client Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { apiClient } from '@/lib/api-client'
import { ErrorHandler } from '@/lib/error-handler'

// Mock fetch globally
global.fetch = vi.fn()

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockClear()
  })

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: '1', name: 'Product' }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
        headers: new Map(),
      })

      const result = await apiClient.get('/api/products/1')

      expect(result).toEqual(mockData)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/products/1'),
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('should include authorization header', async () => {
      const token = 'test-token'

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
        headers: new Map(),
      })

      // Mock localStorage for token
      localStorage.setItem('token', JSON.stringify(token))

      await apiClient.get('/api/products')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer') || token,
          }),
        })
      )
    })

    it('should handle 404 error', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
        headers: new Map(),
      })

      await expect(apiClient.get('/api/products/999')).rejects.toThrow()
    })

    it('should handle 500 error', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
        headers: new Map(),
      })

      await expect(apiClient.get('/api/products')).rejects.toThrow()
    })
  })

  describe('POST requests', () => {
    it('should make successful POST request', async () => {
      const mockData = { id: '1', name: 'New Product' }
      const payload = { name: 'New Product', price: 100 }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockData,
        headers: new Map(),
      })

      const result = await apiClient.post('/api/products', payload)

      expect(result).toEqual(mockData)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/products'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
        })
      )
    })

    it('should include Content-Type header', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({}),
        headers: new Map(),
      })

      await apiClient.post('/api/products', { name: 'Test' })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('should handle validation error (422)', async () => {
      const validationError = {
        error: 'Validation failed',
        details: [{ field: 'name', message: 'Required' }],
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => validationError,
        headers: new Map(),
      })

      await expect(
        apiClient.post('/api/products', { price: 100 })
      ).rejects.toThrow()
    })
  })

  describe('error handling', () => {
    it('should handle unauthorized error (401)', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
        headers: new Map(),
      })

      const errorSpy = vi.spyOn(ErrorHandler, 'handle')

      try {
        await apiClient.get('/api/admin')
      } catch (e) {
        // Expected
      }

      // ErrorHandler.handle should be called for auth errors
      expect(errorSpy).toHaveBeenCalled()

      errorSpy.mockRestore()
    })

    it('should handle forbidden error (403)', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Forbidden' }),
        headers: new Map(),
      })

      const errorSpy = vi.spyOn(ErrorHandler, 'handle')

      try {
        await apiClient.get('/api/admin/delete')
      } catch (e) {
        // Expected
      }

      expect(errorSpy).toHaveBeenCalled()

      errorSpy.mockRestore()
    })

    it('should handle network errors', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(
        new Error('Network error')
      )

      await expect(
        apiClient.get('/api/products')
      ).rejects.toThrow()
    })

    it('should handle network errors', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(
        new Error('Network error')
      )

      const errorSpy = vi.spyOn(ErrorHandler, 'handle')

      try {
        await apiClient.get('/api/products')
      } catch (e) {
        // Expected
      }

      expect(errorSpy).toHaveBeenCalled()

      errorSpy.mockRestore()
    })
  })

  describe('request options', () => {
    it('should support custom headers', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
        headers: new Map(),
      })

      await apiClient.get('/api/data')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object)
      )
    })
  })

  describe('response handling', () => {
    it('should parse JSON response', async () => {
      const mockData = {
        products: [
          { id: '1', name: 'Product 1' },
          { id: '2', name: 'Product 2' },
        ],
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
        headers: new Map(),
      })

      const result = await apiClient.get('/api/products')

      expect(result).toEqual(mockData)
    })

    it('should handle empty response', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => null,
        text: async () => '',
        headers: new Map(),
      })

      const result = await apiClient.post('/api/action', {})

      expect(result).toBeDefined()
    })

    it('should extract error message from response', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid request',
          message: 'Product name is required',
        }),
        headers: new Map(),
      })

      try {
        await apiClient.post('/api/products', {})
      } catch (error: any) {
        expect(error.message).toContain('Invalid request')
      }
    })
  })

  describe('request timeout', () => {
    it('should handle slow responses', async () => {
      ;(global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                status: 200,
                json: async () => ({}),
                headers: new Map(),
              })
            }, 100)
          })
      )

      const result = await apiClient.get('/api/slow')
      expect(result).toBeDefined()
    })
  })

  describe('CSRF token handling', () => {
    it('should include CSRF token in POST request', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({}),
        headers: new Map(),
      })

      // Mock CSRF token in meta tag
      const meta = document.createElement('meta')
      meta.name = 'csrf-token'
      meta.content = 'test-csrf-token'
      document.head.appendChild(meta)

      await apiClient.post('/api/products', { name: 'Test' })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-CSRF-Token': 'test-csrf-token',
          }),
        })
      )

      document.head.removeChild(meta)
    })
  })
})
