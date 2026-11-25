import 'dotenv/config'

export const databaseUrl = process.env.GREEN_DATABASE_URL || 'file:./green-local.db'
