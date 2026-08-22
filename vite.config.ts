import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages project sites are served beneath /<repository-name>/.
  // Keep the development server at the root for local use.
  base: process.env.GITHUB_ACTIONS ? '/order-system-merchant-mobile-H5/' : '/',
  plugins: [react()],
})
