import type { Request, Response } from 'express'
import * as RegisterService from '@/core/auth/register.service.js'
import * as LoginService from '@/core/auth/login.service.js'
import * as LogoutService from '@/core/auth/logout.service.js'
import * as RefreshService from '@/core/auth/refresh.service.js'
import * as EmailService from '@/core/auth/verify-email.service.js'
import * as PasswordResetService from '@/core/auth/password-reset.service.js'

/**
 * Controlador para registrar un nuevo usuario
 */
export const registerController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const newUser = await RegisterService.registerService(req.body)
    res.status(201).json({
      status: 'success',
      data: { user: newUser },
    })
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Errores de negocio conocidos
      if (error.message === 'EMAIL_ALREADY_EXISTS') {
        res.status(409).json({
          status: 'error',
          message: 'El email ya está registrado',
        })
        return
      }
    }

    // Error no controlado
    console.error('Error no controlado:', error)
    res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor',
    })
  }
}

/**
 * Controlador para iniciar sesión
 */
export const loginController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await LoginService.loginService(req.body)

    res.status(200).json({
      status: 'success',
      data: result,
    })
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Manejo de errores especificos
      if (error.message === 'INVALID_CREDENTIALS') {
        res.status(401).json({
          status: 'error',
          message: 'Email o contraseña inválidos',
        })
        return
      }

      if (error.message === 'USER_INACTIVE') {
        res.status(403).json({
          status: 'error',
          message: 'Tu cuenta está inactiva. Contacta al soporte.',
        })
        return
      }

      if (error.message === 'EMAIL_NOT_VERIFIED') {
        res.status(403).json({
          status: 'error',
          message:
            'Tu email no ha sido verificado. Revisa tu bandeja de entrada.',
        })
        return
      }
    }

    // Error no controlado
    console.error('Error no controlado:', error)
    res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor',
    })
  }
}

/**
 * Controlador para cerrar sesión
 */
export const logoutController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { refreshToken } = req.body
    const userId = req.user?.userId

    if (!refreshToken) {
      res.status(400).json({
        status: 'error',
        message: 'El refresh token es requerido',
      })
      return
    }

    const result = await LogoutService.logoutService(refreshToken, userId)

    res.status(200).json({
      status: 'success',
      data: result,
    })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'INVALID_TOKEN') {
        res.status(404).json({
          status: 'error',
          message: 'Se ha cerrado la sesión',
        })
        return
      }

      if (error.message === 'UNAUTHORIZED') {
        res.status(403).json({
          status: 'error',
          message: 'No tienes permiso para cerrar esta sesión',
        })
        return
      }

      console.error('Error no controlado en logout:', error)
      res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor',
      })
    }
  }
}

/**
 * Controlador para cerrar sesión en todos los dispositivos
 */
export const logoutAllController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'No estás autenticado',
      })
      return
    }

    const userId = req.user!.userId
    const result = await LogoutService.logoutAllService(userId)

    res.status(200).json({
      status: 'success',
      data: result,
    })
  } catch (error: unknown) {
    console.error('Error no controlado en logoutAll:', error)
    res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor',
    })
  }
}

/**
 * Controlador para renovar el access token
 */
export const refreshTokenController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { refreshToken } = req.body

    // Validar que el refresh token esté presente
    if (!refreshToken) {
      res.status(400).json({
        status: 'error',
        message: 'El refresh token es requerido',
      })
      return
    }

    const result = await RefreshService.refreshTokenService(refreshToken)

    res.status(200).json({
      status: 'success',
      data: result,
    })
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Token JWT inválido o expirado
      if (error.message === 'INVALID_REFRESH_TOKEN') {
        res.status(401).json({
          status: 'error',
          message: 'Refresh token inválido o expirado',
        })
        return
      }

      // Token no encontrado en la base de datos
      if (error.message === 'REFRESH_TOKEN_NOT_FOUND') {
        res.status(404).json({
          status: 'error',
          message: 'Refresh token no encontrado. Inicia sesión nuevamente.',
        })
        return
      }

      // Token expirado
      if (error.message === 'REFRESH_TOKEN_EXPIRED') {
        res.status(401).json({
          status: 'error',
          message: 'El refresh token ha expirado. Inicia sesión nuevamente.',
        })
        return
      }

      // Token reutilizado (posible robo)
      if (error.message === 'TOKEN_REUSE_DETECTED') {
        res.status(401).json({
          status: 'error',
          message:
            'Actividad sospechosa detectada. Todas tus sesiones han sido cerradas por seguridad. Por favor, inicia sesión nuevamente.',
        })
        return
      }

      // Usuario inactivo
      if (error.message === 'USER_INACTIVE') {
        res.status(403).json({
          status: 'error',
          message: 'Tu cuenta ha sido desactivada. Contacta al administrador.',
        })
        return
      }
    }

    console.error('Error no controlado en refreshToken:', error)
    res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor',
    })
  }
}

