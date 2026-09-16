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
  database: process.env.DB_DATALAKE || 'datalake_economico',
  ssl: false,
});

export async function GET(request: NextRequest) {
  try {
    const client = await pool.connect();
    await client.query('SET search_path TO public;');

    // 1. Serie Histórica (Nivel General)
    const querySerie = `
      SELECT 
        TO_CHAR(i.fecha, 'YYYY-MM-DD') as fecha,
        COALESCE(i.id_region, 0) as id_region,
        COALESCE(r.nombre_region, 'Nación') as nombre_region,
        i.valor,
        ROUND((COALESCE(i.var_mensual, 0) * 100)::numeric, 1) as var_mensual,
        ROUND((COALESCE(i.var_interanual, 0) * 100)::numeric, 1) as var_interanual,
        ROUND((COALESCE(i.var_acumulada, 0) * 100)::numeric, 1) as var_acumulada
      FROM ipc i
      LEFT JOIN dicc_region r ON i.id_region = r.id_region
      LEFT JOIN ipc_division div ON i.id_division = div.id_division
      WHERE (
          i.id_division = 1
          OR LOWER(COALESCE(div.nombre, '')) LIKE '%nivel general%'
          OR LOWER(COALESCE(div.nombre, '')) = 'nivel general'
        )
      ORDER BY i.fecha ASC;
    `;

    // 2. Aperturas y Subdivisiones
    const queryItems = `
      SELECT 
        TO_CHAR(i.fecha, 'YYYY-MM-DD') as fecha,
        COALESCE(i.id_region, 0) as id_region,
        COALESCE(r.nombre_region, 'Nación') as nombre_region,
        i.id_division,
        i.id_subdivision,
        COALESCE(div.nombre, d.nombre, 'Nivel general') as nombre_division,
        COALESCE(d.nombre, div.nombre, 'Nivel general') as nombre_categoria,
        ROUND((COALESCE(i.var_mensual, 0) * 100)::numeric, 1) as var_mensual,
        ROUND((COALESCE(i.var_interanual, 0) * 100)::numeric, 1) as var_interanual
      FROM ipc i
      LEFT JOIN dicc_region r ON i.id_region = r.id_region
      LEFT JOIN ipc_division div ON i.id_division = div.id_division
      LEFT JOIN dicc_ipc d ON i.id_subdivision = d.id_subdivision
      ORDER BY i.fecha DESC, var_mensual DESC;
    `;

    // 3. Regiones
    const queryRegiones = `
      SELECT DISTINCT 
        COALESCE(i.id_region, 0) as id_region, 
        COALESCE(r.nombre_region, 'Nación') as nombre_region
      FROM ipc i
      LEFT JOIN dicc_region r ON i.id_region = r.id_region
      ORDER BY nombre_region ASC;
    `;

    // 4. Fechas únicas
    const queryFechas = `
      SELECT DISTINCT TO_CHAR(fecha, 'YYYY-MM-DD') as fecha 
      FROM ipc 
      ORDER BY fecha DESC;
    `;

    const [resSerie, resItems, resRegiones, resFechas] = await Promise.all([
      client.query(querySerie),
      client.query(queryItems),
      client.query(queryRegiones),
      client.query(queryFechas),
    ]);

    client.release();

    return NextResponse.json(
      {
        serieGeneral: resSerie.rows,
        items: resItems.rows,
        regiones: resRegiones.rows,
        fechasDisponibles: resFechas.rows.map((r) => r.fecha),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: any) {
    console.error('Error en /api/ipc:', error);
    return NextResponse.json(
      { error: 'Error al consultar IPC', details: error.message },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}