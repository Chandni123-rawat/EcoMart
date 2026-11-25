import { historicalSales } from './historical-sales.js'
import { check } from './db.js'

const categories = new Map([
  ['books', 'Book'],
  ['calculators', 'Calculator'],
  ['bicycles', 'Cycle'],
  ['equipment', null]
])
const conditions = { LIKE_NEW: 'Excellent', GOOD: 'Good', FAIR: 'Fair' }
const minimumSample = 5

function percentile(sorted, fraction) {
  const index = (sorted.length - 1) * fraction
  const lower = Math.floor(index)
  return sorted[lower] + (sorted[Math.ceil(index)] - sorted[lower]) * (index - lower)
}

export async function priceEstimate({ category, condition, age, originalPrice }) {
  check(categories.has(category) && Object.hasOwn(conditions, condition), 'Choose a valid category and condition.')
  check(typeof age === 'string' && age.trim() && Number.isFinite(Number(age)) && Number(age) >= 0 && Number(age) <= 100, 'Enter a valid age.')
  check(typeof originalPrice === 'string' && originalPrice.trim() && Number.isFinite(Number(originalPrice)) && Number(originalPrice) > 0 && Number(originalPrice) <= 9999999999, 'Enter a positive original purchase price.')

  if (!categories.get(category)) return { available: false }
  const sales = await historicalSales()
  const ratios = sales.filter(row =>
    row.category === categories.get(category) &&
    row.condition === conditions[condition] &&
    Math.abs(row.age_years - Number(age)) <= 1 &&
    row.original_price_inr > 0 &&
    row.sold_price_inr > 0 &&
    row.sold_price_inr <= row.original_price_inr
  ).map(row => row.sold_price_inr / row.original_price_inr).sort((a, b) => a - b)

  if (ratios.length < minimumSample) return { available: false }
  const priceAt = fraction => Math.round(Number(originalPrice) * percentile(ratios, fraction) * 100) / 100
  return { available: true, suggested: priceAt(0.5), low: priceAt(0.25), high: priceAt(0.75), sampleSize: ratios.length }
}
