/**
 * useErrorHandler Hook
 * 
 * Custom hook for handling errors in components
 * Provides error state, handler functions, and notifications
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { ErrorHandler, AppError, ErrorContext } from './error-handler'

interface UseErrorHandlerReturn {
  error: AppError | null
  isError: boolean
  errorMessage: string
  handleError: (error: Error | string | AppError, context?: ErrorContext) => void
  clearError: () => void
  dismissError: () => void
}

/**
 * Hook para gerenciar erros em componentes
 * 
 * @param onError - Callback quando erro ocorre (útil para toast)
 * @returns { error, isError, errorMessage, handleError, clearError, dismissError }
 * 
 * @example
 * const { error, errorMessage, handleError } = useErrorHandler()
 * 
 * const fetchData = async () => {
 *   try {
 *     const data = await api.get('/data')
 *   } catch (err) {
 *     handleError(err, { component: 'MyComponent' })
 *   }
 * }
 */
export function useErrorHandler(
  onError?: (error: AppError) => void
): UseErrorHandlerReturn {
  const [error, setError] = useState<AppError | null>(null)

  // Subscribe to global errors
  useEffect(() => {
    const unsubscribe = ErrorHandler.onError((appError: AppError) => {
      setError(appError)
      onError?.(appError)
    })

    return unsubscribe
  }, [onError])

  const handleError = useCallback(
    (err: Error | string | AppError, context?: ErrorContext) => {
      const appError = ErrorHandler.handle(err, context)
      setError(appError)
      onError?.(appError)
    },
    [onError]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const dismissError = useCallback(() => {
    setError(null)
  }, [])

  return {
    error,
    isError: error !== null,
    errorMessage: error ? ErrorHandler.getErrorMessage(error) : '',
    handleError,
    clearError,
    dismissError,
  }
}

/**
 * Hook para validação com error handling
 * 
 * @example
 * const { validate, error } = useValidation()
 * 
 * const handleSubmit = (data) => {
 *   if (!validate(data)) {
 *     return
 *   }
 *   // Proceed...
 * }
 */
export function useValidation() {
  const { error, handleError, clearError } = useErrorHandler()

  const validate = useCallback(
    (data: unknown, schema?: (data: unknown) => boolean): boolean => {
      if (schema && !schema(data)) {
        handleError('Dados inválidos', { action: 'validation' })
        return false
      }

      clearError()
      return true
    },
    [handleError, clearError]
  )

  return { validate, error }
}

/**
 * Hook para async operations com error handling
 * 
 * @example
 * const { loading, error, execute } = useAsync()
 * 
 * const handleClick = async () => {
 *   await execute(async () => {
 *     await api.post('/data', payload)
 *   })
 * }
 */
export function useAsync() {
  const [loading, setLoading] = useState(false)
  const { error, handleError, clearError } = useErrorHandler()

  const execute = useCallback(
    async (fn: () => Promise<void>): Promise<void> => {
      setLoading(true)
      try {
        clearError()
        await fn()
      } catch (err) {
        handleError(err as Error, { action: 'async_operation' })
      } finally {
        setLoading(false)
      }
    },
    [handleError, clearError]
  )

  return { loading, error, execute }
}
