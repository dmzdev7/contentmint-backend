import swaggerJsdoc from 'swagger-jsdoc'
import { config } from './index.js'

// Definición de la especificación OpenAPI
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: `${config.appName} API`,
    version: '1.0.0',
    description: `
      API REST completa con autenticación JWT, verificación de email, 
      reset de contraseña y gestión de usuarios.
      
      ## Autenticación
      La mayoría de los endpoints requieren autenticación mediante JWT.
      Para autenticarte:
      1. Registra un usuario en \`/auth/register\`
      2. Inicia sesión en \`/auth/login\` para obtener un token
      3. Haz clic en el botón "Authorize" 🔒 arriba
      4. Ingresa: \`Bearer {tu_access_token}\`
      
      ## Rate Limiting
      Los endpoints tienen límites de peticiones para prevenir abuso.
      
      ## Errores
      La API retorna errores en formato JSON estándar:
      \`\`\`json
      {
        "status": "error",
        "message": "Descripción del error",
        "errors": [...]  // Solo para errores de validación
      }
      \`\`\`
    `,
    contact: {
      name: 'API Support',
      email: 'support@example.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: `${config.baseUrl}:${config.port}${config.apiPrefix}`,
      description: 'Servidor de desarrollo',
    },
    {
      url: `https://api.production.com${config.apiPrefix}`,
      description: 'Servidor de producción',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'Endpoints de autenticación y gestión de sesiones',
    },
    {
      name: 'Users',
      description: 'Endpoints de gestión de usuarios',
    },
    {
      name: 'Admin',
      description: 'Endpoints administrativos (requieren rol ADMIN)',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Ingresa el token JWT obtenido del login',
      },
    },
    schemas: {
      // Schemas reutilizables
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'usuario@example.com',
          },
          name: {
            type: 'string',
            example: 'Juan Pérez',
          },
          role: {
            type: 'string',
            enum: ['USER', 'ADMIN', 'MODERATOR'],
            example: 'USER',
          },
          isVerified: {
            type: 'boolean',
            example: false,
          },
          isActive: {
            type: 'boolean',
            example: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-21T10:30:00Z',
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'error',
          },
          message: {
            type: 'string',
            example: 'Descripción del error',
          },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'error',
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                path: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  example: ['body', 'email'],
                },
                message: {
                  type: 'string',
                  example: 'Email inválido',
                },
              },
            },
          },
        },
      },
    },
  },
}

// Opciones de configuración
const options: swaggerJsdoc.Options = {
  swaggerDefinition,
  // Rutas donde buscar anotaciones JSDoc
  apis: [
    './src/api/routes/*.ts',
    './src/api/controllers/**/*.ts',
    './src/api/shared/validators/*.ts',
  ],
}

// Generar la especificación
const swaggerSpec = swaggerJsdoc(options)

export default swaggerSpec
