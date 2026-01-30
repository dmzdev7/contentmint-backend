import type { NextFunction, Request, Response } from 'express'
import { ZodError, type ZodType } from 'zod'

export const validate = (schema: ZodType) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })
      // Llamamos a next() sin return
      next()
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        res.status(400).json({
          status: 'error',
          errors: error.issues.map((e) => ({
            path: e.path,
            message: e.message,
          })),
        })
        return
      }

      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      })
    }
  }
}
