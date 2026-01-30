import jwt from 'jsonwebtoken'
import { config } from '@/infrastructure/config/index.js'

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
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: '15m', // 15 minutos
  })
}

/**
 * Genera un Refresh Token (larga duración)
 * @param payload - Datos del usuario a incluir en el token
 * @returns Refresh Token
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: '7d', // 7 días
  })
}

/**
 * Verifica y decodifica un Access Token
 * @param token - Token a verificar
 * @returns Payload decodificado
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.secret) as TokenPayload
}

/**
 * Verifica y decodifica un Refresh Token
 * @param token - Token a verificar
 * @returns Payload decodificado
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload
}
