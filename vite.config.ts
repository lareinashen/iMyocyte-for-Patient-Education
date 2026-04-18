import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Relative base so the built bundle works regardless of the path it is served from
// (e.g. /imyocyte/, /embeds/reentry/, etc.) — important for iframe embedding.
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  esbuild: {
    target: 'es2022',
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2022',
    },
  },
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})