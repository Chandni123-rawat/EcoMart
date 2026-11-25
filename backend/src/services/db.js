import { PrismaClient } from '@prisma/client'
import { databaseUrl } from './database-url.js'

export const db = new PrismaClient({ datasourceUrl: databaseUrl })
export const studentFields = { id: true, name: true, program: true }
export const listingIncludes = { category: true, seller: { select: studentFields } }

export function check(condition, message, status = 400) {
  if (!condition) throw Object.assign(new Error(message), { status })
}

export async function student(req, res, next) {
  const id = req.get('X-Demo-User')
  const user = id && await db.user.findUnique({ where: { id } })
  check(user, 'Choose a demo student first.')
  req.student = user
  next()
}

// Acquire the SQLite write lock before reading state for a listing mutation.
export function withListing(id, operation) {
  return db.$transaction(async tx => {
    await tx.$executeRaw`UPDATE "Listing" SET "status" = "status" WHERE "id" = ${id}`
    const listing = await tx.listing.findUnique({ where: { id } })
    check(listing, 'Listing not found.', 404)
    return operation(tx, listing)
  }, { timeout: 20000 })
}
