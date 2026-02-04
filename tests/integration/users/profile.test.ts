import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '@/app.js'
import prisma from '@/infrastructure/lib/prisma.js'
import { createAuthenticatedUser } from 'tests/helpers/test-utils.js'

describe('Debug: GET /users/profile', () => {
  beforeEach(async () => {
    await prisma.refreshToken.deleteMany()
    await prisma.user.deleteMany()
  })

  it('Debug: should return user profile with valid token', async () => {
    const { user, accessToken } = await createAuthenticatedUser()

    const response = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('success')
    expect(response.body.data.user).toBeDefined()
    expect(response.body.data.user.id).toBe(user.id)
    expect(response.body.data.user.email).toBe(user.email)
  })

  it('Debug: should return 401 without token', async () => {
    const response = await request(app).get('/api/v1/users/profile')

    expect(response.status).toBe(401)
    expect(response.body.status).toBe('error')
    // Cambiado: usar 'message' en lugar de 'error'
    expect(response.body.message).toBeDefined()
    expect(response.body.message).toContain('Token no proporcionado')
  })

  it('Debug: should return 401 with invalid token', async () => {
    const response = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', 'Bearer invalid-token')

    expect(response.status).toBe(401)
    expect(response.body.status).toBe('error')
    // Puede ser cualquier mensaje de token inválido
    expect(response.body.message).toBeDefined()
  })

  it('Debug: should return 401 with malformed authorization header', async () => {
    const response = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', 'InvalidFormat token')

    expect(response.status).toBe(401)
    expect(response.body.status).toBe('error')
    // Cambiado: usar 'message' en lugar de 'error'
    expect(response.body.message).toBeDefined()
    expect(response.body.message).toContain('Formato de token inválido')
  })
})