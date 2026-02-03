import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import * as UserController from "../controllers/user/user.controller.js";
import { requireVerifiedEmail } from "../middlewares/verify-email.middleware.js";

const router: Router = Router();

// get perfil del usuario autenticado
/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
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
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/profile', authenticate, UserController.getProfileController);

// En user.routes.ts
router.post(
  '/premium-action',
  authenticate,
  requireVerifiedEmail,
  (_req, res) => {
    res.json({
      status: 'success',
      message: '¡Acción premium ejecutada! Solo usuarios verificados.',
    })
  },
)

export default router;