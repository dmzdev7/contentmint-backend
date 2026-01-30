import { config } from '@/infrastructure/config/index.js'
import { Router } from 'express'
import type { Request, Response } from 'express'

const router: Router = Router()

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [System]
 *     description: Verifica que el servidor esté funcionando
 *     responses:
 *       200:
 *         description: Servidor funcionando correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Tiempo activo en segundos
 *                 security:
 *                   type: object
 *                   properties:
 *                     cors:
 *                       type: boolean
 *                     helmet:
 *                       type: boolean
 *                     rateLimit:
 *                       type: boolean
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    environment: config.env, // Para saber si estás en prod o dev rápidamente
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    security: {
      cors: config.env === 'production' ? 'strict' : 'permissive',
      helmet: 'enabled',
      rateLimit: 'active',
    },
  })
})

export default router
