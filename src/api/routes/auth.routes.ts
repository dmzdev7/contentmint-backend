import { Router } from 'express'
import * as AuthController from '../controllers/auth/auth.controller.js'
import { validate } from '../middlewares/validate.middleware.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import {
  authLimiter,
  emailLimiter,
  passwordResetLimiter,
  registerLimiter,
} from '@/infrastructure/config/rate-limit.config.js'
import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
  resendVerificationEmailSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@/shared/validators/auth.validator.js'

const router: Router = Router()

// El flujo es: Ruta -> Valida datos -> Controlador -> Servicio
// ========== RUTAS PÚBLICAS (sin autenticación) ==========

// Registro de usuario
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - passwordConfirm
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 20
 *                 example: Juan Pérez
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juan@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 pattern: ^(?=.*[0-9])(?=.*[!@#$%^&*])
 *                 example: Password123!
 *                 description: Debe contener al menos 8 caracteres, un número y un carácter especial
 *               passwordConfirm:
 *                 type: string
 *                 example: Password123!
 *                 description: Debe coincidir con password
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       409:
 *         description: El email ya está registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/register',
  registerLimiter,
  validate(registerSchema),
  AuthController.registerController,
)

// Inicio de sesión
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juan@example.com
 *               password:
 *                 type: string
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                       description: Token de acceso válido por 15 minutos
 *                     refreshToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                       description: Token de refresco válido por 7 días
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Usuario inactivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  AuthController.loginController,
)

// Refresh token
/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Renovar access token
 *     tags: [Authentication]
 *     description: Usa el refresh token para obtener un nuevo access token cuando expire
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Tokens renovados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     refreshToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                       description: Nuevo refresh token (rotación de tokens)
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Refresh token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  AuthController.refreshTokenController,
)

// Verificación de email
/**
 * @swagger
 * /auth/verify-email/{token}:
 *    post:
 *     summary: Verificar email
 *     tags: [Authentication]
 *     description: Verifica el email del usuario usando el token enviado en la URL
 *     parameters:
 *       - in: path
 *     name: token
 *     required: true
 *     schema:
 *       type: string
 *       description: El token hexadecimal de verificación
 *       example: a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4
 *     responses:
 *       200:
 *         description: Email verificado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Email verificado exitosamente
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/verify-email/:token',
  validate(verifyEmailSchema),
  AuthController.verifyEmailController,
)

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Solicitar reset de contraseña
 *     tags: [Authentication]
 *     description: Envía un email con un link para resetear la contraseña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juan@example.com
 *     responses:
 *       200:
 *         description: Email enviado (siempre retorna 200 por seguridad)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Si el email existe en nuestro sistema, recibirás un enlace para resetear tu contraseña.
 */
router.post(
  '/resend-verification',
  emailLimiter,
  validate(resendVerificationEmailSchema),
  AuthController.resendVerificationEmailController,
)

// Reset de contraseña
/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Solicitar reset de contraseña
 *     tags: [Authentication]
 *     description: Envía un email con un link para resetear la contraseña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juan@example.com
 *     responses:
 *       200:
 *         description: Email enviado (siempre retorna 200 por seguridad)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Si el email existe en nuestro sistema, recibirás un enlace para resetear tu contraseña.
 */
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  AuthController.forgotPasswordController,
)

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Resetear contraseña
 *     tags: [Authentication]
 *     description: Resetea la contraseña usando el token enviado por email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *               - newPasswordConfirm
 *             properties:
 *               token:
 *                 type: string
 *                 example: a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: NewPassword123!
 *               newPasswordConfirm:
 *                 type: string
 *                 example: NewPassword123!
 *     responses:
 *       200:
 *         description: Contraseña reseteada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Contraseña actualizada exitosamente. Por favor, inicia sesión con tu nueva contraseña.
 *       400:
 *         description: Token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  AuthController.resetPasswordController,
)

// ========== RUTAS PROTEGIDAS (requieren autenticación) ==========
// Cerrar sesión
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Sesión cerrada exitosamente
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Token no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/logout',
  authenticate, // 1. Verifica token
  validate(logoutSchema), // 2. Valida datos
  AuthController.logoutController, // 3. Ejecuta lógica
)

// Cerrar todas las sesiones
/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     summary: Cerrar todas las sesiones
 *     tags: [Authentication]
 *     description: Cierra todas las sesiones activas del usuario en todos los dispositivos
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Todas las sesiones cerradas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: 3 sesión(es) cerrada(s) exitosamente
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/logout-all',
  authenticate, // <==== Middleware de autenticación
  AuthController.logoutAllController,
)

export default router
