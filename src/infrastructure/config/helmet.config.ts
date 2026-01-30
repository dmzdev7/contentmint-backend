import helmet from 'helmet'

/**
 * Configuración de Helmet para headers de seguridad
 */
export const helmetConfig = helmet({
  // Content Security Policy - Previene XSS
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], 
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },

  // Cross-Origin-Embedder-Policy
  crossOriginEmbedderPolicy: false, 

  // Cross-Origin-Opener-Policy
  crossOriginOpenerPolicy: { policy: 'same-origin' },

  // Cross-Origin-Resource-Policy
  crossOriginResourcePolicy: { policy: 'cross-origin' },

  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },

  // Frameguard - Previene clickjacking (Reemplaza a xFrameOptions)
  frameguard: { action: 'deny' },

  // HSTS
  hsts: {
    maxAge: 31536000, 
    includeSubDomains: true,
    preload: true,
  },

  // IE No Open (Reemplaza a xDownloadOptions)
  ieNoOpen: true,

  // No Sniff (Reemplaza a xContentTypeOptions)
  noSniff: true,

  // Origin Agent Cluster
  originAgentCluster: true,

  // Permitted Cross-Domain Policies (Reemplaza a xPermittedCrossDomainPolicies)
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },

  // Referrer Policy
  referrerPolicy: { policy: 'no-referrer' },

  // XSS Protection (Habilitar/Deshabilitar según necesidad, Helmet lo pone por defecto)
  xssFilter: true,
})