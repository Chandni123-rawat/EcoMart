import { check, db, listingIncludes, withListing } from '../services/db.js'
import { storeImages, removeImages } from '../services/images.js'

const conditions = ['LIKE_NEW', 'GOOD', 'FAIR']

function number(value, label, max, whole = false) {
  const result = Number(value)
  check(value !== undefined && String(value).trim() && Number.isFinite(result) && result >= 0 && result <= max && (!whole || Number.isInteger(result)), `Enter a valid ${label}.`)
  return result
}

export async function catalog(req, res) {
  const q = req.query
  const where = {}
  if (q.seller === 'me') {
    check(req.student, 'Choose a demo student first.')
    where.sellerId = req.student.id
  } else if (q.available === 'true') where.status = 'AVAILABLE'
  if (q.category) where.categoryId = String(q.category)
  if (q.search) where.name = { contains: String(q.search).trim() }
  if (q.brand) where.brand = { contains: String(q.brand).trim() }
  if (q.condition) {
    check(conditions.includes(q.condition), 'Choose a valid condition.')
    where.condition = q.condition
  }
  if (q.minPrice || q.maxPrice) {
    where.price = {}
    if (q.minPrice) where.price.gte = number(q.minPrice, 'minimum price', 9999999999)
    if (q.maxPrice) where.price.lte = number(q.maxPrice, 'maximum price', 9999999999)
    check(!(where.price.gte > where.price.lte), 'Minimum price must be below or equal to maximum price.')
  }
  if (q.maxAge) where.age = { lte: number(q.maxAge, 'age', 100, true) }

  const sort = q.sort === 'price-asc' ? { price: 'asc' } : q.sort === 'price-desc' ? { price: 'desc' } : { createdAt: 'desc' }
  res.json(await db.listing.findMany({ where, include: listingIncludes, orderBy: [sort, { id: 'asc' }] }))
}

export async function detail(req, res) {
  const item = await db.listing.findUnique({ where: { id: req.params.id }, include: listingIncludes })
  check(item, 'Listing not found.', 404)
  res.json(item)
}

async function listingFields(body) {
  const data = {}
  for (const [field, limit] of Object.entries({ name: 100, categoryId: 60, brand: 80, model: 80, description: 2000 })) {
    const value = body[field]?.trim?.()
    check(value && value.length <= limit, `Enter a valid ${field === 'categoryId' ? 'category' : field}.`)
    data[field] = value
  }
  check(await db.category.findUnique({ where: { id: data.categoryId } }), 'Choose a valid category.')
  check(conditions.includes(body.condition), 'Choose a valid condition.')
  check(['true', 'false'].includes(body.swap), 'Choose whether you are open to exchanges.')
  return {
    ...data,
    originalPrice: number(body.originalPrice, 'original purchase price', 9999999999),
    price: number(body.price, 'selling price', 9999999999),
    age: number(body.age, 'age in years', 100, true),
    condition: body.condition,
    swap: body.swap === 'true'
  }
}

export async function save(req, res) {
  const id = req.params.id
  const data = await listingFields(req.body ?? {})
  if (!id) check(req.files?.length, 'Add at least one product image.')
  const images = await storeImages(req.files ?? [])
  let replaced = []
  let item
  try {
    if (id) {
      item = await withListing(id, async (tx, listing) => {
        check(listing.sellerId === req.student.id, 'Only the seller can edit this listing.', 403)
        check(listing.status === 'AVAILABLE', 'Only available listings can be edited.', 409)
        const pending = await tx.purchaseRequest.count({ where: { listingId: id, status: 'PENDING' } })
        check(!pending, 'Resolve pending requests before editing.', 409)
        if (images.length) replaced = listing.images
        return tx.listing.update({ where: { id }, data: { ...data, ...(images.length ? { images } : {}) }, include: listingIncludes })
      })
    } else {
      item = await db.listing.create({ data: { ...data, images, sellerId: req.student.id }, include: listingIncludes })
    }
  } catch (error) {
    await removeImages(images)
    throw error
  }
  await removeImages(replaced)
  res.status(id ? 200 : 201).json(item)
}

export async function remove(req, res) {
  const id = req.params.id
  const images = await withListing(id, async (tx, listing) => {
    check(listing.sellerId === req.student.id, 'Only the seller can delete this listing.', 403)
    check(listing.status === 'AVAILABLE', 'Only available listings can be deleted.', 409)
    const pending = await tx.purchaseRequest.count({ where: { listingId: id, status: 'PENDING' } })
    check(!pending, 'Resolve pending requests before deleting.', 409)
    await tx.listing.delete({ where: { id } })
    return listing.images
  })
  await removeImages(images)
  res.status(204).end()
}
