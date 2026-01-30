import { Router, type Request, type Response } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { authorize } from '../middlewares/authorize.middleware.js'
import { config } from '@/infrastructure/config/index.js'
import { cleanupAllExpiredTokens } from '@/infrastructure/jobs/cleanup-tokens.job.js'

const router: Router = Router()

// Solo en desarrollo y solo para ADMIN
if (config.env === 'development') {
  router.post(
    '/cleanup-tokens',
    authenticate,
    authorize('ADMIN'),
    async (_req: Request, res: Response) => {
      try {
        await cleanupAllExpiredTokens()
        res.json({
          status: 'success',
          message: 'Limpieza de tokens ejecutada',
        })
      } catch (error) {
        res.status(500).json({
          status: 'error',
          message: 'Error en limpieza',
        })
      }
    },
  )
}

export default router
