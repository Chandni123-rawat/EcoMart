import { spawnSync } from 'node:child_process'
import { open } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { databaseUrl } from '../src/services/database-url.js'

if (!process.env.GREEN_DATABASE_URL) {
  const file = await open(new URL('../prisma/green-local.db', import.meta.url), 'a')
  await file.close()
}

const require = createRequire(import.meta.url)
const cli = require.resolve('prisma/build/index.js')
const result = spawnSync(process.execPath, [cli, 'migrate', 'deploy'], {
  env: { ...process.env, GREEN_DATABASE_URL: databaseUrl },
  stdio: 'inherit'
})
if (result.error) throw result.error
process.exitCode = result.status ?? 1
