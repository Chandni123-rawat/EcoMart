import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'
import express from 'express'
import cors from 'cors'
import { startRealtime } from './services/realtime.js'
import { api } from './routes/api.js'
import { uploadDir } from './services/images.js'

const servesFrontend = !process.argv.includes('--api-only')
const port = Number(process.env.PORT || (servesFrontend ? 5173 : 4000))
const origin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
const app = express()
const server = createServer(app)
app.locals.io = startRealtime(server, origin)

app.use(cors({ origin }))
app.use(express.json({ limit: '32kb' }))
app.use('/uploads', express.static(uploadDir, { setHeaders: res => res.set('X-Content-Type-Options', 'nosniff') }))
app.use('/api', api)
app.use(['/api', '/uploads'], (req, res) => res.status(404).json({ error: 'Resource not found.' }))
if (servesFrontend) {
  const dist = fileURLToPath(new URL('../../frontend/dist/', import.meta.url))
  app.use(express.static(dist))
  app.get(['/', '/marketplace', '/marketplace/:id', '/sell', '/sell/:id', '/activity', '/analytics'], (req, res) => res.sendFile('index.html', { root: dist }))
}
app.use((req, res) => res.status(404).json({ error: 'Endpoint not found.' }))
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error)
  const status = error.status || (error.name === 'MulterError' ? 400 : 500)
  if (status >= 500) console.error(error.message)
  res.status(status).json({ error: status >= 500 ? 'Something went wrong. Please try again.' : error.message })
})
server.listen(port, '127.0.0.1', () => console.log(`${servesFrontend ? 'GREEN · Second Life' : 'GREEN API'} at http://127.0.0.1:${port}`))
