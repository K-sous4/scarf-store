/**
 * Environment Configuration
 * 
 * Centralizes environment variables and configuration
 */

export const config = {
  // API Configuration
  // Use /api relative path - middleware will proxy to http://localhost:8000/api/...
  api: {
    baseUrl: '/api',
    timeout: 30000, // 30 seconds
    retries: 3,
  },

  // App Configuration
  app: {
    name: 'Scarf Store',
    description: 'Premium scarves and accessories',
    version: '1.0.0',
  },

  // Feature Flags
  features: {
    enableProductSearch: true,
    enableUserAuth: true,
    enableCart: true,
    enableCheckout: false, // Not implemented yet
  },

  // UI Configuration
  ui: {
    itemsPerPage: 50,
    animationDuration: 300, // milliseconds
  },

  // Development
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
}
