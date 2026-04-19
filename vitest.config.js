import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const workingDirName = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    setupFiles: [resolve(workingDirName, '__tests__/setup.js')],
    exclude: ['**/node_modules/**', '.claude/**'],
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
      '@minecraft/server': resolve(workingDirName, '__mocks__/@minecraft/server.js'),
      '@minecraft/server-gametest': resolve(workingDirName, '__mocks__/@minecraft/server-gametest.js'),
    },
  },
})
