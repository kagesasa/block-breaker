import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Relative path for GitHub Pages compatibility
  build: {
    outDir: 'docs', // Build to /docs folder for easy GitHub Pages setup
  },
})
