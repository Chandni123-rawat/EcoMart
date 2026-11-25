import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const { API_PROXY_TARGET } = loadEnv(mode, process.cwd(), '')
  const target = API_PROXY_TARGET || 'http://127.0.0.1:4000'
  const proxy = { '/api': { target }, '/uploads': { target }, '/socket.io': { target, ws: true } }
  return { plugins: [react(), tailwind()], server: { proxy }, preview: { proxy } }
})
