import { Pool } from 'pg'

declare global {
  var pgPool: Pool | undefined
}

const normalizeConnectionString = (raw?: string) => {
  if (!raw) {
    throw new Error('Missing DATABASE_URL or DATALAKE_URL in environment')
  }

  return raw.replace(/^postgresql\+psycopg2:\/\//, 'postgresql://')
}

const connectionString = normalizeConnectionString(
  process.env.DATABASE_URL || process.env.DATALAKE_URL,
)

const pool = globalThis.pgPool ?? new Pool({ connectionString })
if (!globalThis.pgPool) globalThis.pgPool = pool

export { pool }
