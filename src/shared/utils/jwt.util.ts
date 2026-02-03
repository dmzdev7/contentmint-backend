import jwt, { type Secret, type SignOptions } from 'jsonwebtoken'
import { config } from '@/infrastructure/config/index.js'
import { randomUUID } from 'crypto'

// Interfaz para el payload del token
export interface TokenPayload {
  userId: string
  email: string
  role: string
}

/**
 * Genera un Access Token (corta duración)
 * @param payload - Datos del usuario a incluir en el token
 * @returns Access Token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(
    {
      ...payload,
      jti: randomUUID(),
      type: 'access',
    } as object, // ✅ Cast del payload
    config.jwt.secret as Secret, // ✅ Cast del secret
    { expiresIn: config.jwt.accessExpiration || '15m' } as SignOptions, // ✅ Cast de opciones
  )
}

/**
 * Genera un Refresh Token (larga duración)
 * @param payload - Datos del usuario a incluir en el token
 * @returns Refresh Token
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(
    {
      ...payload,
      jti: randomUUID(), // ✅ ID único - esto hace que cada token sea diferente
      type: 'refresh',
    } as object, // ✅ Cast del payload
    config.jwt.refreshSecret as Secret, // ✅ Cast del secret
    { expiresIn: config.jwt.refreshExpiration || '7d' } as SignOptions, // ✅ Cast de opciones
  )
}

/**
 * Verifica y decodifica un Access Token
 * @param token - Token a verificar
 * @returns Payload decodificado
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.secret) as TokenPayload & {
    jti: string
    type: string
    iat: number
    exp: number
  }
}

/**
 * Verifica y decodifica un Refresh Token
 * @param token - Token a verificar
 * @returns Payload decodificado
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload & {
    jti: string
    type: string
    iat: number
    exp: number
  }
}
