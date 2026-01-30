import type z from 'zod'
import type {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@/shared/validators/auth.validator.js'

// DTO para el registro de usuarios - extraemos solo el body
export type RegisterDTO = z.infer<typeof registerSchema>['body']

// DTO para el inicio de sesión de usuarios - extraemos solo el body
export type LoginDTO = z.infer<typeof loginSchema>['body']

// DTOs para reset de contraseña
export type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema>['body']
export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>['body']
