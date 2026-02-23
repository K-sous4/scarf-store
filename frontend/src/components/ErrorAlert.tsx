/**
 * Error Alert Component
 * 
 * Displays error messages in a user-friendly alert
 */

'use client'

import { ReactNode } from 'react'
import { AppError } from '@/lib/error-handler'

interface ErrorAlertProps {
  error?: AppError | string | null
  onDismiss?: () => void
  variant?: 'error' | 'warning' | 'info'
  showDetails?: boolean
  children?: ReactNode
}

/**
 * ErrorAlert
 * 
 * @param error - AppError object or error message string
 * @param onDismiss - Callback when user dismisses alert
 * @param variant - Alert style variant
 * @param showDetails - Show technical details in dev mode
 * 
 * @example
 * const { error, clearError } = useErrorHandler()
 * return <ErrorAlert error={error} onDismiss={clearError} />
 */
export default function ErrorAlert({
  error,
  onDismiss,
  variant = 'error',
  showDetails = false,
  children,
}: ErrorAlertProps) {
  if (!error) return null

  const isString = typeof error === 'string'
  const message = isString ? error : error.message
  const details = !isString ? error.details : null
  const errorId = !isString ? error.id : null

  const colors: Record<string, Record<string, string>> = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      textSecondary: 'text-red-700',
      icon: '❌',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      textSecondary: 'text-yellow-700',
      icon: '⚠️',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      textSecondary: 'text-blue-700',
      icon: 'ℹ️',
    },
  }

  const color = colors[variant]

  return (
    <div
      className={`${color.bg} border ${color.border} rounded-lg p-4 mb-4`}
      role="alert"
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="text-xl flex-shrink-0">{color.icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`${color.text} font-medium mb-1`}>{message}</p>

          {/* Details (development only) */}
          {showDetails && details && process.env.NODE_ENV === 'development' && (
            <p className={`${color.textSecondary} text-sm mb-2`}>{details}</p>
          )}

          {/* Dev info */}
          {process.env.NODE_ENV === 'development' && errorId && (
            <p className={`${color.textSecondary} text-xs`}>ID: {errorId}</p>
          )}

          {/* Custom children */}
          {children && <div className="mt-2">{children}</div>}
        </div>

        {/* Close button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`${color.textSecondary} hover:${color.text} text-2xl leading-none flex-shrink-0 transition`}
            aria-label="Dismissir alerta"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Error Stack Component
 * 
 * Displays multiple errors
 */
interface ErrorStackProps {
  errors: (AppError | string)[]
  onDismiss?: (index: number) => void
}

export function ErrorStack({ errors, onDismiss }: ErrorStackProps) {
  return (
    <div className="space-y-3">
      {errors.map((error, index) => (
        <ErrorAlert
          key={index}
          error={error}
          onDismiss={onDismiss ? () => onDismiss(index) : undefined}
        />
      ))}
    </div>
  )
}
