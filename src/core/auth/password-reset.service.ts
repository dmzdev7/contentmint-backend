import prisma from '@/infrastructure/lib/prisma.js'
import {
  sendPasswordChangedEmail,
  sendPasswordResetEmail,
} from '@/shared/utils/email.utils.js'
import { logError, logInfo, logSecurity } from '@/shared/utils/logger.utils.js'
import crypto from 'crypto'
import bcrypt from 'bcrypt'

/**
 * Genera un token criptográficamente seguro para procesos de verificación.
 * Utiliza la librería nativa crypto para asegurar alta entropía.
 * @returns {string} String hexadecimal de 64 caracteres (32 bytes).
 */
const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Gestiona la solicitud de recuperación de contraseña.
 * Implementa medidas contra enumeración de usuarios y timing attacks.
 * * @async
 * @param {string} email - Correo del usuario solicitante.
 * @param {string} [ip] - Dirección IP para logs de seguridad.
 * @returns {Promise<{message: string}>} Mensaje genérico de éxito.
 */
export const forgotPasswordService = async (email: string, ip?: string) => {
  try {
    // 1. Buscar el usuario por email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    })

    // 2. Por seguridad, SIEMPRE retornamos el mismo mensaje (Previene enumeration attacks)
    if (!user) {
      logSecurity({
        action: 'PASSWORD_RESET_REQUEST',
        email,
        success: false,
        reason: 'User not found',
        ...(ip && { ip }),
      })
      // Delay para prevenir timing attacks
      await new Promise((resolve) => setTimeout(resolve, 200))
      return {
        message:
          'Si el email existe en nuestro sistema, recibirás un enlace para resetear tu contraseña.',
      }
    }

    // 3. Verificar que el usuario está activo
    if (!user.isActive) {
      logSecurity({
        action: 'PASSWORD_RESET_REQUEST',
        userId: user.id,
        email: user.email,
        success: false,
        reason: 'User inactive',
        ...(ip && { ip }),
      })
      return {
        message:
          'Si el email existe en nuestro sistema, recibirás un enlace para resetear tu contraseña.',
      }
    }

    // 4. Eliminar tokens de reset antiguos del usuario
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    })

    // 5. Generar nuevo token seguro
    const resetToken = generateResetToken()

    // 6. Calcular fecha de expiración (1 hora)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)

    // 7. Guardar el token en la base de datos
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt,
      },
    })

    // LOG: Solicitud de reset exitosa
    logSecurity({
      action: 'PASSWORD_RESET_REQUEST',
      userId: user.id,
      email: user.email,
      success: true,
      ...(ip && { ip }),
    })

    // 8. Enviar email con el token mediante Resend
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.name)
      logInfo('Password reset email sent successfully', {
        userId: user.id,
        email: user.email,
      })
    } catch (error) {
      // LOG ERROR: Fallo en el envío de correo pero no bloqueamos la respuesta
      logError('CRITICAL: Failed to send password reset email', {
        error,
        context: 'forgotPasswordService',
        userId: user.id,
        email: user.email,
      })
    }

    // 9. Retornar mensaje genérico
    return {
      message:
        'Si el email existe en nuestro sistema, recibirás un enlace para resetear tu contraseña.',
    }
  } catch (error) {
    logError('Unexpected error in forgot password service', {
      error,
      context: 'forgotPasswordService',
      email,
    })
    throw error
  }
}

/**
 * Realiza el cambio de contraseña utilizando un token válido.
 * Invalida todas las sesiones anteriores para asegurar la cuenta.
 * * @async
 * @param {string} token - Token de recuperación recibido por email.
 * @param {string} newPassword - Nueva contraseña proporcionada por el usuario.
 * @param {string} [ip] - Dirección IP para logs de seguridad.
 * @throws {Error} INVALID_RESET_TOKEN | RESET_TOKEN_EXPIRED | USER_INACTIVE
 * @returns {Promise<{message: string}>} Confirmación de actualización.
 */
export const resetPasswordService = async (
  token: string,
  newPassword: string,
  ip?: string,
) => {
  try {
    // 1. Buscar el token en la base de datos e incluir datos del usuario
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
          },
        },
      },
    })

    // 2. Verificar que el token existe
    if (!resetToken) {
      logSecurity({
        action: 'PASSWORD_RESET_ATTEMPT',
        success: false,
        reason: 'Invalid token',
        ...(ip && { ip }),
      })
      throw new Error('INVALID_RESET_TOKEN')
    }

    // 3. Verificar que el token no ha expirado
    if (resetToken.expiresAt < new Date()) {
      logSecurity({
        action: 'PASSWORD_RESET_ATTEMPT',
        userId: resetToken.user.id,
        email: resetToken.user.email,
        success: false,
        reason: 'Token expired',
        ...(ip && { ip }),
      })
      await prisma.passwordResetToken.delete({ where: { token } })
      throw new Error('RESET_TOKEN_EXPIRED')
    }

    // 4. Verificar que el usuario está activo
    if (!resetToken.user.isActive) {
      logSecurity({
        action: 'PASSWORD_RESET_ATTEMPT',
        userId: resetToken.user.id,
        email: resetToken.user.email,
        success: false,
        reason: 'User inactive',
        ...(ip && { ip }),
      })
      throw new Error('USER_INACTIVE')
    }

    // 5. Hashear la nueva contraseña (bcrypt cost: 10)
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // 6. Actualizar la contraseña del usuario
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    })

    // 7. Eliminar el token de reset (Token de un solo uso)
    await prisma.passwordResetToken.delete({
      where: { token },
    })

    // 8. SEGURIDAD: Invalidar todas las sesiones activas (Refresh Tokens)
    const deletedSessions = await prisma.refreshToken.deleteMany({
      where: { userId: resetToken.userId },
    })

    // LOG: Éxito en el cambio de contraseña
    logSecurity({
      action: 'PASSWORD_RESET_SUCCESS',
      userId: resetToken.user.id,
      email: resetToken.user.email,
      success: true,
      ...(ip && { ip }),
    })
    logInfo('Password reset successful, all sessions invalidated', {
      userId: resetToken.user.id,
      sessionsInvalidated: deletedSessions.count,
    })

    // 9. Enviar email de confirmación (Notificar al usuario del cambio)
    try {
      await sendPasswordChangedEmail(
        resetToken.user.email,
        resetToken.user.name,
      )
    } catch (error) {
      logError('Failed to send password changed confirmation email', {
        error,
        context: 'resetPasswordService',
        userId: resetToken.user.id,
        email: resetToken.user.email,
      })
    }

    // 10. Retornar éxito
    return {
      message:
        'Contraseña actualizada exitosamente. Por favor, inicia sesión con tu nueva contraseña.',
    }
  } catch (error) {
    if (
      error instanceof Error &&
      !['INVALID_RESET_TOKEN', 'RESET_TOKEN_EXPIRED', 'USER_INACTIVE'].includes(
        error.message,
      )
    ) {
      logError('Unexpected error in reset password service', {
        error,
        context: 'resetPasswordService',
      })
    }
    throw error
  }
}
