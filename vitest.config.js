import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    setupFiles: [resolve(__dirname, '__tests__/setup.js')],
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
      '@minecraft/server': resolve(__dirname, '__mocks__/@minecraft/server.js'),
      '@minecraft/server-gametest': resolve(__dirname, '__mocks__/@minecraft/server-gametest.js'),
    },
  },
})
