import { beforeEach, it, expect, describe, vi } from 'vitest'
import * as emailUtils from '@/shared/utils/email.utils.js'
import { registerService } from '../register.service.js'
import prisma from '@/infrastructure/lib/prisma.js'

// Mock del envío de emails
vi.mock('@/shared/utils/email.utils.js', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue({ id: 'mock-email-id' }),
}))

describe('Auth Service - Register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should register a new user successfully', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
      passwordConfirm: 'Password123!',
    }

    const user = await registerService(userData)

    expect(user).toBeDefined()
    expect(user.email).toBe(userData.email)
    expect(user.name).toBe(userData.name)
    expect(user).not.toHaveProperty('password') // Password no debe retornarse
    expect(user.isVerified).toBe(false)
  })

  it('should hash the password', async () => {
    const userData = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'Password123!',
      passwordConfirm: 'Password123!',
    }

    await registerService(userData)

    const userInDb = await prisma.user.findUnique({
      where: { email: userData.email },
    })

    expect(userInDb?.password).toBeDefined()
    expect(userInDb?.password).not.toBe(userData.password) // Debe estar hasheada
    expect(userInDb?.password).toMatch(/^\$2[aby]\$/) // bcrypt hash format
  })

  it('should create a verification token', async () => {
    const userData = {
      name: 'Alice',
      email: 'alice@example.com',
      password: 'Password123!',
      passwordConfirm: 'Password123!',
    }

    const user = await registerService(userData)

    const token = await prisma.verificationToken.findFirst({
      where: { userId: user.id },
    })

    expect(token).toBeDefined()
    expect(token?.userId).toBe(user.id)
    expect(token?.expiresAt).toBeInstanceOf(Date)
    expect(token?.expiresAt.getTime()).toBeGreaterThan(Date.now())
  })

  it('should send verification email', async () => {
    const userData = {
      name: 'Bob',
      email: 'bob@example.com',
      password: 'Password123!',
      passwordConfirm: 'Password123!',
    }

    await registerService(userData)

    expect(emailUtils.sendVerificationEmail).toHaveBeenCalledTimes(1)
    expect(emailUtils.sendVerificationEmail).toHaveBeenCalledWith(
      userData.email,
      expect.any(String), // token
      userData.name,
    )
  })

  it('should throw error if email already exists', async () => {
    const userData = {
      name: 'Duplicate',
      email: 'duplicate@example.com',
      password: 'Password123!',
      passwordConfirm: 'Password123!',
    }

    // Crear primer usuario
    await registerService(userData)

    // Intentar crear segundo usuario con mismo email
    await expect(registerService(userData)).rejects.toThrow(
      'EMAIL_ALREADY_EXISTS',
    )
  })

  it('should continue even if email sending fails', async () => {
    // Mock para que el email falle
    vi.mocked(emailUtils.sendVerificationEmail).mockRejectedValueOnce(
      new Error('Email service down'),
    )

    const userData = {
      name: 'Test',
      email: 'test@example.com',
      password: 'Password123!',
      passwordConfirm: 'Password123!',
    }

    // No debe lanzar error
    const user = await registerService(userData)

    expect(user).toBeDefined()
    expect(user.email).toBe(userData.email)
  })
})
