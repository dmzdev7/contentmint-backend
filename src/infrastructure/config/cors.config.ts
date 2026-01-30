import type { CorsOptions } from 'cors'
import { config } from './index.js'

/**
 * Lista de orígenes permitidos
 */
const allowedOrigins = [...config.allowedOrigins]

// En producción, agregar dominios reales
if (config.env === 'production') {
  allowedOrigins.push(
    'https://tuapp.com',
    'https://www.tuapp.com',
    'https://app.tuapp.com',
  )
}

/**
 * Configuración de CORS
 */
export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // 1. Permitir si no hay origen (Server-to-server)
    // 2. Permitir si el origen está en nuestro Set (O(1) lookup)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Opcional: Log de seguridad para debuguear orígenes bloqueados
    console.warn(`CORS Bloqueado para: ${origin}`);
    
    return callback(new Error('No permitido por CORS'), false);
  },
  credentials: true, // Permitir cookies
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge: 86400, // 24 horas - tiempo que el navegador cachea la respuesta preflight
}

/**
 * Configuración de CORS permisiva para desarrollo
 */
export const corsDevOptions: CorsOptions = {
  origin: true, // Permitir cualquier origen
  credentials: true,
  optionsSuccessStatus: 200,
}
