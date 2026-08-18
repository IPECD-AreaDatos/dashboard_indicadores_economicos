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

    // 1. Serie Provincial (Sector Privado / id_registro = 1 ó 2)
    const queryProvincias = `
      WITH sipa_calc AS (
        SELECT 
          s.fecha,
          s.id_provincia,
          prov.nombre_provincia,
          reg.id_region,
          reg.nombre_region,
          s.cantidad_con_estacionalidad,
          s.cantidad_sin_estacionalidad,
          ROUND(
            (
              ((s.cantidad_sin_estacionalidad - LAG(s.cantidad_sin_estacionalidad, 1) OVER (PARTITION BY s.id_provincia ORDER BY s.fecha))
              / NULLIF(LAG(s.cantidad_sin_estacionalidad, 1) OVER (PARTITION BY s.id_provincia ORDER BY s.fecha), 0)) * 100
            )::numeric, 2
          ) as var_mensual,
          ROUND(
            (
              ((s.cantidad_sin_estacionalidad - LAG(s.cantidad_sin_estacionalidad, 12) OVER (PARTITION BY s.id_provincia ORDER BY s.fecha))
              / NULLIF(LAG(s.cantidad_sin_estacionalidad, 12) OVER (PARTITION BY s.id_provincia ORDER BY s.fecha), 0)) * 100
            )::numeric, 2
          ) as var_interanual
        FROM sipa s
        LEFT JOIN dicc_provincia prov ON s.id_provincia = prov.id_provincia
        LEFT JOIN dicc_region reg ON prov.id_region = reg.id_region
        WHERE s.id_registro IN (1, 2)
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
      ORDER BY fecha ASC;
    `;

    // 2. Serie Total Nación (id_registro = 8 ó suma total nacional)
    const queryNacion = `
      WITH nacion_totales AS (
        SELECT 
          fecha,
          SUM(COALESCE(cantidad_sin_estacionalidad, cantidad_con_estacionalidad, 0)) as total_puestos
        FROM sipa
        GROUP BY fecha
      ),
      nacion_calc AS (
        SELECT 
          fecha,
          total_puestos,
          ROUND(
            (
              ((total_puestos - LAG(total_puestos, 1) OVER (ORDER BY fecha))
              / NULLIF(LAG(total_puestos, 1) OVER (ORDER BY fecha), 0)) * 100
            )::numeric, 2
          ) as var_mensual,
          ROUND(
            (
              ((total_puestos - LAG(total_puestos, 12) OVER (ORDER BY fecha))
              / NULLIF(LAG(total_puestos, 12) OVER (ORDER BY fecha), 0)) * 100
            )::numeric, 2
          ) as var_interanual
        FROM nacion_totales
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
        SUM(COALESCE(s.cantidad_sin_estacionalidad, s.cantidad_con_estacionalidad, 0)) as cantidad
      FROM sipa s
      GROUP BY s.fecha, s.id_registro
      ORDER BY s.fecha DESC, s.id_registro ASC;
    `;

    // 4. Regiones y Fechas
    const queryRegiones = `
      SELECT DISTINCT reg.id_region, reg.nombre_region 
      FROM sipa s
      JOIN dicc_provincia prov ON s.id_provincia = prov.id_provincia
      JOIN dicc_region reg ON prov.id_region = reg.id_region
      WHERE reg.nombre_region IS NOT NULL
      ORDER BY reg.nombre_region ASC;
    `;

    const queryFechas = `
      SELECT DISTINCT TO_CHAR(fecha, 'YYYY-MM-DD') as fecha 
      FROM sipa 
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

    return NextResponse.json({
      serieProvincias: resProvincias.rows,
      serieNacion: resNacion.rows,
      desgloseRegistros: resRegistros.rows,
      regiones: resRegiones.rows,
      fechasDisponibles: resFechas.rows.map((r) => r.fecha),
    });
  } catch (error: any) {
    console.error('Error fetching SIPA data:', error);
    return NextResponse.json(
      { error: 'Error al consultar datos de SIPA', details: error.message },
      { status: 500 }
    );
  }
}