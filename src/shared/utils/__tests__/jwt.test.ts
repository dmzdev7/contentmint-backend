import { it, expect, describe } from 'vitest'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../jwt.util.js'

describe('JWT Utils', () => {
  const mockPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: 'USER' as const,
  }

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(mockPayload)

      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT format: header.payload.signature
    })
    it('should include correct payload in token', () => {
      const token = generateAccessToken(mockPayload)
      const decoded = verifyAccessToken(token)

      expect(decoded.userId).toBe(mockPayload.userId)
      expect(decoded.email).toBe(mockPayload.email)
      expect(decoded.role).toBe(mockPayload.role)
    })
  })

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(mockPayload)

      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })
  })

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const token = generateAccessToken(mockPayload)
      const decoded = verifyAccessToken(token)

      expect(decoded).toBeTruthy()
      expect(decoded.userId).toBe(mockPayload.userId)
    })

    it('should throw error for invalid token', () => {
      expect(() => {
        verifyAccessToken('invalid-token')
      }).toThrow()
    })

    it('should throw error for refresh token used as access token', () => {
      const refreshToken = generateRefreshToken(mockPayload)

      expect(() => {
        verifyAccessToken(refreshToken)
      }).toThrow()
    })
  })

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const token = generateRefreshToken(mockPayload)
      const decoded = verifyRefreshToken(token)

      expect(decoded).toBeTruthy()
      expect(decoded.userId).toBe(mockPayload.userId)
    })

    it('should throw error for access token used as refresh token', () => {
      const accessToken = generateAccessToken(mockPayload)

      expect(() => {
        verifyRefreshToken(accessToken)
      }).toThrow()
    })
  })
})
