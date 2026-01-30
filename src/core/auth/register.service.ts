import type { RegisterDTO } from '@/api/dtos/auth.dto.js'
import prisma from '@/infrastructure/lib/prisma.js'
import { sendVerificationEmail } from '@/shared/utils/email.utils.js'
import { logError, logInfo, logWarn } from '@/shared/utils/logger.utils.js'
import type { Prisma } from '@db/index.js'
import bcrypt from 'bcrypt'
import crypto from 'crypto'

/**
 * Genera un token criptográficamente seguro para procesos de verificación.
 * Utiliza la librería nativa crypto para asegurar alta entropía.
 * @returns {string} String hexadecimal de 64 caracteres (32 bytes).
 */
const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Registra un nuevo usuario en el sistema, gestiona la seguridad de la contraseña y
 * dispara el flujo de verificación por correo electrónico.
 * * @async
 * @param {RegisterDTO} data - Objeto con nombre, email, password y confirmación.
 * @throws {Error} EMAIL_ALREADY_EXISTS - Si el correo ya está registrado en la base de datos.
 * @throws {Error} Error - Errores inesperados de base de datos o lógica interna.
 * * @returns {Promise<Partial<User>>} Objeto del usuario creado omitiendo datos sensibles.
 * * @description
 * El proceso sigue este flujo:
 * 1. Validación de unicidad de email.
 * 2. Hashing de contraseña con bcrypt (cost: 10).
 * 3. Persistencia en base de datos.
 * 4. Generación de token de verificación con validez de 24h.
 * 5. Envío de email asíncrono (no bloquea la respuesta si falla).
 * 6. Registro de eventos mediante Winston (Logs de Info, Warn y Error).
 */
export const registerService = async (data: RegisterDTO) => {
  try {
    // 1. Verificamos que el usuario no exista
    const userExists = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (userExists) {
      // LOG: Intento de registro con email duplicado
      logWarn('Registration attempt with existing email', {
        email: data.email,
      })

      throw new Error('EMAIL_ALREADY_EXISTS')
    }

    // 2. Encriptamos la contraseña
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // 3. Desestructuramos el objeto
    const { passwordConfirm, ...userData } = data

    // 4. Creamos el objeto para Prisma
    const newUser: Prisma.UserCreateInput = {
      ...userData,
      password: hashedPassword,
    }

    // 5. Guardamos el usuario
    const user = await prisma.user.create({
      data: newUser,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    })

    // LOG: Usuario registrado exitosamente
    logInfo('User registered successfully', {
      userId: user.id,
      email: user.email,
      name: user.name,
    })

    // 6. Generar token de verificación
    const verificationToken = generateVerificationToken()

    // 7. Calcular fecha de expiración
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    // 8. Guardar el token
    await prisma.verificationToken.create({
      data: {
        token: verificationToken,
        userId: user.id,
        expiresAt,
      },
    })

    // 9. Enviar email con Resend
    try {
      await sendVerificationEmail(user.email, verificationToken, user.name)
      logInfo('Verification email sent successfully', {
        userId: user.id,
        email: user.email,
      })
    } catch (error) {
      // LOG ERROR: Fallo crítico al enviar email
      logError('Failed to send verification email', {
        error,
        context: 'registerService',
        userId: user.id,
        email: user.email,
      })
      // No lanzamos error porque el usuario ya fue creado
    }

    // 10. TODO: Retornar el usuario (en producción, no retornar el token)

    return user
  } catch (error) {
    // Log de errores inesperados
    if (error instanceof Error && error.message !== 'EMAIL_ALREADY_EXISTS') {
      logError('Unexpected error in register service', {
        error,
        context: 'registerService',
        email: data.email,
      })
    }

    throw error
  }
}
