import z from 'zod'

// Definimos una regex para los requisitos de seguridad
// (?=.*[0-9]) -> Al menos un número
// (?=.*[!@#$%^&*(),.?":{}|<>]) -> Al menos un caracter especial
const passwordValidation = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
  .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
  .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
  .regex(
    /[!@#$%^&*(),.?":{}|<>]/,
    'La contraseña debe contener al menos un carácter especial',
  )

// Schema para registro
export const registerSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(20, 'El nombre no puede exceder 20 caracteres'),
      email: z.string().email('Email inválido'),
      password: passwordValidation,
      passwordConfirm: passwordValidation,
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: 'Las contraseñas no coinciden',
      path: ['passwordConfirm'],
    }),
})

// Schema para login
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'La contraseña es requerida'),
  }),
})

// Schema para logout
export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token es requerido'),
  }),
})

// Schema para refresh token
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token es requerido'),
  }),
})

// Schema para verificar email
export const verifyEmailSchema = z.object({
  params: z.object({
    token: z.string().min(1, 'Token de verificación es requerido'),
  }),
})

// Schema para reenviar email de verificación
export const resendVerificationEmailSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
  }),
})

// Schema para solicitar reset de contraseña
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
  }),
})

// Schema para resetear contraseña
export const resetPasswordSchema = z.object({
  body: z
    .object({
      token: z.string().min(1, 'Token es requerido'),
      newPassword: passwordValidation,
      newPasswordConfirm: z.string(),
    })
    .refine((data) => data.newPassword === data.newPasswordConfirm, {
      message: 'Las contraseñas no coinciden',
      path: ['newPasswordConfirm'],
    }),
})
