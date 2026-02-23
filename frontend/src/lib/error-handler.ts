/**
 * Error Handler
 * 
 * Centralized error handling system for the application
 * Manages error classification, logging, and user-friendly messages
 */

/**
 * Error types supported by the system
 */
export enum ErrorType {
  NETWORK = 'NETWORK',           // Network/connection errors
  VALIDATION = 'VALIDATION',     // Input validation errors
  AUTHENTICATION = 'AUTHENTICATION', // Auth/login errors
  AUTHORIZATION = 'AUTHORIZATION',   // Permission/access errors
  NOT_FOUND = 'NOT_FOUND',       // 404 errors
  SERVER = 'SERVER',             // 5xx server errors
  UNKNOWN = 'UNKNOWN',           // Unknown/unhandled errors
}

/**
 * Standardized error object
 */
export interface AppError {
  type: ErrorType
  message: string
  details?: string
  statusCode?: number
  originalError?: Error
  timestamp: number
  id: string
}

/**
 * Error context for logging
 */
export interface ErrorContext {
  component?: string
  action?: string
  userId?: string | number
  metadata?: Record<string, unknown>
}

/**
 * Error logger interface (for future Sentry integration)
 */
export interface ErrorLogger {
  log(error: AppError, context?: ErrorContext): void
  clearErrors(): void
  getErrors(): AppError[]
}

/**
 * In-memory error logger (will be replaced by Sentry)
 */
class MemoryErrorLogger implements ErrorLogger {
  private errors: AppError[] = []
  private maxErrors = 50

  log(error: AppError, context?: ErrorContext): void {
    const enrichedError = {
      ...error,
      context,
      timestamp: Date.now(),
    }

    this.errors.push(enrichedError as any)

    // Limit memory usage
    if (this.errors.length > this.maxErrors) {
      this.errors.shift()
    }

    // Console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${error.type}] ${error.message}`, {
        details: error.details,
        context,
        original: error.originalError,
      })
    }
  }

  clearErrors(): void {
    this.errors = []
  }

  getErrors(): AppError[] {
    return [...this.errors]
  }
}

/**
 * Error handler service
 */
export class ErrorHandler {
  private static logger: ErrorLogger = new MemoryErrorLogger()
  private static errorListeners: Set<(error: AppError) => void> = new Set()

  /**
   * Classify HTTP status codes to error types
   */
  static classifyError(statusCode?: number): ErrorType {
    if (!statusCode) return ErrorType.UNKNOWN

    if (statusCode === 401) return ErrorType.AUTHENTICATION
    if (statusCode === 403) return ErrorType.AUTHORIZATION
    if (statusCode === 404) return ErrorType.NOT_FOUND
    if (statusCode >= 500) return ErrorType.SERVER
    if (statusCode >= 400) return ErrorType.VALIDATION

    return ErrorType.UNKNOWN
  }

  /**
   * Create standardized error object
   */
  static createError(
    type: ErrorType,
    message: string,
    statusCode?: number,
    originalError?: Error
  ): AppError {
    return {
      type,
      message,
      statusCode,
      originalError,
      timestamp: Date.now(),
      id: this.generateErrorId(),
    }
  }

  /**
   * Handle error and log it
   */
  static handle(
    error: Error | string | AppError,
    context?: ErrorContext
  ): AppError {
    let appError: AppError

    if (typeof error === 'string') {
      appError = this.createError(ErrorType.UNKNOWN, error)
    } else if (error instanceof Error) {
      appError = this.createError(
        this.classifyError(),
        error.message,
        undefined,
        error
      )
    } else {
      appError = error as AppError
    }

    // Log the error
    this.logger.log(appError, context)

    // Notify listeners
    this.errorListeners.forEach(listener => listener(appError))

    return appError
  }

  /**
   * Handle API errors (from fetch response)
   */
  static handleAPIError(
    statusCode: number,
    message: string,
    originalError?: Error
  ): AppError {
    const type = this.classifyError(statusCode)
    const appError = this.createError(type, message, statusCode, originalError)
    this.logger.log(appError)
    this.errorListeners.forEach(listener => listener(appError))
    return appError
  }

  /**
   * Handle network/connection errors
   */
  static handleNetworkError(originalError: Error): AppError {
    const appError = this.createError(
      ErrorType.NETWORK,
      'Falha ao conectar com o servidor. Verifique sua conexão.',
      undefined,
      originalError
    )
    this.logger.log(appError)
    this.errorListeners.forEach(listener => listener(appError))
    return appError
  }

  /**
   * Get user-friendly message for error
   */
  static getErrorMessage(error: AppError): string {
    const messages: Record<ErrorType, string> = {
      [ErrorType.NETWORK]:
        'Não foi possível conectar. Verifique sua conexão e tente novamente.',
      [ErrorType.VALIDATION]:
        'Dados inválidos. Por favor, verifique os campos e tente novamente.',
      [ErrorType.AUTHENTICATION]:
        'Sessão expirada. Por favor, faça login novamente.',
      [ErrorType.AUTHORIZATION]:
        'Você não tem permissão para acessar este recurso.',
      [ErrorType.NOT_FOUND]: 'O recurso solicitado não foi encontrado.',
      [ErrorType.SERVER]:
        'Erro no servidor. Por favor, tente novamente mais tarde.',
      [ErrorType.UNKNOWN]:
        'Ocorreu um erro desconhecido. Por favor, tente novamente.',
    }

    return messages[error.type] || error.message
  }

  /**
   * Subscribe to error events (useful for toast notifications)
   */
  static onError(listener: (error: AppError) => void): () => void {
    this.errorListeners.add(listener)

    // Return unsubscribe function
    return () => {
      this.errorListeners.delete(listener)
    }
  }

  /**
   * Get all logged errors (debugging)
   */
  static getErrors(): AppError[] {
    return this.logger.getErrors()
  }

  /**
   * Clear error history
   */
  static clearErrors(): void {
    this.logger.clearErrors()
  }

  /**
   * Set custom logger (for Sentry integration)
   */
  static setLogger(logger: ErrorLogger): void {
    this.logger = logger
  }

  /**
   * Generate unique error ID for tracking
   */
  private static generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Check if user should be redirected to login
   */
  static isAuthError(error: AppError): boolean {
    return (
      error.type === ErrorType.AUTHENTICATION ||
      error.statusCode === 401 ||
      error.statusCode === 403
    )
  }

  /**
   * Check if error is recoverable
   */
  static isRecoverable(error: AppError): boolean {
    return (
      error.type === ErrorType.NETWORK ||
      error.type === ErrorType.VALIDATION ||
      error.statusCode === 429 // Too many requests
    )
  }
}

/**
 * Export error types and classes
 */
export { MemoryErrorLogger }
