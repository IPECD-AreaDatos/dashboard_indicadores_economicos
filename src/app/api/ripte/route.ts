import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// Forzar ejecución dinámica y anular caché de Next.js
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT fecha, valor FROM public.ripte ORDER BY fecha DESC LIMIT 100`
    );

    return NextResponse.json(result.rows, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error: any) {
    console.error('Error en /api/ripte:', error);
    return NextResponse.json(
      { error: 'Error al consultar RIPTE', details: error.message },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}