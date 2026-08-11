import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

const IPC_GENERAL_ID = 1

export async function GET() {
  try {
    const [ipcResult, ipcTrendResult, cbtCbaResult, sipaResult] = await Promise.all([
      pool.query(
        `SELECT var_mensual, var_acumulada, var_interanual
         FROM public.ipc
         WHERE id_categoria = $1
         ORDER BY fecha DESC
         LIMIT 1`,
        [IPC_GENERAL_ID],
      ),
      pool.query(
        `SELECT fecha, var_mensual
         FROM public.ipc
         WHERE id_categoria = $1
         ORDER BY fecha DESC
         LIMIT 12`,
        [IPC_GENERAL_ID],
      ),
      pool.query(
        `SELECT fecha, cba_hogar, cbt_hogar
         FROM public.cbt_cba
         ORDER BY fecha DESC
         LIMIT 2`,
      ),
      pool.query(
        `SELECT fecha, cantidad_con_estacionalidad, cantidad_sin_estacionalidad
         FROM public.sipa
         ORDER BY fecha DESC
         LIMIT 2`,
      ),
    ])

    return NextResponse.json({
      ipc: ipcResult.rows[0] ?? null,
      ipcTrend: ipcTrendResult.rows.reverse(),
      cbaCbt: cbtCbaResult.rows,
      sipa: sipaResult.rows,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al obtener el resumen' }, { status: 500 })
  }
}
