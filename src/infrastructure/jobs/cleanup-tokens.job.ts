import prisma from '../lib/prisma.js'

/**
 * Job para limpiar tokens de verificación expirados
 */
export const cleanupExpiredVerificationTokens = async () => {
  try {
    const result = await prisma.verificationToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(), // lt = less than(menor que)
        },
      },
    })

    console.log(`🧹 Limpieza: ${result.count} tokens expirados eliminados`)
    return result
  } catch (error: unknown) {
    console.error('❌ Error en limpieza de tokens de verificación:', error)
    throw error
  }
}

/**
 * Job para limpiar refresh tokens expirados
 */
export const cleanupExpiredRefreshTokens = async () => {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })

    console.log(
      `🧹 Limpieza de refresh: ${result.count} tokens expirados eliminados`,
    )
    return result
  } catch (error) {
    console.error('❌ Error en limpieza de refresh tokens:', error)
    throw error
  }
}

/**
 * Job para limpiar password reset tokens expirados
 */
export const cleanupExpiredPasswordResetTokens = async () => {
  try {
    const result = await prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })

    console.log(
      `🧹 Limpieza de password reset: ${result.count} tokens expirados eliminados`,
    )
    return result
  } catch (error) {
    console.error('❌ Error en limpieza de password reset tokens:', error)
    throw error
  }
}

/**
 * Job principal que ejecuta todas las limpiezas
 */
export const cleanupAllExpiredTokens = async () => {
  console.log('⏰ Iniciando limpieza de tokens expirados...')

  try {
    await Promise.all([
      cleanupExpiredVerificationTokens(),
      cleanupExpiredRefreshTokens(),
      cleanupExpiredPasswordResetTokens(),
    ])

    console.log('🧹 Limpieza de tokens completada exitosamente')
  } catch (error) {
    console.error('❌ Error en limpieza general de tokens:', error)
  }
}
