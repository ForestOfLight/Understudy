import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: '@forestoflight/minecraft-vitest-mocks/setup',
    server: {
      deps: {
        inline: ['@forestoflight/minecraft-vitest-mocks']
      }
    },
    include: ['__tests__/**/*.test.js']
  },
  plugins: [
    {
      name: 'minecraft-main',
      resolveId(id) { if (id === 'main') return '\0virtual:main' },
      load(id) { if (id === '\0virtual:main') return '' },
    },
  ],
  resolve: {
    alias: {
      '@minecraft/server': '@forestoflight/minecraft-vitest-mocks/server',
      '@minecraft/server-gametest': '@forestoflight/minecraft-vitest-mocks/server-gametest',
    },
  },
})
