import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const firebaseProjectId = 'meanwellpower-103ae'
const firebaseRegion = 'asia-northeast3'
const firebaseFunctionsOrigin = `http://127.0.0.1:5001`
const firebaseFunctionsPath = `/${firebaseProjectId}/${firebaseRegion}`

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/nicepay/confirm': {
        target: firebaseFunctionsOrigin,
        changeOrigin: true,
        rewrite: () => `${firebaseFunctionsPath}/nicepayConfirm`,
      },
      '/api/nicepay/webhook': {
        target: firebaseFunctionsOrigin,
        changeOrigin: true,
        rewrite: () => `${firebaseFunctionsPath}/nicepayWebhook`,
      },
    },
  },
})
