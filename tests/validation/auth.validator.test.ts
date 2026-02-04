import { describe, it, expect } from 'vitest'
import {
  registerSchema,
  loginSchema,
} from '@/shared/validators/auth.validator.js'
// 1. Importas el helper centralizado
import { getZodErrorMessages } from '@tests/helpers/validator-utils.js'

describe('Debug: Auth Validators', () => {
  describe('Debug: registerSchema', () => {
    // 2. YA NO necesitas la función local aquí.

    it('Debug: should validate correct registration data', () => {
      const validData = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
          passwordConfirm: 'Password123!',
        },
      }
      const result = registerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('Debug: should reject invalid email', () => {
      const result = registerSchema.safeParse({
        body: {
          name: 'John',
          email: 'no-es-email',
          password: 'Password123!',
          passwordConfirm: 'Password123!',
        },
      })
      expect(result.success).toBe(false)
      // 3. Usas la función importada
      expect(getZodErrorMessages(result)).toContain('Email inválido')
    })

    it('Debug: should reject password without number', () => {
      const result = registerSchema.safeParse({
        body: {
          name: 'John',
          email: 'a@a.com',
          password: 'NoNumber!',
          passwordConfirm: 'NoNumber!',
        },
      })
      expect(result.success).toBe(false)
      expect(getZodErrorMessages(result)).toContain('al menos un número')
    })

    it('Debug: should reject password without special character', () => {
      const result = registerSchema.safeParse({
        body: {
          name: 'John',
          email: 'a@a.com',
          password: 'Password123',
          passwordConfirm: 'Password123',
        },
      })
      expect(result.success).toBe(false)
      expect(getZodErrorMessages(result)).toContain('carácter especial')
    })

    it('Debug: should reject mismatched passwords', () => {
      const result = registerSchema.safeParse({
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
          passwordConfirm: 'Mismatch123!',
        },
      })
      expect(result.success).toBe(false)
      expect(getZodErrorMessages(result)).toContain(
        'Las contraseñas no coinciden',
      )
    })

    it('Debug: should reject name shorter than 2 characters', () => {
      const result = registerSchema.safeParse({
        body: {
          name: 'J',
          email: 'a@a.com',
          password: 'Password123!',
          passwordConfirm: 'Password123!',
        },
      })
      expect(result.success).toBe(false)
      expect(getZodErrorMessages(result)).toContain('al menos 2 caracteres')
    })
  })

  describe('Debug: loginSchema', () => {
    it('Debug: should validate correct login data', () => {
      const result = loginSchema.safeParse({
        body: { email: 'john@example.com', password: 'anypassword' },
      })
      expect(result.success).toBe(true)
    })

    it('Debug: should reject missing password', () => {
      const result = loginSchema.safeParse({
        body: {
          email: 'john@example.com',
          password: '',
        },
      })
      expect(result.success).toBe(false)
      expect(getZodErrorMessages(result)).toContain(
        'La contraseña es requerida',
      )
    })
  })
})