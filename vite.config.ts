import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Change to absolute path matching the repository name for GitHub Pages
  base: '/block-breaker/',
  build: {
    outDir: 'docs', // Build to /docs folder for easy GitHub Pages setup
  },
})
