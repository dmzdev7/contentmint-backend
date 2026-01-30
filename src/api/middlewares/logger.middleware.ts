import { logHttp } from '@/shared/utils/logger.utils.js'
import type { Request, Response, NextFunction } from 'express'

/**
 * Middleware para registrar y monitorear peticiones HTTP.
 * Captura detalles del request, status code y tiempo de respuesta.
 * * @param req - Request de Express
 * @param res - Response de Express
 * @param next - Función next de Express
 */
export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  // 1. Iniciar cronómetro para medir el tiempo de respuesta
  const start = Date.now()

  // 2. Escuchar el evento 'finish' de la respuesta
  // Este evento se dispara cuando el cliente recibe los datos
  res.on('finish', () => {
    // 3. Calcular la duración total de la petición en milisegundos
    const duration = Date.now() - start

    // 4. Registrar la actividad HTTP mediante el logger (Winston)
    // Incluye método, URL, status, duración y metadatos de contexto
    logHttp(req.method, req.url, res.statusCode, duration, {
      // Intentar obtener IP de headers (proxy) o conexión directa
      ip: req.ip || req.socket.remoteAddress,
      // Identificar el cliente (navegador, Postman, etc.)
      userAgent: req.headers['user-agent'],
      // Registrar el ID del usuario si la ruta pasó por el middleware de auth
      userId: req.user?.userId,
    })
  })

  // 5. Continuar con el siguiente middleware o controlador
  next()
}
