import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

// Asumiendo que quieres el IPC a nivel general (sin filtrar por categoría, división, etc.)
// y que id_categoria=1 (o el ID correspondiente) representa el "Nivel general".
const IPC_GENERAL_ID = 1

export async function GET() {
  try {
    // 1. Obtener el último dato de IPC (para las tarjetas de resumen)
    const lastIpcResult = await pool.query(
      `SELECT var_mensual, var_acumulada, var_interanual
       FROM public.ipc
       WHERE id_categoria = $1
       ORDER BY fecha DESC
       LIMIT 1`,
      [IPC_GENERAL_ID],
    )

    // 2. Obtener la variación mensual de los últimos 12 meses (para el gráfico)
    const monthlyVariationResult = await pool.query(
      `SELECT fecha, var_mensual
       FROM public.ipc
       WHERE id_categoria = $1
       ORDER BY fecha DESC
       LIMIT 12`,
      [IPC_GENERAL_ID],
    )

    return NextResponse.json({ lastIpc: lastIpcResult.rows[0], monthlyVariation: monthlyVariationResult.rows.reverse() }) // .reverse() para ordenar de más antiguo a más nuevo
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener los datos del IPC' }, { status: 500 })
  }
}
