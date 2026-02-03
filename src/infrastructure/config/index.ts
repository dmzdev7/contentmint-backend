import dotenv from 'dotenv'
import path from 'path'
import z from 'zod'

dotenv.config()

// Determinamos qué archivo específico cargar
const envFile = process.env.NODE_ENV === 'test' 
  ? '.env.test' 
  : '.env.development'


dotenv.config({
  path: path.resolve(process.cwd(), envFile),
  override: true,
})

// 1. Esquema de validación con Zod
const envSchema = z.object({
  APP_NAME: z.string().default('ContentMint'),
  PORT: z.string().default('4000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BASE_URL: z.string().url().default('http://localhost'),
  API_PREFIX: z.string().default('/api/v1'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  
  // Resend
  RESEND_API_KEY: z.string().min(1),
  APP_EMAIL: z.string().email().default('onboarding@resend.dev'),

  // Database
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),

  // --- NUEVOS CAMPOS ---
  // Transformamos el string separado por comas en un Array de URLs
  ALLOWED_ORIGINS: z.string()
    .default('http://localhost:3000,http://localhost:5173')
    .transform((val) => val.split(',').map(url => url.trim())),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
})

// 2. Validación
let envServer: z.infer<typeof envSchema>

try {
  envServer = envSchema.parse(process.env)
} catch (error) {
  if (error instanceof z.z.ZodError) {
    console.error('❌ Error: Variables de entorno inválidas:', JSON.stringify(error.flatten().fieldErrors, null, 2))
  }
  process.exit(1)
}

// 3. Exportar configuración limpia
export const config = {
  appName: envServer.APP_NAME,
  port: envServer.PORT,
  env: envServer.NODE_ENV,
  baseUrl: envServer.BASE_URL,
  apiPrefix: envServer.API_PREFIX,
  frontendUrl: envServer.FRONTEND_URL,
  allowedOrigins: envServer.ALLOWED_ORIGINS,
  
  resend: {
    apiKey: envServer.RESEND_API_KEY,
  },
  email: {
    from: envServer.APP_EMAIL,
  },
  db: {
    url: envServer.DATABASE_URL,
  },
  jwt: {
    secret: envServer.JWT_ACCESS_SECRET,
    refreshSecret: envServer.JWT_REFRESH_SECRET,
    accessExpiration: envServer.JWT_ACCESS_EXPIRATION,
    refreshExpiration: envServer.JWT_REFRESH_EXPIRATION,
  },
  rateLimit: {
    windowMs: envServer.RATE_LIMIT_WINDOW_MS,
    max: envServer.RATE_LIMIT_MAX_REQUESTS,
  }
} as const

export type AppConfig = typeof config