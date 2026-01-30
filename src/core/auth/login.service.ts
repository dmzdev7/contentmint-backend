import type { LoginDTO } from '@/api/dtos/auth.dto.js'
import prisma from '@/infrastructure/lib/prisma.js'
import {
  generateAccessToken,
  generateRefreshToken,
} from '@/shared/utils/jwt.util.js'
import { logError, logSecurity } from '@/shared/utils/logger.utils.js'
import bcrypt from 'bcrypt'

/**
 * Autentica un usuario, genera tokens y registra el evento en logs de seguridad.
 * * @param data - Datos de acceso (email, password)
 * @param ip - Dirección IP para el registro de seguridad
 * @param userAgent - Navegador/Dispositivo para el registro de seguridad
 * @throws {Error} INVALID_CREDENTIALS o USER_INACTIVE
 * @returns {Promise<LoginResponse>} Tokens y datos públicos del usuario
 */
export const loginService = async (
  data: LoginDTO,
  ip?: string,
  userAgent?: string,
) => {
  try {
    // 1. Buscar el usuario por email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        isActive: true,
        isVerified: true,
      },
    })

    // 2. Verificar si el usuario existe
    if (!user) {
      // LOG: Intento de login con email inexistente
      logSecurity({
        action: 'LOGIN_ATTEMPT',
        email: data.email,
        success: false,
        reason: 'User not found',
        ...(ip && { ip }),
        ...(userAgent && { userAgent }),
      })

      throw new Error('INVALID_CREDENTIALS')
    }

    // 3. Verificar si el usuario está activo
    if (!user.isActive) {
      // LOG: Intento de login con cuenta inactiva
      logSecurity({
        action: 'LOGIN_ATTEMPT',
        userId: user.id,
        email: user.email,
        success: false,
        reason: 'User inactive',
        ...(ip && { ip }),
        ...(userAgent && { userAgent }),
      })

      throw new Error('USER_INACTIVE')
    }

    // 4. Comparar la contraseña
    const isPasswordValid = await bcrypt.compare(data.password, user.password)

    if (!isPasswordValid) {
      // LOG: Contraseña incorrecta
      logSecurity({
        action: 'LOGIN_ATTEMPT',
        userId: user.id,
        email: user.email,
        success: false,
        reason: 'Invalid password',
        ...(ip && { ip }),
        ...(userAgent && { userAgent }),
      })

      throw new Error('INVALID_CREDENTIALS')
    }

    // 5. Generar tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }

    const accessToken = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    // 6. Calcular fecha de expiración del refresh token
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // 7. Guardar el refresh token en la base de datos
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    })

    // LOG: Login exitoso
    logSecurity({
      action: 'LOGIN_SUCCESS',
      userId: user.id,
      email: user.email,
      success: true,
      ...(ip && { ip }),
      ...(userAgent && { userAgent }),
    })

    // 8. Retornar tokens y usuario
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
      },
    }
  } catch (error) {
    // Si el error no es de validación, loguearlo como error del sistema
    if (
      error instanceof Error &&
      !['INVALID_CREDENTIALS', 'USER_INACTIVE'].includes(error.message)
    ) {
      logError('Unexpected error in login service', {
        error,
        context: 'loginService',
        email: data.email,
      })
    }

    throw error
  }
}
