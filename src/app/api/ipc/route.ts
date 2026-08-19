import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

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

    // 1. Serie Histórica: Obtenemos Nivel General asegurando coincidencia por nombre o IDs
    const querySerie = `
      SELECT 
        TO_CHAR(i.fecha, 'YYYY-MM-DD') as fecha,
        COALESCE(i.id_region, 0) as id_region,
        COALESCE(r.nombre_region, 'Nación') as nombre_region,
        i.valor,
        CASE 
          WHEN ABS(COALESCE(i.var_mensual, 0)) < 1 AND COALESCE(i.var_mensual, 0) != 0 
          THEN ROUND((i.var_mensual * 100)::numeric, 1)
          ELSE ROUND(COALESCE(i.var_mensual, 0)::numeric, 1)
        END as var_mensual,
        CASE 
          WHEN ABS(COALESCE(i.var_interanual, 0)) < 1 AND COALESCE(i.var_interanual, 0) != 0 
          THEN ROUND((i.var_interanual * 100)::numeric, 1)
          ELSE ROUND(COALESCE(i.var_interanual, 0)::numeric, 1)
        END as var_interanual,
        CASE 
          WHEN ABS(COALESCE(i.var_acumulada, 0)) < 1 AND COALESCE(i.var_acumulada, 0) != 0 
          THEN ROUND((i.var_acumulada * 100)::numeric, 1)
          ELSE ROUND(COALESCE(i.var_acumulada, 0)::numeric, 1)
        END as var_acumulada
      FROM ipc i
      LEFT JOIN dicc_region r ON i.id_region = r.id_region
      LEFT JOIN ipc_division div ON i.id_division = div.id_division
      WHERE (i.id_subdivision IS NULL OR i.id_subdivision = 0)
        AND (
          i.id_division IS NULL 
          OR i.id_division = 0 
          OR LOWER(COALESCE(div.nombre, '')) LIKE '%general%'
        )
      ORDER BY i.fecha ASC;
    `;

    // 2. Aperturas y Divisiones
    const queryAperturas = `
      SELECT 
        TO_CHAR(i.fecha, 'YYYY-MM-DD') as fecha,
        COALESCE(i.id_region, 0) as id_region,
        COALESCE(r.nombre_region, 'Nación') as nombre_region,
        i.id_division,
        COALESCE(div.nombre, d.nombre, 'Nivel general') as nombre_division,
        i.id_subdivision,
        d.nombre as nombre_subdivision,
        i.valor,
        CASE 
          WHEN ABS(COALESCE(i.var_mensual, 0)) < 1 AND COALESCE(i.var_mensual, 0) != 0 
          THEN ROUND((i.var_mensual * 100)::numeric, 1)
          ELSE ROUND(COALESCE(i.var_mensual, 0)::numeric, 1)
        END as var_mensual,
        CASE 
          WHEN ABS(COALESCE(i.var_interanual, 0)) < 1 AND COALESCE(i.var_interanual, 0) != 0 
          THEN ROUND((i.var_interanual * 100)::numeric, 1)
          ELSE ROUND(COALESCE(i.var_interanual, 0)::numeric, 1)
        END as var_interanual
      FROM ipc i
      LEFT JOIN dicc_region r ON i.id_region = r.id_region
      LEFT JOIN ipc_division div ON i.id_division = div.id_division
      LEFT JOIN dicc_ipc d ON i.id_subdivision = d.id_subdivision AND (i.id_division = d.id_division OR d.id_division IS NULL)
      ORDER BY i.fecha DESC, var_interanual DESC;
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

    const [resSerie, resAperturas, resRegiones, resFechas] = await Promise.all([
      client.query(querySerie),
      client.query(queryAperturas),
      client.query(queryRegiones),
      client.query(queryFechas),
    ]);

    client.release();

    return NextResponse.json({
      serieGeneral: resSerie.rows,
      aperturas: resAperturas.rows,
      regiones: resRegiones.rows,
      fechasDisponibles: resFechas.rows.map((r) => r.fecha),
    });
  } catch (error: any) {
    console.error('Error en /api/ipc:', error);
    return NextResponse.json(
      { error: 'Error al consultar IPC', details: error.message },
      { status: 500 }
    );
  }
}