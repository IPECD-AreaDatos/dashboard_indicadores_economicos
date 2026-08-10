import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET() {
  const result = await pool.query(`SELECT fecha, valor FROM public.ripte ORDER BY fecha DESC LIMIT 100`)
  return NextResponse.json(result.rows)
}
