import { publishRequest } from '../services/realtime.js'
import { check, db, studentFields, withListing } from '../services/db.js'

const includes = { buyer: { select: studentFields }, listing: { include: { seller: { select: studentFields } } }, transaction: true }

export async function list(req, res) {
  const id = req.student.id
  res.json(await db.purchaseRequest.findMany({
    where: { OR: [{ buyerId: id }, { listing: { sellerId: id } }] },
    include: includes,
    orderBy: { createdAt: 'desc' }
  }))
}

export async function create(req, res) {
  const { listingId, kind = 'PURCHASE', offer } = req.body ?? {}
  check(typeof listingId === 'string' && listingId, 'Choose a listing.')
  check(['PURCHASE', 'SWAP'].includes(kind), 'Choose a purchase or swap.')
  if (kind === 'SWAP') check(typeof offer === 'string' && offer.trim() && offer.length <= 500, 'Describe your proposed exchange.')
  const buyerId = req.student.id
  const result = await withListing(listingId, async (tx, listing) => {
    check(listing.sellerId !== buyerId, 'You already own this listing.')
    check(listing.status === 'AVAILABLE', 'This product is no longer available.', 409)
    check(kind !== 'SWAP' || listing.swap, 'This seller is accepting purchase requests only.')
    const previous = await tx.purchaseRequest.findUnique({ where: { listingId_buyerId: { listingId, buyerId } } })
    check(!previous, 'You already sent a request for this listing.', 409)
    return tx.purchaseRequest.create({ data: { listingId, buyerId, kind, offer: kind === 'SWAP' ? offer.trim() : null }, include: includes })
  })
  publishRequest(req, result, {
    notify: [result.listing.sellerId],
    message: `New ${kind === 'SWAP' ? 'swap' : 'purchase'} request for ${result.listing.name}.`
  })
  res.status(201).json(result)
}

async function withRequest(id, operation) {
  const reference = await db.purchaseRequest.findUnique({ where: { id }, select: { listingId: true } })
  check(reference, 'Request not found.', 404)
  return withListing(reference.listingId, async (tx, listing) => {
    const request = await tx.purchaseRequest.findUnique({ where: { id }, include: { transaction: true } })
    check(request, 'Request not found.', 404)
    return operation(tx, listing, request)
  })
}

export async function decide(req, res) {
  const { decision } = req.body ?? {}
  let changed = false
  let competing = []
  check(['accept', 'reject'].includes(decision), 'Choose accept or reject.')
  const result = await withRequest(req.params.id, async (tx, listing, request) => {
    check(listing.sellerId === req.student.id, 'Only the seller can decide.', 403)
    const status = decision === 'accept' ? 'ACCEPTED' : 'REJECTED'
    if (request.status === status) return tx.purchaseRequest.findUnique({ where: { id: request.id }, include: includes })
    check(request.status === 'PENDING', 'This request has already been decided.', 409)
    if (decision === 'accept') {
      check(listing.status === 'AVAILABLE', 'This product is no longer available.', 409)
      await tx.listing.update({ where: { id: listing.id }, data: { status: 'RESERVED' } })
      const where = { listingId: listing.id, id: { not: request.id }, status: 'PENDING' }
      competing = await tx.purchaseRequest.findMany({ where, select: { id: true, buyerId: true } })
      await tx.purchaseRequest.updateMany({ where, data: { status: 'REJECTED' } })
      await tx.transaction.create({ data: { requestId: request.id, agreedPrice: request.kind === 'PURCHASE' ? listing.price : null } })
    }
    changed = true
    return tx.purchaseRequest.update({ where: { id: request.id }, data: { status }, include: includes })
  })
  if (changed) {
    publishRequest(req, result, {
      notify: [result.buyerId],
      message: `Your request for ${result.listing.name} was ${result.status.toLowerCase()}.`,
      availabilityChanged: decision === 'accept'
    })
    for (const request of competing) {
      publishRequest(req, { ...request, listing: result.listing }, {
        notify: [request.buyerId],
        message: `${result.listing.name} was reserved for another request.`
      })
    }
  }
  res.json(result)
}

export async function confirm(req, res) {
  let changed = false
  const result = await withRequest(req.params.id, async (tx, listing, request) => {
    const seller = req.student.id === listing.sellerId
    check(seller || req.student.id === request.buyerId, 'Only the seller and buyer can confirm.', 403)
    if (request.status === 'COMPLETED') return tx.purchaseRequest.findUnique({ where: { id: request.id }, include: includes })
    check(request.status === 'ACCEPTED' && request.transaction, 'The seller must accept first.', 409)
    const key = seller ? 'sellerConfirmedAt' : 'buyerConfirmedAt'
    const transaction = request.transaction
    if (transaction[key]) return tx.purchaseRequest.findUnique({ where: { id: request.id }, include: includes })
    changed = true
    const now = new Date()
    const complete = Boolean(seller ? transaction.buyerConfirmedAt : transaction.sellerConfirmedAt)
    await tx.transaction.update({ where: { id: transaction.id }, data: { [key]: now, ...(complete ? { completedAt: now } : {}) } })
    if (complete) {
      await tx.listing.update({ where: { id: listing.id }, data: { status: 'SOLD' } })
      await tx.purchaseRequest.update({ where: { id: request.id }, data: { status: 'COMPLETED' } })
    }
    return tx.purchaseRequest.findUnique({ where: { id: request.id }, include: includes })
  })
  if (changed) {
    const complete = result.status === 'COMPLETED'
    const participants = [result.buyerId, result.listing.sellerId]
    publishRequest(req, result, {
      notify: complete ? participants : participants.filter(id => id !== req.student.id),
      message: complete ? `Handover completed for ${result.listing.name}.` : `The other student confirmed handover for ${result.listing.name}.`,
      availabilityChanged: complete
    })
  }
  res.json(result)
}

export async function contact(req, res) {
  const id = req.student.id
  const request = await db.purchaseRequest.findFirst({
    where: { id: req.params.id, status: { in: ['ACCEPTED', 'COMPLETED'] }, OR: [{ buyerId: id }, { listing: { sellerId: id } }] },
    include: { buyer: true, listing: { include: { seller: true } } }
  })
  check(request, 'Contact details are available to participants after acceptance.', 404)
  const person = id === request.buyerId ? request.listing.seller : request.buyer
  res.json({ name: person.name, email: person.email })
}
