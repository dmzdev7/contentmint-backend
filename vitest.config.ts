import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: [
      'src/**/*.test.ts', 
      'tests/**/*.test.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.config.{js,ts}',
        '**/generated/**',
        '**/*.d.ts',
        'src/server.ts',
      ],
    },
    testTimeout: 20000,
    hookTimeout: 20000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@db': path.resolve(__dirname, './prisma/generated'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
})