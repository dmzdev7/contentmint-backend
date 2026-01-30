import type { Role } from '@db/index.js'
import type { NextFunction, Request, Response } from 'express'

/**
 * Middleware para verificar que el usuario tiene un rol específico
 * @param allowedRoles - Array de roles permitidos
 * @returns Middleware function
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // 1. Verificar que el usuario esté autenticado
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Usuario no autenticado',
      })
      return
    }

    // 2. Verificar que el rol del usuario esté en los roles permitidos
    if (!allowedRoles.includes(req.user.role as Role)) {
      res.status(403).json({
        status: 'error',
        message: 'No tienes permiso para acceder a este recurso',
      })
      return
    }

    // 3. Si todo está bien, continuar al siguiente middleware/controlador
    next()
  }
}
