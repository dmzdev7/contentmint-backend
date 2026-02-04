import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '@/app.js'
import prisma from '@/infrastructure/lib/prisma.js'

describe('Debug: Security - Rate Limiting', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany()
  })

  it('Debug: should enforce login rate limit', async () => {
    const credentials = {
      email: 'test@example.com',
      password: 'wrongpassword',
    }

    // Hacer intentos hasta alcanzar el límite
    for (let i = 0; i < 10; i++) {
      await request(app).post('/api/v1/auth/login').send(credentials)
    }

    // El siguiente intento debe ser bloqueado
    const response = await request(app).post('/api/v1/auth/login').send(credentials)

    expect(response.status).toBe(429)
    expect(response.headers['ratelimit-limit']).toBe('10')
    expect(response.headers['ratelimit-remaining']).toBe('0')
  })

  it('Debug: should enforce registration rate limit', async () => {
    // Hacer registros hasta superar el límite
    for (let i = 0; i < 11; i++) {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: `User ${i}`,
          email: `user${i}@example.com`,
          password: 'Password123!',
          passwordConfirm: 'Password123!',
        })
    }

    // El siguiente registro debe ser bloqueado
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'User 11',
        email: 'user11@example.com',
        password: 'Password123!',
        passwordConfirm: 'Password123!',
      })

    expect(response.status).toBe(429)
  })

  it('Debug: should include rate limit headers', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password',
      })

    expect(response.headers).toHaveProperty('ratelimit-limit')
    expect(response.headers).toHaveProperty('ratelimit-remaining')
    expect(response.headers).toHaveProperty('ratelimit-reset')
  })
})