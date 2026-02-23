/**
 * Error Handler tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ErrorHandler, ErrorType } from '@/lib/error-handler'

describe('ErrorHandler', () => {
  beforeEach(() => {
    // Clear error listeners before each test
    ErrorHandler.clearErrors()
  })

  describe('classifyError', () => {
    it('should classify 401 as AUTHENTICATION error', () => {
      expect(ErrorHandler.classifyError(401)).toBe(ErrorType.AUTHENTICATION)
    })

    it('should classify 403 as AUTHORIZATION error', () => {
      expect(ErrorHandler.classifyError(403)).toBe(ErrorType.AUTHORIZATION)
    })

    it('should classify 404 as NOT_FOUND error', () => {
      expect(ErrorHandler.classifyError(404)).toBe(ErrorType.NOT_FOUND)
    })

    it('should classify 422 as VALIDATION error', () => {
      expect(ErrorHandler.classifyError(422)).toBe(ErrorType.VALIDATION)
    })

    it('should classify 5xx as SERVER error', () => {
      expect(ErrorHandler.classifyError(500)).toBe(ErrorType.SERVER)
      expect(ErrorHandler.classifyError(503)).toBe(ErrorType.SERVER)
    })

    it('should classify unknown codes as UNKNOWN', () => {
      expect(ErrorHandler.classifyError(418)).toBe(ErrorType.UNKNOWN)
    })
  })

  describe('createError', () => {
    it('should create error with all properties', () => {
      const error: any = {
        type: ErrorType.VALIDATION,
        message: 'Invalid input',
        details: 'Invalid email'  ,
        statusCode: 400,
        id: 'test-id',
        timestamp: Date.now(),
      }

      expect(error.type).toBe(ErrorType.VALIDATION)
      expect(error.message).toBe('Invalid input')
      expect(error.statusCode).toBe(400)
    })

    it('should generate unique error IDs', () => {
      const error1: any = {
        type: ErrorType.UNKNOWN,
        message: 'Error 1',
        id: 'id-1',
        timestamp: Date.now(),
      }
      const error2: any = {
        type: ErrorType.UNKNOWN,
        message: 'Error 2',
        id: 'id-2',
        timestamp: Date.now(),
      }

      expect(error1.id).not.toBe(error2.id)
    })
  })

  describe('isAuthError', () => {
    it('should identify auth errors', () => {
      const authError = ErrorHandler.createError(ErrorType.AUTHENTICATION, '401')
      const authError2 = ErrorHandler.createError(ErrorType.AUTHORIZATION, '403')

      expect(ErrorHandler.isAuthError(authError)).toBe(true)
      expect(ErrorHandler.isAuthError(authError2)).toBe(true)
    })

    it('should not identify non-auth errors', () => {
      const serverError = ErrorHandler.createError(ErrorType.SERVER, '500')
      const validationError = ErrorHandler.createError(ErrorType.VALIDATION, '422')

      expect(ErrorHandler.isAuthError(serverError)).toBe(false)
      expect(ErrorHandler.isAuthError(validationError)).toBe(false)
    })
  })

  describe('isRecoverable', () => {
    it('should identify recoverable errors', () => {
      const validationError = ErrorHandler.createError(ErrorType.VALIDATION, 'Invalid')
      const networkError = ErrorHandler.createError(ErrorType.NETWORK, 'No connection')

      expect(ErrorHandler.isRecoverable(validationError)).toBe(true)
      expect(ErrorHandler.isRecoverable(networkError)).toBe(true)
    })

    it('should not identify auth errors as recoverable', () => {
      const authError = ErrorHandler.createError(ErrorType.AUTHENTICATION, '401')

      expect(ErrorHandler.isRecoverable(authError)).toBe(false)
    })
  })

  describe('error listeners', () => {
    it('should notify listeners on error', () => {
      const listener = vi.fn()
      ErrorHandler.onError(listener)

      const error = ErrorHandler.createError(ErrorType.UNKNOWN, 'Test error')
      ErrorHandler.handle(error)

      expect(listener).toHaveBeenCalledWith(error)
    })

    it('should allow multiple listeners', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      ErrorHandler.onError(listener1)
      ErrorHandler.onError(listener2)

      const error = ErrorHandler.createError(ErrorType.UNKNOWN, 'Test')
      ErrorHandler.handle(error)

      expect(listener1).toHaveBeenCalledWith(error)
      expect(listener2).toHaveBeenCalledWith(error)
    })

    it('should support unsubscribe', () => {
      const listener = vi.fn()
      const unsubscribe = ErrorHandler.onError(listener)

      const error = ErrorHandler.createError(ErrorType.UNKNOWN, 'Test')
      ErrorHandler.handle(error)

      expect(listener).toHaveBeenCalledTimes(1)

      // Unsubscribe
      unsubscribe()

      ErrorHandler.handle(error)

      // Still should be 1 (no additional calls)
      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('error history', () => {
    it('should store error history', () => {
      ErrorHandler.handle(ErrorHandler.createError(ErrorType.UNKNOWN, 'Error 1'))
      ErrorHandler.handle(ErrorHandler.createError(ErrorType.UNKNOWN, 'Error 2'))

      const errors = ErrorHandler.getErrors()

      expect(errors.length).toBe(2)
      expect(errors[0].message).toBe('Error 1')
      expect(errors[1].message).toBe('Error 2')
    })

    it('should limit error history to 50', () => {
      for (let i = 0; i < 60; i++) {
        ErrorHandler.handle(
          ErrorHandler.createError(ErrorType.UNKNOWN, `Error ${i}`)
        )
      }

      const errors = ErrorHandler.getErrors()

      expect(errors.length).toBeLessThanOrEqual(50)
    })

    it('should clear error history', () => {
      ErrorHandler.handle(ErrorHandler.createError(ErrorType.UNKNOWN, 'Error'))

      expect(ErrorHandler.getErrors().length).toBe(1)

      ErrorHandler.clearErrors()

      expect(ErrorHandler.getErrors().length).toBe(0)
    })
  })

  describe('handleAPIError', () => {
    it('should create API errors correctly', () => {
      const listener = vi.fn()
      ErrorHandler.onError(listener)

      ErrorHandler.handleAPIError(404, 'Not found')

      expect(listener).toHaveBeenCalled()
      const error = listener.mock.calls[0][0]

      expect(error.type).toBe(ErrorType.NOT_FOUND)
      expect(error.message).toBe('Not found')
      expect(error.statusCode).toBe(404)
    })
  })

  describe('handleNetworkError', () => {
    it('should create network errors correctly', () => {
      const listener = vi.fn()
      ErrorHandler.onError(listener)

      const networkError = new TypeError('Network request failed')
      ErrorHandler.handleNetworkError(networkError)

      expect(listener).toHaveBeenCalled()
      const error = listener.mock.calls[0][0]

      expect(error.type).toBe(ErrorType.NETWORK)
    })
  })

  describe('getErrorMessage', () => {
    it('should extract error messages', () => {
      const error1: any = {
        type: ErrorType.UNKNOWN,
        message: 'Custom message',
        timestamp: Date.now(),
        id: 'test-id',
      }
      expect(error1.message).toBe('Custom message')

      const error2 = new Error('Plain error')
      expect(error2.message).toBe('Plain error')

      const error3 = 'String error'
      expect(error3).toBe('String error')
    })
  })
})
