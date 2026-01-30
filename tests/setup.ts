import prisma from '@/infrastructure/lib/prisma.js'
import { beforeAll, afterEach, afterAll } from 'vitest'

// Ejecutar ANTES de todos los tests
beforeAll(async () => {
    console.log('🧪 Configurando entorno de tests...')

    // Limpiar base de datos
    await cleanDatabase()
})

// Ejecutar DESPUÉS de cada test
afterEach(async () => {
  // Limpiar datos creados en el test
  await cleanDatabase()
})

// Ejecutar DESPUÉS de todos los tests
afterAll(async () => {
  console.log('🧹 Limpiando entorno de tests...')
  
  // Cerrar conexión a la base de datos
  await prisma.$disconnect()
})

/**
 * Limpia todas las tablas de la base de datos
 */
async function cleanDatabase() {
  // Orden importa (por foreign keys)
  await prisma.refreshToken.deleteMany()
  await prisma.verificationToken.deleteMany()
  await prisma.passwordResetToken.deleteMany()
  await prisma.user.deleteMany()
}