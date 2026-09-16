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

    // 1. Serie Provincial (Sector Privado)
    const queryProvincias = `
      WITH sipa_raw AS (
        SELECT 
          s.fecha,
          s.id_provincia,
          COALESCE(prov.nombre_provincia, 'Nación') as nombre_provincia,
          COALESCE(prov.id_region, reg.id_region, 1) as id_region,
          COALESCE(reg.nombre_region, 'Nación') as nombre_region,
          s.cantidad_con_estacionalidad,
          s.cantidad_sin_estacionalidad
        FROM sipa s
        LEFT JOIN dicc_provincia prov ON s.id_provincia = prov.id_provincia
        LEFT JOIN dicc_region reg ON COALESCE(prov.id_region, 1) = reg.id_region
        WHERE (s.id_provincia = 1 AND s.id_registro IN (1, 2))
           OR (s.id_provincia != 1 AND s.id_registro = 1)
      ),
      sipa_calc AS (
        SELECT 
          fecha,
          id_provincia,
          nombre_provincia,
          id_region,
          nombre_region,
          cantidad_con_estacionalidad,
          cantidad_sin_estacionalidad,
          ROUND(
            (
              ((cantidad_sin_estacionalidad - LAG(cantidad_sin_estacionalidad, 1) OVER (PARTITION BY id_provincia ORDER BY fecha))
              / NULLIF(LAG(cantidad_sin_estacionalidad, 1) OVER (PARTITION BY id_provincia ORDER BY fecha), 0)) * 100
            )::numeric, 1
          ) as var_mensual,
          ROUND(
            (
              ((cantidad_con_estacionalidad - LAG(cantidad_con_estacionalidad, 12) OVER (PARTITION BY id_provincia ORDER BY fecha))
              / NULLIF(LAG(cantidad_con_estacionalidad, 12) OVER (PARTITION BY id_provincia ORDER BY fecha), 0)) * 100
            )::numeric, 1
          ) as var_interanual
        FROM sipa_raw
      )
      SELECT 
        TO_CHAR(fecha, 'YYYY-MM-DD') as fecha,
        id_provincia,
        nombre_provincia,
        id_region,
        nombre_region,
        cantidad_con_estacionalidad,
        cantidad_sin_estacionalidad,
        var_mensual,
        var_interanual
      FROM sipa_calc
      WHERE nombre_provincia IS NOT NULL
      ORDER BY fecha ASC;
    `;

    // 2. Serie Nivel País (id_registro = 8 / Total Registrado)
    const queryNacion = `
      WITH nacion_raw AS (
        SELECT 
          fecha,
          cantidad_con_estacionalidad as total_puestos,
          cantidad_sin_estacionalidad as total_puestos_se
        FROM sipa
        WHERE id_provincia = 1 AND id_registro = 8
      ),
      nacion_calc AS (
        SELECT 
          fecha,
          total_puestos,
          total_puestos_se,
          ROUND(
            (
              ((total_puestos_se - LAG(total_puestos_se, 1) OVER (ORDER BY fecha))
              / NULLIF(LAG(total_puestos_se, 1) OVER (ORDER BY fecha), 0)) * 100
            )::numeric, 1
          ) as var_mensual,
          ROUND(
            (
              ((total_puestos - LAG(total_puestos, 12) OVER (ORDER BY fecha))
              / NULLIF(LAG(total_puestos, 12) OVER (ORDER BY fecha), 0)) * 100
            )::numeric, 1
          ) as var_interanual
        FROM nacion_raw
      )
      SELECT 
        TO_CHAR(fecha, 'YYYY-MM-DD') as fecha,
        total_puestos,
        var_mensual,
        var_interanual
      FROM nacion_calc
      ORDER BY fecha ASC;
    `;

    // 3. Desglose Nacional por id_registro
    const queryRegistros = `
      SELECT 
        TO_CHAR(s.fecha, 'YYYY-MM-DD') as fecha,
        s.id_registro,
        s.cantidad_con_estacionalidad as cantidad
      FROM sipa s
      WHERE s.id_provincia = 1 AND s.id_registro != 8
      ORDER BY s.fecha DESC, s.id_registro ASC;
    `;

    // 4. Regiones
    const queryRegiones = `
      SELECT DISTINCT 
        COALESCE(reg.id_region, 1) as id_region, 
        COALESCE(reg.nombre_region, 'Nación') as nombre_region 
      FROM dicc_region reg
      WHERE reg.nombre_region IS NOT NULL
      ORDER BY id_region ASC;
    `;

    // 5. Fechas únicas
    const queryFechas = `
      SELECT DISTINCT TO_CHAR(fecha, 'YYYY-MM-DD') as fecha 
      FROM sipa 
      WHERE fecha IS NOT NULL
      ORDER BY fecha DESC;
    `;

    const [resProvincias, resNacion, resRegistros, resRegiones, resFechas] = await Promise.all([
      client.query(queryProvincias),
      client.query(queryNacion),
      client.query(queryRegistros),
      client.query(queryRegiones),
      client.query(queryFechas),
    ]);

    client.release();

    return NextResponse.json(
      {
        serieProvincias: resProvincias.rows,
        serieNacion: resNacion.rows,
        desgloseRegistros: resRegistros.rows,
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
    console.error('Error fetching SIPA data:', error);
    return NextResponse.json(
      { error: 'Error al consultar datos de SIPA', details: error.message },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}