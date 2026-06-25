import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/gradio-api': {
        target: 'https://nblvprasad-exam-evaluation-system.hf.space',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gradio-api/, ''),
        ws: true,
      }
    }
  }
})
