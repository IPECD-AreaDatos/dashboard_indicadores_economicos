import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET() {
  const result = await pool.query(
    `SELECT fecha, id_region, id_categoria, id_division, id_subdivision, valor, var_mensual, var_interanual, var_acumulada
     FROM public.ipc
     ORDER BY fecha DESC
     LIMIT 100`,
  )
  return NextResponse.json(result.rows)
}
