/**
 * API Route Configuration
 * 
 * This file exports configuration for API routing patterns
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const API_ROUTES = {
  // Public Routes (baseUrl is /api, so use /v1...)
  products: '/v1/products',
  productDetail: (id: number) => `/v1/products/${id}`,
  search: (query: string) => `/v1/products/search?q=${query}`,
  
  // Admin Routes (private)
  adminProducts: '/v1/admin/products',
  adminProductCreate: '/v1/admin/products',
  adminProductUpdate: (id: number) => `/v1/admin/products/${id}`,
  adminProductDelete: (id: number) => `/v1/admin/products/${id}`,
  adminProductStock: (id: number) => `/v1/admin/products/${id}/stock`,
  adminLowStock: '/v1/admin/low-stock',
  
  // Auth Routes
  login: '/v1/auth/login',
  logout: '/v1/auth/logout',
  register: '/v1/auth/register',
}

/**
 * Request Headers Configuration
 */
export const getRequestHeaders = (): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
}

/**
 * Error Messages (in Portuguese)
 */
export const ERROR_MESSAGES = {
  network: 'Erro de conexão com o servidor',
  server: 'Erro no servidor',
  notFound: 'Recurso não encontrado',
  unauthorized: 'Acesso não autorizado',
  forbidden: 'Acesso proibido',
  validation: 'Dados inválidos',
  unknown: 'Ocorreu um erro desconhecido',
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(status: number, defaultMessage?: string): string {
  const messages: Record<number, string> = {
    400: ERROR_MESSAGES.validation,
    401: ERROR_MESSAGES.unauthorized,
    403: ERROR_MESSAGES.forbidden,
    404: ERROR_MESSAGES.notFound,
    500: ERROR_MESSAGES.server,
    0: ERROR_MESSAGES.network,
  }

  return messages[status] || defaultMessage || ERROR_MESSAGES.unknown
}
