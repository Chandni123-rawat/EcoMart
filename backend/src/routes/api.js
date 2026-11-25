import { historicalSummary } from '../services/historical-sales.js'
import { Router } from 'express'
import * as listings from '../controllers/listings.js'
import * as requests from '../controllers/requests.js'
import { db, student, studentFields } from '../services/db.js'
import { priceEstimate } from '../services/pricing.js'
import { upload } from '../services/images.js'

export const api = Router()
api.get('/health', async (req, res) => {
  await db.$queryRaw`SELECT 1`
  res.json({ ok: true })
})
api.get('/users', async (req, res) => res.json(await db.user.findMany({ select: studentFields, orderBy: { name: 'asc' } })))
api.get('/analytics/historical', async (req, res) => res.json(await historicalSummary(req.query.condition)))
api.get('/pricing/estimate', async (req, res) => res.json(await priceEstimate(req.query)))
api.get('/categories', async (req, res) => res.json(await db.category.findMany()))
api.get('/listings', (req, res, next) => req.query.seller === 'me' ? student(req, res, next).catch(next) : next(), listings.catalog)
api.get('/listings/:id', listings.detail)
api.post('/listings', student, upload, listings.save)
api.put('/listings/:id', student, upload, listings.save)
api.delete('/listings/:id', student, listings.remove)

api.use('/requests', student)
api.get('/requests', requests.list)
api.post('/requests', requests.create)
api.patch('/requests/:id/decision', requests.decide)
api.post('/requests/:id/confirm', requests.confirm)
api.get('/requests/:id/contact', requests.contact)
