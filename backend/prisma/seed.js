import 'dotenv/config'
import { db } from '../src/services/db.js'
const users = [
  { id: 'aisha', name: 'Aisha Sharma', program: 'Computer Science · Year 3', email: 'aisha@example.edu' },
  { id: 'kabir', name: 'Kabir Mehta', program: 'Mechanical Engineering · Year 2', email: 'kabir@example.edu' },
  { id: 'maya', name: 'Maya Patel', program: 'Architecture · Year 4', email: 'maya@example.edu' }
]
const categories = [
  { id: 'books', name: 'Books' },
  { id: 'calculators', name: 'Calculators' },
  { id: 'bicycles', name: 'Bicycles' },
  { id: 'equipment', name: 'Academic Equipment' }
]
const samples = [
  ['roadster', 'Campus Roadster Bicycle', 'bicycles', 'kabir', 'Hero', 'Roadster', 8500, 3800, 2, 'GOOD', 'campus.webp', true, 'A dependable campus commuter with a front basket. Brakes and tyres are in good shape. Ready for a test ride near the library.'],
  ['casio', 'Casio Scientific Calculator', 'calculators', 'maya', 'Casio', 'fx-991ES Plus', 1650, 750, 1, 'LIKE_NEW', 'calculator.webp', false, 'Fully working scientific calculator with a slide-on cover. Used for one semester and stored in its case.'],
  ['engineering', 'Engineering Mathematics', 'books', 'kabir', 'Kreyszig', '10th edition', 1250, 450, 2, 'GOOD', 'books.webp', true, 'A well-kept copy for first-year engineering. A few pencilled notes in the first two chapters.'],
  ['drafting', 'Architectural Drafting Kit', 'equipment', 'maya', 'Staedtler', 'Mars Basic', 2300, 1100, 1, 'LIKE_NEW', 'drafting.webp', true, 'Includes a compass, set squares, ruler and pencils. Ideal for first-year architecture studio.']
]

try {
  for (const user of users) await db.user.upsert({ where: { id: user.id }, update: user, create: user })
  for (const category of categories) await db.category.upsert({ where: { id: category.id }, update: category, create: category })
  for (const [id, name, categoryId, sellerId, brand, model, originalPrice, price, age, condition, image, swap, description] of samples.reverse()) {
    await db.listing.upsert({ where: { id }, update: {}, create: {
      id, name, categoryId, sellerId, brand, model, originalPrice, price, age, condition, images: ['/images/' + image], swap, description
    } })
  }
} finally {
  await db.$disconnect()
}
