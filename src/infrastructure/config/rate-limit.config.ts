import rateLimit from 'express-rate-limit'
import { config } from './index.js'

/**
 * Rate limiter general para toda la API
 * Previene abuso general de la API
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 peticiones por ventana
  message: {
    status: 'error',
    message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.',
  },
  standardHeaders: true, // Retorna info en headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
  // Almacenamiento en memoria (para producción usar Redis)
  // store: new RedisStore({ client: redisClient })
})

/**
 * Rate limiter estricto para autenticación
 * Previene ataques de fuerza bruta
 * 5 intentos por 15 minutos
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: config.env === 'test' ? 10 : 3, // Solo 5 intentos
  message: {
    status: 'error',
    message:
      'Demasiados intentos de inicio de sesión. Por favor, intenta de nuevo en 15 minutos.',
  },
  skipSuccessfulRequests: true, // No contar peticiones exitosas
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Rate limiter para creación de cuentas
 * 3 registros por hora desde la misma IP
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: config.env === 'test' ? 10 : 3,
  message: {
    status: 'error',
    message:
      'Demasiados intentos de registro desde esta IP. Por favor, intenta más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Rate limiter para reset de contraseña
 * 3 intentos por hora
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: {
    status: 'error',
    message:
      'Demasiadas solicitudes de reset de contraseña. Por favor, intenta más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Rate limiter para envío de emails
 * 5 emails por hora
 */
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  message: {
    status: 'error',
    message: 'Demasiadas solicitudes de verificación. Por favor, intenta de nuevo más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Rate limiter para operaciones de escritura (POST, PUT, DELETE)
 * Más estricto que las operaciones de lectura
 */
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // 50 operaciones de escritura por ventana
  message: {
    status: 'error',
    message: 'Demasiadas operaciones de escritura. Por favor, intenta de nuevo más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET', // Solo aplica a POST, PUT, DELETE
})