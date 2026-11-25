import { readFile } from 'node:fs/promises'
import { parse } from 'csv-parse/sync'
import { check } from './db.js'

const categories = { Book: 'Books', Calculator: 'Calculators', Cycle: 'Bicycles' }
const conditions = ['Excellent', 'Good', 'Fair', 'Poor']
let sales

export async function historicalSales() {
  sales ??= parse(await readFile(new URL('../../../data-analytics/historical-prices.csv', import.meta.url), 'utf8'), {
    columns: true,
    cast: true,
    skip_empty_lines: true
  })
  return sales
}

const round = value => Math.round(value * 100) / 100

export async function historicalSummary(condition) {
  check(condition === undefined || conditions.includes(condition), 'Choose a valid historical condition.')
  const rows = (await historicalSales()).filter(row => !condition || row.condition === condition)
  const groups = Object.entries(categories).flatMap(([source, name]) => {
    const matches = rows.filter(row => row.category === source)
    const count = matches.length
    if (!count) return []
    let original = 0
    let sold = 0
    let retention = 0
    for (const row of matches) {
      original += row.original_price_inr
      sold += row.sold_price_inr
      retention += row.sold_price_inr / row.original_price_inr
    }
    return [{ name, count, averageOriginal: round(original / count), averageSold: round(sold / count), retainedPercent: round(100 * retention / count) }]
  })
  return { count: groups.reduce((sum, group) => sum + group.count, 0), groups }
}
