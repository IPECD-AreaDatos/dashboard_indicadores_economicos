import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// Forzar ejecución dinámica y anular caché de Next.js
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT fecha, salario_mvm_mensual, salario_mvm_diario, salario_mvm_hora FROM public.salario_mvm ORDER BY fecha DESC LIMIT 100`,
    );

    return NextResponse.json(result.rows, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error: any) {
    console.error('Error en /api/smvm:', error);
    return NextResponse.json(
      { error: 'Error al consultar SMVM', details: error.message },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}