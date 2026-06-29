import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Le chiamate a /api vanno al backend FastAPI (uvicorn su :8000).
      // Avvia il backend con:  uvicorn api:app --reload --port 8000
      // (127.0.0.1 esplicito: evita ambiguità IPv4/IPv6 con "localhost")
      '/api': 'http://127.0.0.1:8000',
    },
  },
})
