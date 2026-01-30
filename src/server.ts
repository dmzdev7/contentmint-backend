import cron from 'node-cron'
import app from './app.js'
import { config } from './infrastructure/config/index.js'
import { cleanupAllExpiredTokens } from './infrastructure/jobs/cleanup-tokens.job.js'

// Inicia el servidor
app.listen(config.port, () => {
  console.log(`
    🚀 Servidor corriendo en el puerto: ${config.port}!
    📝 Ambiente: ${config.env}
    🔗 URL: ${config.baseUrl}:${config.port}
    `)
})

// ========== CONFIGURAR CRON JOBS ==========
// Ejecutar limpieza de tokens cada día a las 3:00 AM
cron.schedule('0 3 * * *', () => {
  console.log('⏰ Ejecutando limpieza programada de tokens...')
  cleanupAllExpiredTokens()
})

// También ejecutar al iniciar el servidor
console.log('🧹 Ejecutando limpieza inicial de tokens...')
cleanupAllExpiredTokens()

console.log('✅ Cron jobs configurados')
