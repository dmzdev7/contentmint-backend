import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '@/app.js'
import prisma from '@/infrastructure/lib/prisma.js'
import { createTestUser, generateTestToken } from 'tests/helpers/test-utils.js'

describe('Debug: Security - Authentication', () => {
  beforeEach(async () => {
    await prisma.refreshToken.deleteMany()
    await prisma.user.deleteMany()
  })

  it('Debug: should not accept tokens with invalid signature', async () => {
    const user = await createTestUser()
    const { accessToken } = generateTestToken(user)

    // Modificar el token (cambiar firma)
    const parts = accessToken.split('.')
    const tamperedToken = `${parts[0]}.${parts[1]}.invalidsignature`

    const response = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${tamperedToken}`)

    expect(response.status).toBe(401)
  })

  it('Debug: should not accept tokens with modified payload', async () => {
    const user = await createTestUser({ role: 'USER' })
    const { accessToken } = generateTestToken(user)

    // 1. Añadimos una validación o aseguramos que parts[1] existe
    const parts = accessToken.split('.')
    if (parts.length !== 3) throw new Error('Token malformado')

    // 2. Usamos el valor asegurado (parts[1]!)
    const payload = JSON.parse(Buffer.from(parts[1]!, 'base64').toString())

    // Modificar payload (cambiar role a ADMIN)
    payload.role = 'ADMIN'

    // 3. Volvemos a codificar el payload modificado
    const tamperedPayload = Buffer.from(JSON.stringify(payload)).toString(
      'base64',
    )
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`

    const response = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${tamperedToken}`)

    expect(response.status).toBe(401)
  })

  it('Debug: should prevent SQL injection in login', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      email: "admin@example.com' OR '1'='1",
      password: "password' OR '1'='1",
    })

    expect(response.status).toBe(400)
    expect(response.body.status).toBe('error')
    // Verificamos que el error menciona el email inválido
    const errorMsg = JSON.stringify(response.body)
    expect(errorMsg).toContain('Email inválido')
  })

  it('Debug: should sanitize user input', async () => {
    const maliciousName = '<script>alert("XSS")</script>Goku'

    const response = await request(app).post('/api/v1/auth/register').send({
      name: maliciousName,
      email: 'test_xss@example.com',
      password: 'Password123!',
      passwordConfirm: 'Password123!',
    })

    // Verificamos que el servidor rechaza la petición
    expect(response.status).toBe(400)

    // Verificamos que NO se creó el usuario en la DB
    const user = await prisma.user.findUnique({
      where: { email: 'test_xss@example.com' },
    })
    expect(user).toBeNull()
  })

  it('Debug: should enforce password complexity', async () => {
    const weakPasswords = [
      '12345678',
      'password',
      'abcdefgh',
      'Password',
      'Pass123',
    ]

    for (const password of weakPasswords) {
      const response = await request(app).post('/api/v1/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password,
        passwordConfirm: password,
      })

      expect(response.status).toBe(400)
    }
  })
})