/**
 * Controlador para verificar email
 */
export const verifyEmailController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { token } = req.params

    // Validar que el token esté presente Y que sea un string
    if (!token || typeof token !== 'string') {
      res.status(400).json({
        status: 'error',
        message: 'El token de verificación es inválido o no fue proporcionado',
      })
      return
    }

    const result = await EmailService.verifyEmailService(token)

    res.status(200).json({
      status: 'success',
      data: result,
    })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'INVALID_VERIFICATION_TOKEN') {
        res.status(400).json({
          status: 'error',
          message: 'Token de verificación inválido o expirado',
        })
        return
      }

      if (error.message === 'VERIFICATION_TOKEN_EXPIRED') {
        res.status(400).json({
          status: 'error',
          message:
            'El token de verificación ha expirado. Por favor, solicita uno nuevo.',
        })
        return
      }

      if (error.message === 'EMAIL_ALREADY_VERIFIED') {
        res.status(400).json({
          status: 'error',
          message: 'Tu email ya está verificado.',
        })
        return
      }
    }

    console.error('Error no controlado en verifyEmail:', error)
    res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor',
    })
  }
}

/**
 * Controlador para reenviar email de verificación
 */
export const resendVerificationEmailController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body

    if (!email) {
      res.status(400).json({
        status: 'error',
        message: 'El email es requerido',
      })
      return
    }

    const result = await EmailService.resendVerificationEmailService(email)

    res.status(200).json({
      status: 'success',
      data: result,
    })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'USER_NOT_FOUND') {
        res.status(404).json({
          status: 'error',
          message: 'No se encontró un usuario con ese email',
        })
        return
      }
      if (error.message === 'EMAIL_ALREADY_VERIFIED') {
        res.status(400).json({
          status: 'error',
          message: 'Tu email ya está verificado.',
        })
        return
      }

      console.error('Error no controlado en resendVerificationEmail:', error)
      res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor',
      })
    }
  }
}

/**
 * Controlador para solicitar reset de contraseña
 */
export const forgotPasswordController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body

    if (!email) {
      res.status(400).json({
        status: 'error',
        message: 'Email es requerido',
      })
      return
    }

    const result = await PasswordResetService.forgotPasswordService(email)

    res.status(200).json({
      status: 'success',
      data: result,
    })
  } catch (error: unknown) {
    console.error('Error no controlado en forgot password:', error)
    res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor',
    })
  }
}

/**
 * Controlador para resetear contraseña
 */
export const resetPasswordController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { token, newPassword } = req.body

    if (!token) {
      res.status(400).json({
        status: 'error',
        message: 'Token es requerido',
      })
      return
    }

    if (!newPassword) {
      res.status(400).json({
        status: 'error',
        message: 'Nueva contraseña es requerida',
      })
      return
    }

    const result = await PasswordResetService.resetPasswordService(
      token,
      newPassword,
    )

    res.status(200).json({
      status: 'success',
      data: result,
    })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'INVALID_RESET_TOKEN') {
        res.status(400).json({
          status: 'error',
          message: 'Token de reset inválido o ya usado',
        })
        return
      }

      if (error.message === 'RESET_TOKEN_EXPIRED') {
        res.status(400).json({
          status: 'error',
          message:
            'El token de reset ha expirado. Por favor, solicita uno nuevo.',
        })
        return
      }

      if (error.message === 'USER_INACTIVE') {
        res.status(403).json({
          status: 'error',
          message: 'Tu cuenta ha sido desactivada. Contacta al administrador.',
        })
        return
      }
    }

    console.error('Error no controlado en reset password:', error)
    res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor',
    })
  }
}
