import prisma from '@/infrastructure/lib/prisma.js'

/**
 * Invalida una sesión específica eliminando su Refresh Token de la base de datos.
 * * @async
 * @param {string} refreshToken - Token que se desea invalidar.
 * @param {string} [userId] - ID del usuario para validar la propiedad del token (Seguridad extra).
 * @throws {Error} INVALID_TOKEN - Si el token no existe en la base de datos.
 * @throws {Error} UNAUTHORIZED - Si el token no pertenece al usuario que solicita el logout.
 * @returns {Promise<{message: string}>} Mensaje de éxito.
 */
export const logoutService = async (refreshToken: string, userId?: string) => {
  // 1. Buscamos el refresh token en la base de datos
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  })

  // 2. Verificamos si el token existe
  if (!tokenRecord) throw new Error('INVALID_TOKEN')

  // 3. Verificacion adicional: el token pertenece al usuario
  if (userId && tokenRecord.userId !== userId) throw new Error('UNAUTHORIZED')

  // 4. Eliminamos el token de la base de datos
  await prisma.refreshToken.delete({
    where: { token: refreshToken },
  })

  return { message: 'Sesión cerrada exitosamente' }
}

/**
 * Invalida TODAS las sesiones activas de un usuario.
 * Útil para casos de seguridad (ej. cambio de contraseña o dispositivo perdido).
 * * @async
 * @param {string} userId - ID del usuario cuyas sesiones serán cerradas.
 * @returns {Promise<{message: string}>} Cantidad de sesiones cerradas y mensaje de éxito.
 */
export const logoutAllService = async (userId: string) => {
  // Eliminamos todos los refresh tokens asociados al usuario
  const result = await prisma.refreshToken.deleteMany({
    where: { userId },
  })

  return { message: `${result.count} sesión(es) cerrada(s) exitosamente` }
}
