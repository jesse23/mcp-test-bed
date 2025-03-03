import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@cucumber/cucumber': '/src/gherkin-web/cucumber',
      '@playwright/test': '/src/gherkin-web/playwright'
     /*
      '@cucumber/cucumber': '/src/services/cucumber',
      '@playwright/test': '/src/services/playwright'
      */
    }
  },
  /*
  optimizeDeps: {
    include: ['@gherkin-web/core']
  },
  */
  publicDir: 'test',
})
