import prisma from '@/infrastructure/lib/prisma.js'
import { createTestUser } from 'tests/helpers/test-utils.js'
import { describe, it, expect, beforeEach } from 'vitest'
import { loginService } from '../login.service.js'

describe('Login Service', () => {
  const testPassword = 'Password123!'

  beforeEach(async () => {
    // Limpiar datos
    await prisma.refreshToken.deleteMany()
    await prisma.user.deleteMany()
  })

  it('should login successfully with valid credentials', async () => {
    const user = await createTestUser({
      email: 'login@example.com',
      password: testPassword,
    })

    const result = await loginService({
      email: user.email,
      password: testPassword,
    })

    expect(result).toBeDefined()
    expect(result.accessToken).toBeTruthy()
    expect(result.refreshToken).toBeTruthy()
    expect(result.user.id).toBe(user.id)
    expect(result.user.email).toBe(user.email)
  })

  it('should create refresh token in database', async () => {
    const user = await createTestUser({
      email: 'token@example.com',
      password: testPassword,
    })

    const result = await loginService({
      email: user.email,
      password: testPassword,
    })

    const tokenInDb = await prisma.refreshToken.findFirst({
      where: { userId: user.id },
    })

    expect(tokenInDb).toBeDefined()
    expect(tokenInDb?.token).toBe(result.refreshToken)
  })

  it('should throw error for non-existent user', async () => {
    await expect(
      loginService({
        email: 'nonexistent@example.com',
        password: testPassword,
      }),
    ).rejects.toThrow('INVALID_CREDENTIALS')
  })

  it('should throw error for wrong password', async () => {
    const user = await createTestUser({
      email: 'wrong@example.com',
      password: testPassword,
    })

    await expect(
      loginService({
        email: user.email,
        password: 'WrongPassword123!',
      }),
    ).rejects.toThrow('INVALID_CREDENTIALS')
  })

  it('should throw error for inactive user', async () => {
    const user = await createTestUser({
      email: 'inactive@example.com',
      password: testPassword,
      isActive: false,
    })

    await expect(
      loginService({
        email: user.email,
        password: testPassword,
      }),
    ).rejects.toThrow('USER_INACTIVE')
  })

  it('should allow login for unverified user', async () => {
    const user = await createTestUser({
      email: 'unverified@example.com',
      password: testPassword,
      isVerified: false,
    })

    const result = await loginService({
      email: user.email,
      password: testPassword,
    })

    expect(result).toBeDefined()
    expect(result.user.isVerified).toBe(false)
  })
})