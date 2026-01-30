import prisma from '@/infrastructure/lib/prisma.js'
import type { Request, Response } from 'express'

/**
 * Obtener el perfil del usuario autenticado
 */
export const getProfileController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' })
      return
    }

    res.status(200).json({
      status: 'success',
      data: { user },
    })
  } catch (error: unknown) {
    console.error('Error al obtener el perfil del usuario:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}
