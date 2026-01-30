import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { config } from './index.js'

// Definir niveles de log personalizados
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

// Definir colores para cada nivel
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
}

// Aplicar colores a winston
winston.addColors(colors)

// Formato para logs en consola (desarrollo)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info

    // Si hay metadata adicional, mostrarla
    const metaStr = Object.keys(meta).length
      ? `\n${JSON.stringify(meta, null, 2)}`
      : ''

    return `${timestamp} [${level}]: ${message}${metaStr}`
  }),
)

// Formato para logs en archivo (producción)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
)

// Transports (dónde se guardan los logs)
const transports: winston.transport[] = []

// CONSOLA - Solo en desarrollo
if (config.env === 'development') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    }),
  )
}

// ARCHIVOS - Siempre activo
// Logs de todos los niveles
transports.push(
  new DailyRotateFile({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m', // Máximo 20MB por archivo
    maxFiles: '14d', // Mantener logs por 14 días
    format: fileFormat,
  }),
)

// Logs solo de errores
transports.push(
  new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '30d', // Errores se mantienen 30 días
    format: fileFormat,
  }),
)

// Logs de seguridad (autenticación, autorización)
transports.push(
  new DailyRotateFile({
    filename: 'logs/security-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    format: fileFormat,
  }),
)

// Crear el logger
const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  levels,
  transports,
  // Prevenir que el proceso se cierre en caso de error de logging
  exitOnError: false,
})

// Exportar el logger
export default logger