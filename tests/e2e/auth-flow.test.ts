import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '@/app.js'
import {
  createVerificationToken,
  createPasswordResetToken,
} from '@tests/helpers/test-utils.js'
import prisma from '@/infrastructure/lib/prisma.js'

describe('Debug: E2E - Complete Auth Flow', () => {
  beforeEach(async () => {
    await prisma.refreshToken.deleteMany()
    await prisma.verificationToken.deleteMany()
    await prisma.passwordResetToken.deleteMany()
    await prisma.user.deleteMany()
  })

  it('Debug: should complete full registration and login flow', async () => {
    const userData = {
      name: 'E2E User',
      email: 'e2e@example.com',
      password: 'Password123!',
      passwordConfirm: 'Password123!',
    }

    // 1. Register
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(userData)

    expect(registerResponse.status).toBe(201)
    const userId = registerResponse.body.data.user.id

    // 2. Verify email
    const verificationToken = await createVerificationToken(userId)

    const verifyResponse = await request(app)
      .post(`/api/v1/auth/verify-email/${verificationToken}`)
      .send({ token: verificationToken })

    expect(verifyResponse.status).toBe(200)

    // 3. Login
    const loginResponse = await request(app).post('/api/v1/auth/login').send({
      email: userData.email,
      password: userData.password,
    })

    expect(loginResponse.status).toBe(200)
    expect(loginResponse.body.data.accessToken).toBeTruthy()

    const accessToken = loginResponse.body.data.accessToken

    // 4. Access protected route
    const profileResponse = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(profileResponse.status).toBe(200)
    expect(profileResponse.body.data.user.email).toBe(userData.email)
  })

  it('Debug: should complete password reset flow', async () => {
    // 1. Create user
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Reset User',
        email: 'reset@example.com',
        password: 'OldPassword123!',
        passwordConfirm: 'OldPassword123!',
      })

    const userId = registerResponse.body.data.user.id

    // 2. Request password reset
    const forgotResponse = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'reset@example.com' })

    expect(forgotResponse.status).toBe(200)

    // 3. Get reset token
    const resetToken = await createPasswordResetToken(userId)

    // 4. Reset password
    const resetResponse = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: resetToken,
        newPassword: 'NewPassword123!',
        newPasswordConfirm: 'NewPassword123!',
      })

    expect(resetResponse.status).toBe(200)

    // 5. Login with NEW password
    const loginResponse = await request(app).post('/api/v1/auth/login').send({
      email: 'reset@example.com',
      password: 'NewPassword123!',
    })

    expect(loginResponse.status).toBe(200)

    // 6. Login with OLD password should fail
    const oldLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'reset@example.com',
        password: 'OldPassword123!',
      })

    expect(oldLoginResponse.status).toBe(401)
  })

  it('Debug: verify token rotation', async () => {
    // Setup
    await request(app).post('/api/v1/auth/register').send({
      name: 'Debug User',
      email: 'debug@example.com',
      password: 'Password123!',
      passwordConfirm: 'Password123!',
    })

    const loginResponse = await request(app).post('/api/v1/auth/login').send({
      email: 'debug@example.com',
      password: 'Password123!',
    })

    const originalRefreshToken = loginResponse.body.data.refreshToken

    console.log(
      'Original refresh token:',
      originalRefreshToken.substring(0, 50) + '...',
    )

    // Refresh
    const refreshResponse = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: originalRefreshToken })

    const newRefreshToken = refreshResponse.body.data.refreshToken

    console.log('New refresh token:', newRefreshToken.substring(0, 50) + '...')
    console.log('Are they equal?', originalRefreshToken === newRefreshToken)
    console.log('Original length:', originalRefreshToken.length)
    console.log('New length:', newRefreshToken.length)

    // Verificar que son diferentes
    expect(newRefreshToken).not.toBe(originalRefreshToken)
  })
})