import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '@/app.js'
import prisma from '@/infrastructure/lib/prisma.js'

describe('Debug: POST /auth/register', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany()
  })

  it('Debug: should register a new user successfully', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
      passwordConfirm: 'Password123!',
    })

    expect(response.status).toBe(201)
    expect(response.body.status).toBe('success')
    expect(response.body.data.user).toBeDefined()
    expect(response.body.data.user.email).toBe('john@example.com')
    expect(response.body.data.user.name).toBe('John Doe')
    expect(response.body.data.user).not.toHaveProperty('password')
  })

  it('Debug: should return 409 if email already exists', async () => {
    const userData = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'Password123!',
      passwordConfirm: 'Password123!',
    }

    // Primer registro
    await request(app).post('/api/v1/auth/register').send(userData)

    // Segundo registro con mismo email
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(userData)

    expect(response.status).toBe(409)
    expect(response.body.status).toBe('error')
    expect(response.body.message).toContain('ya está registrado')
  })

  it('Debug: should return 400 for invalid email', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      name: 'Test User',
      email: 'invalid-email',
      password: 'Password123!',
      passwordConfirm: 'Password123!',
    })

    expect(response.status).toBe(400)
    expect(response.body.status).toBe('error')
  })

  it('Debug: should return 400 for weak password', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'weak',
      passwordConfirm: 'weak',
    })

    expect(response.status).toBe(400)
    expect(response.body.errors).toBeDefined()
  })

  it('Debug: should return 400 if passwords do not match', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      passwordConfirm: 'DifferentPassword123!',
    })

    expect(response.status).toBe(400)
    expect(response.body.errors).toBeDefined()
  })

  it('Debug: should return 400 for missing fields', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      name: 'Test User',
      // Missing email, password, passwordConfirm
    })

    expect(response.status).toBe(400)
  })

  it('Debug: should respect rate limiting', async () => {
    const userData = {
      name: 'Rate Limit Test',
      password: 'Password123!',
      passwordConfirm: 'Password123!',
    }

    // Hacer registros hasta superar el límite
    for (let i = 0; i < 11; i++) {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...userData,
          email: `test${i}@example.com`,
        })
    }

    // El siguiente registro debe ser bloqueado
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        ...userData,
        email: 'test_limit@example.com',
      })

    expect(response.status).toBe(429)
    expect(response.body.message).toContain('Demasiados intentos')
  })
})