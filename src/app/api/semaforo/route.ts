import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Forzar ejecución dinámica y anular caché de Next.js
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const pool = new Pool({
  host: process.env.HOST_DBB2,
  port: Number(process.env.PORT_DBB2) || 5432,
  user: process.env.USER_DBB2,
  password: process.env.PASSWORD_DBB2,
  database: process.env.DB_DWH || 'dwh_economico',
  ssl: false,
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get('tipo') || 'interanual';

  const tabla = tipo === 'intermensual' ? 'semaforo_intermensual' : 'semaforo_interanual';

  try {
    const client = await pool.connect();
    const query = `
      SELECT 
        TO_CHAR(fecha, 'YYYY-MM-DD') as fecha,
        combustible_vendido,
        empleo_privado_registrado_sipa,
        exportaciones_aduana_corrientes_dolares,
        exportaciones_aduana_corrientes_toneladas,
        pasajeros_salidos_terminal_corrientes,
        pasajeros_aeropuerto_corrientes,
        patentamiento_0km_auto,
        patentamiento_0km_motocicleta,
        venta_supermercados_autoservicios_mayoristas,
        permisos_edificacion_unidades,
        permisos_edificacion_m2
      FROM ${tabla}
      ORDER BY fecha DESC;
    `;

    const result = await client.query(query);
    client.release();

    return NextResponse.json(result.rows, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error: any) {
    console.error('Error fetching semaforo data:', error);
    return NextResponse.json(
      { error: 'Error al conectar con la base de datos', details: error.message },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}