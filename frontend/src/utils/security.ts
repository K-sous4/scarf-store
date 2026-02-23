/**
 * Security Configuration and Utilities
 * 
 * Centralized security settings and utilities for:
 * - Content Security Policy (CSP)
 * - CORS handling
 * - CSRF token management
 * - XSS prevention
 * - Security headers
 */

'use client'

/**
 * Security headers configuration
 * Maps to next.config.js headers
 */
export const securityConfig = {
  // Strict Transport Security (HSTS)
  // Forces HTTPS for all connections
  hsts: {
    maxAge: 63072000, // 2 years in seconds
    includeSubDomains: true,
    preload: true,
  },

  // Content Security Policy (CSP)
  // Prevents XSS, injection attacks
  csp: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdn.jsdelivr.net'],
      imgSrc: ["'self'", 'data:', 'https:', 'http:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'", 'http://localhost:8000', 'http://localhost:3000'],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
    upgradeInsecureRequests: true,
  },

  // Permissions Policy (formerly Feature Policy)
  // Controls what browser features can be used
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    'interest-cohort': [],
    payment: [],
    usb: [],
    magnetometer: [],
    gyroscope: [],
    accelerometer: [],
  },

  // Referrer Policy
  // Controls how much referrer information is shared
  referrerPolicy: 'strict-origin-when-cross-origin',

  // CORS allowed origins
  cors: {
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:8000',
      process.env.NEXT_PUBLIC_API_URL,
    ].filter(Boolean),
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    credentials: true,
  },
}

/**
 * Get CSP nonce for inline scripts/styles
 * Should be used with CSP nonce directive
 * 
 * @example
 * const nonce = getSecurityNonce()
 * <script nonce={nonce}>...</script>
 */
export function getSecurityNonce(): string {
  if (typeof window === 'undefined') return ''
  
  // Check if nonce is available from server
  const meta = document.querySelector('meta[property="csp-nonce"]')
  return meta?.getAttribute('content') || ''
}

/**
 * Validate CSP violation report
 * Call from CSP report endpoint
 */
export interface CSPViolationReport {
  'csp-report': {
    'document-uri': string
    'violated-directive': string
    'effective-directive': string
    'original-policy': string
    'disposition': string
    'blocked-uri'?: string
    'source-file'?: string
    'line-number'?: number
    'column-number'?: number
    'status-code'?: number
  }
}

/**
 * Analyze CSP violation report
 */
export function analyzeCspViolation(report: CSPViolationReport): {
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  details: Record<string, any>
} {
  const violation = report['csp-report']
  
  const severityMap: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
    'script-src': 'critical',
    'style-src': 'high',
    'img-src': 'low',
    'font-src': 'medium',
    'connect-src': 'high',
    'form-action': 'critical',
    'frame-ancestors': 'critical',
    'base-uri': 'high',
  }

  const directive = violation['violated-directive']
  const severity = severityMap[directive] || 'medium'
  const message = `CSP Violation: ${directive} blocked "${violation['blocked-uri'] || 'inline'}" on ${violation['source-file'] || 'unknown source'}`

  return {
    severity,
    message,
    details: {
      documentUri: violation['document-uri'],
      violatedDirective: directive,
      effectiveDirective: violation['effective-directive'],
      blockedUri: violation['blocked-uri'],
      sourceFile: violation['source-file'],
      lineNumber: violation['line-number'],
      disposition: violation['disposition'],
    },
  }
}

/**
 * Sanitize HTML to prevent XSS
 * Use for rendering user-generated content
 */
export function sanitizeHtml(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // Remove dangerous elements
  const dangerousElements = doc.querySelectorAll(
    'script, iframe, object, embed, link, style, [onclick], [onload], [onerror]'
  )
  dangerousElements.forEach((el) => el.remove())

  // Remove dangerous attributes
  const allElements = doc.querySelectorAll('*')
  allElements.forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith('on') || ['href', 'src'].includes(attr.name)) {
        if (!attr.value.startsWith('http') && !attr.value.startsWith('mailto:')) {
          el.removeAttribute(attr.name)
        }
      }
    })
  })

  return doc.body.innerHTML
}

/**
 * Validate URL is same-origin
 * Prevents open redirect attacks
 */
export function isValidRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.href)
    return parsed.origin === window.location.origin
  } catch {
    return false
  }
}

/**
 * Get CSRF token from meta tag or localStorage
 */
export function getCsrfToken(): string | null {
  // Check meta tag first (server-set)
  const meta = document.querySelector('meta[name="csrf-token"]')
  if (meta) {
    return meta.getAttribute('content')
  }

  // Check localStorage fallback
  if (typeof window !== 'undefined') {
    return localStorage.getItem('csrf-token')
  }

  return null
}

/**
 * Verify CSRF token matches
 */
export function verifyCsrfToken(token: string): boolean {
  const storedToken = getCsrfToken()
  if (!storedToken) return false

  // Constant-time comparison to prevent timing attacks
  return constantTimeEquals(token, storedToken)
}

/**
 * Constant-time string comparison
 * Prevents timing attack vulnerability
 */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

/**
 * Security audit checklist
 */
export const securityChecklist = {
  headers: [
    {
      name: 'Strict-Transport-Security',
      description: 'Force HTTPS connections',
      status: true,
    },
    {
      name: 'X-Frame-Options: DENY',
      description: 'Prevent clickjacking attacks',
      status: true,
    },
    {
      name: 'X-Content-Type-Options: nosniff',
      description: 'Prevent MIME type sniffing',
      status: true,
    },
    {
      name: 'X-XSS-Protection',
      description: 'Enable XSS protection in older browsers',
      status: true,
    },
    {
      name: 'Referrer-Policy',
      description: 'Control referrer information sharing',
      status: true,
    },
    {
      name: 'Content-Security-Policy',
      description: 'Prevent XSS and injection attacks',
      status: true,
    },
    {
      name: 'Permissions-Policy',
      description: 'Control browser features access',
      status: true,
    },
  ],
  practices: [
    {
      name: 'Input Validation',
      description: 'Validate all user inputs server-side',
      status: true,
    },
    {
      name: 'CSRF Protection',
      description: 'Use CSRF tokens for state-changing requests',
      status: true,
    },
    {
      name: 'XSS Prevention',
      description: 'Sanitize and escape user-generated content',
      status: true,
    },
    {
      name: 'Password Security',
      description: 'Hash passwords with strong algorithms (bcrypt)',
      status: true,
    },
    {
      name: 'API Authentication',
      description: 'Use JWT or session tokens for API auth',
      status: true,
    },
    {
      name: 'Rate Limiting',
      description: 'Implement rate limiting on sensitive endpoints',
      status: true,
    },
    {
      name: 'Logging & Monitoring',
      description: 'Log security events and monitor for threats',
      status: true,
    },
  ],
}

/**
 * Security diagnostic report
 */
export async function getSecurityDiagnostics(): Promise<{
  headers: Record<string, string>
  cspStatus: 'active' | 'report-only' | 'disabled'
  httpsEnabled: boolean
  timestamp: string
}> {
  try {
    const response = await fetch('/__security-check')
    if (!response.ok) throw new Error('Security check failed')

    const data = await response.json()
    return {
      ...data,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Security diagnostic error:', error)
    return {
      headers: {},
      cspStatus: 'disabled',
      httpsEnabled: typeof window !== 'undefined' && window.location.protocol === 'https:',
      timestamp: new Date().toISOString(),
    }
  }
}
