import prisma from '@/infrastructure/lib/prisma.js'
import {
  sendVerificationEmail,
  sendWelcomeEmail,
} from '@/shared/utils/email.utils.js'
import { logError, logInfo } from '@/shared/utils/logger.utils.js'
import crypto from 'crypto'

/**
 * Valida el token de verificación, activa la cuenta del usuario y envía email de bienvenida.
 * * @async
 * @param {string} token - Token hexadecimal de 32 bytes recibido por email.
 * @throws {Error} INVALID_VERIFICATION_TOKEN | VERIFICATION_TOKEN_EXPIRED | EMAIL_ALREADY_VERIFIED
 * @returns {Promise<{message: string, user: Partial<User>}>} Mensaje de éxito y datos del usuario activado.
 */
export const verifyEmailService = async (token: string) => {
  // 1. Buscar el token de verificación en la base de datos
  const verificationRecord = await prisma.verificationToken.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          isVerified: true,
        },
      },
    },
  })

  // 2. Verificar si el token existe
  if (!verificationRecord) throw new Error('INVALID_VERIFICATION_TOKEN')

  // 3. Verificar si el token ha expirado
  if (verificationRecord.expiresAt < new Date()) {
    // Eliminar el token expirado
    await prisma.verificationToken.delete({
      where: { token },
    })
    throw new Error('VERIFICATION_TOKEN_EXPIRED')
  }

  // 4. Verificar si el usuario ya está verificado
  if (verificationRecord.user.isVerified) {
    // Eliminar el token innecesario
    await prisma.verificationToken.delete({
      where: { token },
    })
    throw new Error('EMAIL_ALREADY_VERIFIED')
  }

  // 5. Marcar el usuario como verificado
  const updatedUser = await prisma.user.update({
    where: { id: verificationRecord.user.id },
    data: { isVerified: true },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isVerified: true,
    },
  })

  // 6. Eliminar el token de verificación usado
  await prisma.verificationToken.delete({
    where: { token },
  })

  // 7. Enviar email de bienvenida (Flujo post-verificación)
  try {
    await sendWelcomeEmail(updatedUser.email, updatedUser.name)
    logInfo('Welcome email sent', { userId: updatedUser.id })
  } catch (error) {
    // No bloqueamos el proceso si falla el email de bienvenida
    logError('Error sending welcome email', { error, userId: updatedUser.id })
  }

  // 8. Retornar el usuario verificado
  return { message: 'EMAIL_VERIFIED_SUCCESSFULLY', user: updatedUser }
}

/**
 * Genera un nuevo token de verificación y lo reenvía al usuario.
 * Invalida cualquier token de verificación previo.
 * * @async
 * @param {string} email - Email del usuario que solicita el reenvío.
 * @throws {Error} USER_NOT_FOUND | EMAIL_ALREADY_VERIFIED | ERROR_SENDING_EMAIL
 * @returns {Promise<{message: string}>} Confirmación de reenvío.
 */
export const resendVerificationEmailService = async (email: string) => {
  // 1. Buscar el usuario por email
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      isVerified: true,
    },
  })

  // 2. Verificar si el usuario existe
  if (!user) throw new Error('USER_NOT_FOUND')

  // 3. Verificar si el usuario ya está verificado
  if (user.isVerified) throw new Error('EMAIL_ALREADY_VERIFIED')

  // 4. Eliminar tokens de verificación antiguos
  await prisma.verificationToken.deleteMany({
    where: { userId: user.id },
  })

  // 5. Generar un nuevo token de verificación
  const newToken = crypto.randomBytes(32).toString('hex')

  // 6. Calcular la fecha de expiración (24 horas)
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  // 7. Guardar el nuevo token en la base de datos
  await prisma.verificationToken.create({
    data: {
      token: newToken,
      userId: user.id,
      expiresAt,
    },
  })

  // 8. Enviar el email de verificación
  console.log('🔗 Nuevo token de verificación:', newToken)
  try {
    await sendVerificationEmail(user.email, newToken, user.name)
    logInfo('Verification email resent', { email: user.email, userId: user.id })
  } catch (error) {
    logError('Error resending verification email', { error, email: user.email })
    throw new Error('ERROR_SENDING_EMAIL')
  }

  return { message: 'VERIFICATION_EMAIL_RESENT' }
}
