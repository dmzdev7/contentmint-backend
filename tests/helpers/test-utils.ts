import prisma from '@/infrastructure/lib/prisma.js'
import { generateAccessToken, generateRefreshToken } from '@/shared/utils/jwt.util.js'
import type { Role, User } from '@db/index.js'
import bcrypt from 'bcrypt'
import { expect } from 'vitest'
import request from 'supertest';

/**
 * Crea un usuario de prueba
 */
export async function createTestUser(data?: {
  email?: string
  name?: string
  password?: string
  role?: Role
  isVerified?: boolean
  isActive?: boolean
}) {
  const hashedPassword = await bcrypt.hash(data?.password || 'Password123!', 10)

  const user = await prisma.user.create({
    data: {
      email: data?.email || 'test@example.com',
      name: data?.name || 'Test User',
      password: hashedPassword,
      role: data?.role || 'USER',
      isVerified: data?.isVerified ?? true,
      isActive: data?.isActive ?? true,
    },
  })

  return user
}

/**
 * Genera tokens para un usuario
 */
export function generateTestToken(user: Pick<User, 'id' | 'email' | 'role'>) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  }

  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  return { accessToken, refreshToken }
}

/**
 * Crea usuario con tokens
 */
export async function createAuthenticatedUser(
  data?: Parameters<typeof createTestUser>[0],
) {
  const user = await createTestUser(data)
  const tokens = generateTestToken(user)

  // Guardar refresh token en DB
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt,
    },
  })

  return {
    user,
    ...tokens,
  }
}

/**
 * Crea token de verificación de email
 */
export async function createVerificationToken(userId: string) {
  const token = 'test-verification-token-' + Date.now()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  await prisma.verificationToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  })

  return token
}

/**
 * Crea token de reset de contraseña
 */
export async function createPasswordResetToken(userId: string) {
  const token = 'test-reset-token-' + Date.now()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 1)

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  })

  return token
}

/**
 * Verifica estructura de respuesta exitosa
 */
export function expectSuccessResponse(
  response: request.Response,
  statusCode: number = 200,
) {
  expect(response.status).toBe(statusCode)
  expect(response.body.status).toBe('success')
  expect(response.body.data).toBeDefined()
}

/**
 * Verifica estructura de error estándar
 */
export function expectErrorResponse(
  response: request.Response,
  statusCode: number,
  messageContains?: string | string[],
) {
  expect(response.status).toBe(statusCode)
  expect(response.body.status).toBe('error')
  expect(response.body.message).toBeDefined()
  expect(typeof response.body.message).toBe('string')

  if (messageContains) {
    const message = response.body.message.toLowerCase()
    
    if (Array.isArray(messageContains)) {
      // Verificar que contenga AL MENOS UNO de los textos
      const hasAnyMatch = messageContains.some(text => 
        message.includes(text.toLowerCase())
      )
      expect(hasAnyMatch).toBe(true)
    } else {
      // Verificar que contenga el texto específico
      expect(message).toContain(messageContains.toLowerCase())
    }
  }
}
