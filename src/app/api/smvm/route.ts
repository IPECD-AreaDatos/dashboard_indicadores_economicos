import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET() {
  const result = await pool.query(
    `SELECT fecha, salario_mvm_mensual, salario_mvm_diario, salario_mvm_hora FROM public.salario_mvm ORDER BY fecha DESC LIMIT 100`,
  )
  return NextResponse.json(result.rows)
}
