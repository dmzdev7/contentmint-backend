import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '@/app.js'
import prisma from '@/infrastructure/lib/prisma.js'
import { createTestUser } from 'tests/helpers/test-utils.js'

describe('Debug: POST /auth/login', () => {
  const testPassword = 'Password123!'

  beforeEach(async () => {
    await prisma.refreshToken.deleteMany()
    await prisma.user.deleteMany()
  })

  it('Debug: should login successfully with valid credentials', async () => {
    const user = await createTestUser({
      email: 'login@example.com',
      password: testPassword,
    })

    const response = await request(app).post('/api/v1/auth/login').send({
      email: user.email,
      password: testPassword,
    })

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('success')
    expect(response.body.data.accessToken).toBeTruthy()
    expect(response.body.data.refreshToken).toBeTruthy()
    expect(response.body.data.user).toBeDefined()
    expect(response.body.data.user.email).toBe(user.email)
  })

  it('Debug: should return 401 for invalid email', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'nonexistent@example.com',
      password: testPassword,
    })

    expect(response.status).toBe(401)
    expect(response.body.status).toBe('error')
    expect(response.body.message).toContain('inválidos')
  })

  it('Debug: should return 401 for invalid password', async () => {
    const user = await createTestUser({
      email: 'test@example.com',
      password: testPassword,
    })

    const response = await request(app).post('/api/v1/auth/login').send({
      email: user.email,
      password: 'WrongPassword123!',
    })

    expect(response.status).toBe(401)
    expect(response.body.message).toContain('inválidos')
  })

  it('Debug: should return 403 for inactive user', async () => {
    const user = await createTestUser({
      email: 'inactive@example.com',
      password: testPassword,
      isActive: false,
    })

    const response = await request(app).post('/api/v1/auth/login').send({
      email: user.email,
      password: testPassword,
    })

    expect(response.status).toBe(403)
    expect(response.body.message).toContain('inactiva')
  })

  it('Debug: should create refresh token in database', async () => {
    const user = await createTestUser({
      email: 'refresh@example.com',
      password: testPassword,
    })

    const response = await request(app).post('/api/v1/auth/login').send({
      email: user.email,
      password: testPassword,
    })

    // --- AGREGA ESTO PARA DEBUGUEAR ---
    if (response.status !== 200) {
      console.log('Debug: Error Body:', response.body)
    }
    expect(response.status).toBe(200)
    // ----------------------------------

    const tokenInDb = await prisma.refreshToken.findFirst({
      where: { userId: user.id },
    })

    expect(tokenInDb).toBeDefined()
    expect(tokenInDb?.token).toBe(response.body.data.refreshToken)
  })

  it('Debug: should respect rate limiting after 5 failed attempts', async () => {
    const user = await createTestUser({
      email: 'ratelimit@example.com',
      password: testPassword,
    })

    // 5 intentos fallidos
    for (let i = 0; i < 10; i++) {
      await request(app).post('/api/v1/auth/login').send({
        email: user.email,
        password: 'WrongPassword123!',
      })
    }

    // Sexto intento debe ser bloqueado
    const response = await request(app).post('/api/v1/auth/login').send({
      email: user.email,
      password: 'WrongPassword123!',
    })

    expect(response.status).toBe(429)
    expect(response.body.message).toContain('Demasiados intentos')
  })
})