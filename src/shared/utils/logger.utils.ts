import logger from '@/infrastructure/config/logger.config.js'

/**
 * Interfaz para metadata de seguridad
 */
interface SecurityLogMetadata {
  userId?: string
  email?: string
  ip?: string
  userAgent?: string
  action: string
  success: boolean
  reason?: string
}

/**
 * Interfaz para metadata de errores
 */
interface ErrorLogMetadata {
  error: Error | unknown
  context?: string
  userId?: string
  [key: string]: unknown
}

/**
 * Log de eventos de seguridad
 * Se guarda en logs/security-YYYY-MM-DD.log
 */
export const logSecurity = (metadata: SecurityLogMetadata) => {
  const level = metadata.success ? 'info' : 'warn'

  logger.log({
    level,
    message: metadata.action,
    ...metadata,
    category: 'security',
  })
}

/**
 * Log de errores
 * Se guarda en logs/error-YYYY-MM-DD.log y logs/combined-YYYY-MM-DD.log
 */
export const logError = (message: string, metadata?: ErrorLogMetadata) => {
  const errorInfo: Record<string, unknown> = {
    message,
    category: 'error',
  }

  if (metadata) {
    const { error, context, userId, ...rest } = metadata

    errorInfo.context = context
    errorInfo.userId = userId

    // Extraer información del error
    if (error instanceof Error) {
      errorInfo.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    } else {
      errorInfo.error = String(error)
    }

    // Agregar metadata adicional
    Object.assign(errorInfo, rest)
  }

  logger.error(errorInfo)
}

/**
 * Log de información general
 */
export const logInfo = (
  message: string,
  metadata?: Record<string, unknown>,
) => {
  logger.info({
    message,
    category: 'info',
    ...metadata,
  })
}

/**
 * Log de advertencias
 */
export const logWarn = (
  message: string,
  metadata?: Record<string, unknown>,
) => {
  logger.warn({
    message,
    category: 'warning',
    ...metadata,
  })
}

/**
 * Log de debugging (solo en desarrollo)
 */
export const logDebug = (
  message: string,
  metadata?: Record<string, unknown>,
) => {
  logger.debug({
    message,
    category: 'debug',
    ...metadata,
  })
}

/**
 * Log de requests HTTP
 */
export const logHttp = (
  method: string,
  url: string,
  statusCode: number,
  responseTime: number,
  metadata?: Record<string, unknown>,
) => {
  logger.http({
    message: `${method} ${url} ${statusCode} - ${responseTime}ms`,
    method,
    url,
    statusCode,
    responseTime,
    category: 'http',
    ...metadata,
  })
}
