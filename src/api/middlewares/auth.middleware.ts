import {
  verifyAccessToken,
  type TokenPayload,
} from '@/shared/utils/jwt.util.js'
import type { NextFunction, Request, Response } from 'express'

// Extendemos la interfaz Request para agregar el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

/**
 * Middleware para verificar que el usuario está autenticado
 * Verifica el token JWT del header Authorization
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 1. Obtener el token del header Authorization
    const authHeader = req.headers.authorization

    if (!authHeader) {
      res.status(401).json({
        status: 'error',
        message: 'Token no proporcionado',
      })
      return
    }

    // 2. Verificar formato: "Bearer <token>"
    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        status: 'error',
        message: 'Formato de token inválido. Usa: Bearer <token>',
      })
      return
    }

    const token = parts[1]

    // 3. Verificación extra de seguridad (satisface a TypeScript)
    if (!token) {
      res.status(401).json({
        status: 'error',
        message: 'Token vacío',
      })
      return
    }

    // 4. Verificar y decodificar el token
    const decoded = verifyAccessToken(token)

    // 5. Agregar el usuario decodificado al request
    req.user = decoded

    // 6. Continuar al siguiente middleware/controlador
    next()
  } catch (error: unknown) {
    // Manejo de errores de JWT
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          status: 'error',
          message: 'Token expirado',
        })
        return
      }
      if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
          status: 'error',
          message: 'Token inválido',
        })
        return
      }
    }

    // Error inesperado
    console.error('Error en middleware de autenticación:', error)
    res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor',
    })
  }
}
