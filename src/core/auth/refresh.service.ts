import prisma from '@/infrastructure/lib/prisma.js'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '@/shared/utils/jwt.util.js'
import { logError, logInfo, logSecurity } from '@/shared/utils/logger.utils.js'
import { logoutAllService } from './logout.service.js'

/**
 * Gestiona la renovación de credenciales mediante Refresh Token Rotation.
 * Implementa una estrategia de detección de reutilización de tokens para prevenir ataques de robo de sesión.
 * * @async
 * @param {string} refreshToken - Token de refresco actual enviado por el cliente.
 * @throws {Error} INVALID_REFRESH_TOKEN - Si el token no tiene una firma válida.
 * @throws {Error} TOKEN_REUSE_DETECTED - Si se intenta usar un token ya invalidado (Alerta de seguridad).
 * @throws {Error} REFRESH_TOKEN_EXPIRED - Si el token ha superado su fecha de validez.
 * @throws {Error} USER_INACTIVE - Si el usuario ha sido suspendido o desactivado.
 * @returns {Promise<RefreshResponse>} Nuevo par de tokens (Access y Refresh) y datos públicos del usuario.
 * * @description
 * El servicio realiza una "Rotación de Refresh Tokens":
 * 1. Valida el token actual.
 * 2. Verifica si el token ya fue usado anteriormente (detección de anomalías).
 * 3. Si se detecta un reuso, invalida preventivamente TODAS las sesiones del usuario.
 * 4. Si todo es correcto, emite un nuevo par de tokens y elimina el anterior en una transacción atómica.
 */
export const refreshTokenService = async (refreshToken: string) => {
  // 1. Verificar que el refresh token sea válido
  let decoded
  try {
    decoded = verifyRefreshToken(refreshToken)
  } catch (error) {
    throw new Error('INVALID_REFRESH_TOKEN')
  }

  // 2. Verificar que el refresh token exista en la base de datos
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      },
    },
  })

  // 3. DETECCIÓN DE ROBO: Si el token no existe pero es válido según JWT
  if (!tokenRecord) {
    // CAMBIO: Usar logSecurity para que quede guardado en el archivo de logs
    logSecurity({
      action: 'TOKEN_REUSE_DETECTED',
      userId: decoded.userId,
      success: false,
      reason: 'Valid JWT but missing in DB (possible theft)',
    })

    // Invalidar TODAS las sesiones
    try {
      await logoutAllService(decoded.userId)

      logInfo('Security recovery: All sessions invalidated', {
        userId: decoded.userId,
      })
    } catch (error) {
      logError('Failed to invalidate sessions during security recovery', {
        error,
      })
    }

    // Aquí podrías enviar un email al usuario:
    // await sendSecurityAlert(decoded.email, 'Actividad sospechosa detectada')

    throw new Error('TOKEN_REUSE_DETECTED')
  }

  // 4. Verificar si el token ha expirado
  if (tokenRecord.expiresAt < new Date()) {
    await prisma.refreshToken.delete({
      where: { token: refreshToken },
    })
    throw new Error('REFRESH_TOKEN_EXPIRED')
  }

  // 5. Verificar si el usuario está activo
  if (!tokenRecord.user.isActive) throw new Error('USER_INACTIVE')

  // 6. Generar un nuevo access token
  const tokenPayload = {
    userId: tokenRecord.user.id,
    email: tokenRecord.user.email,
    role: tokenRecord.user.role,
  }

  const newAccessToken = generateAccessToken(tokenPayload)

  // 7. Generar un nuevo refresh token y actualizar la base de datos
  const newRefreshToken = generateRefreshToken(tokenPayload)
  // Calcular nueva fecha de expiración
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  // Realizamos ambas operaciones en una transacción
  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { token: refreshToken } }),
    prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: tokenRecord.user.id,
        expiresAt,
      },
    }),
  ])

  // 8. Retornar los nuevos tokens
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: {
      id: tokenRecord.user.id,
      email: tokenRecord.user.email,
      name: tokenRecord.user.name,
      role: tokenRecord.user.role,
    },
  }
}
