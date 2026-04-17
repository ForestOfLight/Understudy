import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@minecraft/server': resolve(__dirname, '__mocks__/@minecraft/server.js'),
      '@minecraft/server-gametest': resolve(__dirname, '__mocks__/@minecraft/server-gametest.js'),
    },
  },
})
