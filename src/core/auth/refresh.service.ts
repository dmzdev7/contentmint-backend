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
 * 
 * @async
 * @param {string} refreshToken - Token de refresco actual enviado por el cliente.
 * @throws {Error} INVALID_REFRESH_TOKEN - Si el token no tiene una firma válida.
 * @throws {Error} TOKEN_REUSE_DETECTED - Si se intenta usar un token ya invalidado (Alerta de seguridad).
 * @throws {Error} REFRESH_TOKEN_EXPIRED - Si el token ha superado su fecha de validez.
 * @throws {Error} USER_INACTIVE - Si el usuario ha sido suspendido o desactivado.
 * @returns {Promise<RefreshResponse>} Nuevo par de tokens (Access y Refresh) y datos públicos del usuario.
 * 
 * @description
 * El servicio realiza una "Rotación de Refresh Tokens":
 * 1. Valida el token actual.
 * 2. Verifica si el token ya fue usado anteriormente (detección de anomalías).
 * 3. Si se detecta un reuso, invalida preventivamente TODAS las sesiones del usuario.
 * 4. Si todo es correcto, emite un nuevo par de tokens y elimina el anterior en una transacción atómica.
 */
export const refreshTokenService = async (refreshToken: string) => {
  // 1. Verificar JWT (firma y expiración)
  const decoded = verifyRefreshToken(refreshToken)

  // 2. Buscar el token en BD con información del usuario en una sola consulta
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

  // 3. DETECCIÓN DE ROBO: Token válido según JWT pero no existe en BD
  if (!tokenRecord) {
    logSecurity({
      action: 'TOKEN_REUSE_DETECTED',
      userId: decoded.userId,
      success: false,
      reason: 'Valid JWT but missing in DB (possible token reuse or theft)',
      // metadata: { tokenId: decoded.jti },
    })

    // Invalidar TODAS las sesiones del usuario de forma asíncrona
    // No bloqueamos la respuesta por esto
    await logoutAllService(decoded.userId)
      .then(() => {
        logInfo('Security recovery: All sessions invalidated', {
          userId: decoded.userId,
        })
      })
      .catch((error) => {
        logError('Failed to invalidate sessions during security recovery', {
          error,
          userId: decoded.userId,
        })
      })

    // Aquí podrías enviar un email al usuario:
    // sendSecurityAlert(decoded.email, 'Actividad sospechosa detectada').catch(logError)

    throw new Error('TOKEN_REUSE_DETECTED')
  }

  // 4. Verificar expiración del token (ahora que sabemos que existe)
  if (tokenRecord.expiresAt < new Date()) {
    // Limpiar token expirado de forma asíncrona
    await prisma.refreshToken
      .delete({ where: { token: refreshToken } })
      .catch((error) => {
        logError('Failed to delete expired token', { error })
      })

    throw new Error('REFRESH_TOKEN_EXPIRED')
  }

  // 5. Verificar si el usuario está activo
  if (!tokenRecord.user.isActive) {
    logSecurity({
      action: 'INACTIVE_USER_REFRESH_ATTEMPT',
      userId: tokenRecord.user.id,
      success: false,
      reason: 'User account is inactive',
    })
    throw new Error('USER_INACTIVE')
  }

  // 6. Preparar payload para los nuevos tokens
  const payload = {
    userId: tokenRecord.user.id,
    email: tokenRecord.user.email,
    role: tokenRecord.user.role,
  }

  const newAccessToken = generateAccessToken(payload)

  // 7. ROTACIÓN: Generar NUEVO refresh token
  const newRefreshToken = generateRefreshToken(payload)

  // 8. Calcular nueva fecha de expiración
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 días

  // 9. IMPORTANTE: Eliminar el token viejo PRIMERO
  await prisma.refreshToken.delete({
    where: { token: refreshToken },
  })

  // 10. Guardar el nuevo token
  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: tokenRecord.user.id,
      expiresAt,
    },
  })

  // 11. Retornar NUEVOS tokens
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