import prisma from '@/infrastructure/lib/prisma.js'
import type { NextFunction, Request, Response } from 'express'

/**
 * Middleware para verificar que el usuario tiene email verificado
 * Debe usarse DESPUÉS del middleware authenticate
 */
export const requireVerifiedEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // 1. Verificar que el usuario este autenticado
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'No estás autenticado',
      })
      return
    }

    // 2. Obtener el usuario de la base de datos
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        isVerified: true,
        email: true,
      },
    })

    // 3. Verificar que el usuario existe
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'Usuario no encontrado',
      })
      return
    }

    // 4. Verificar que el email está verificado
    if (!user.isVerified) {
      res.status(403).json({
        status: 'error',
        message: 'Debes verificar tu email para acceder a este recurso',
        code: 'EMAIL_NOT_VERIFIED',
        data: {
          email: user.email,
        },
      })
      return
    }

    // 5. Email verificado, continuar
    next()
  } catch (error: unknown) {
    console.error('Error en requireVerifiedEmail:', error)
    res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor',
    })
  }
}
