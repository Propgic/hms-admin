/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Under vitest only, stub every `.css` import to an empty module. Component
// tests don't assert on styles, and this makes the suite resilient to missing
// CSS files (e.g. a third-party stylesheet like react-datepicker's that this
// machine's iCloud-synced node_modules occasionally evicts). Never active for
// dev/build, so the real app still loads its real CSS.
const cssStubPlugin = process.env.VITEST
  ? [{
      name: 'vitest-css-stub',
      enforce: 'pre',
      resolveId(id) { if (id.endsWith('.css')) return '\0' + id; },
      load(id) { if (id.startsWith('\0') && id.endsWith('.css')) return ''; },
    }]
  : []

export default defineConfig({
  plugins: [react(), tailwindcss(), ...cssStubPlugin],
  server: {
    port: 3002,
    // Proxy API calls to the backend so the browser talks to a single origin
    // (localhost:3002). This keeps the httpOnly refresh cookie first-party, so
    // the silent token refresh works and users aren't logged out hourly.
    proxy: {
      '/api': { target: 'http://localhost:5001', changeOrigin: true },
    },
  },
  test: {
    // `globals: true` exposes describe/test/expect/vi without per-file imports.
    globals: true,
    // jsdom provides a DOM (window, localStorage, document) for component tests.
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
  },
})
