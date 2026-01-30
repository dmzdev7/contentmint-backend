import express, { type Application } from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import { helmetConfig } from './infrastructure/config/helmet.config.js'
import { config } from './infrastructure/config/index.js'
import {
  corsDevOptions,
  corsOptions,
} from './infrastructure/config/cors.config.js'
import { httpLogger } from './api/middlewares/logger.middleware.js'
import { apiLimiter } from './infrastructure/config/rate-limit.config.js'
import swaggerSpec from './infrastructure/config/swagger.config.js'
import authRoutes from './api/routes/auth.routes.js'
import userRoutes from './api/routes/user.routes.js'
import adminRoutes from './api/routes/admin.routes.js'
import healthRoutes from './api/routes/health.routes.js'

// Crear la aplicación Express
const app: Application = express()

// ========== SECURITY MIDDLEWARE (orden importante) ==========
// 1. Helmet - Headers de seguridad
app.use(helmetConfig)

// 2. CORS - Control de orígenes
const corsConfig = config.env === 'production' ? corsOptions : corsDevOptions
app.use(cors(corsConfig))

// 3. Body parser
app.use(express.json())

// 4. Logger
app.use(httpLogger)

// ========== PUBLIC / SYSTEM ROUTES ==========
// Las ponemos antes del Rate Limiting global para evitar bloqueos a monitores
app.use('/health', healthRoutes)

// 5. Rate limiting
// Aplicar a todas las rutas (excepto /api-docs)
app.use('/api', apiLimiter)

// ========== SWAGGER DOCUMENTATION ==========
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: `${config.appName} API Docs`,
  }),
)

// Endpoint para obtener la especificación en JSON
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

// ========== ROUTES ==========
// ENDPOINT: GET / HTTP method && route (or path)
// The methods are: GET, POST, PUT, DELETE, PATCH, etc.
// The route is the path after the domain, e.g., /api/v1/users

// Auth routes
app.use(`${config.apiPrefix}/auth`, authRoutes)

// User routes
app.use(`${config.apiPrefix}/users`, userRoutes)

// Solo en desarrollo
if (config.env === 'development')
  app.use(`${config.apiPrefix}/admin`, adminRoutes)

export default app
