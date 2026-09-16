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

    // 1. Serie histórica combinando puestos y empresas con FULL OUTER JOIN para no perder meses
    const querySerie = `
      WITH combined AS (
        SELECT 
          COALESCE(p.fecha, a.fecha) as fecha,
          COALESCE(p.id_provincia, a.id_provincia) as id_provincia,
          p.puestos_de_trabajo,
          p.porcentaje_var_mensual,
          p.porcentaje_var_interanual as puestos_var_ia,
          a.cant_empresas,
          a.porcentaje_var_interanual as empresas_var_ia
        FROM ieric_puestos_trabajo p
        FULL OUTER JOIN ieric_actividad a 
          ON p.fecha = a.fecha AND p.id_provincia = a.id_provincia
      )
      SELECT 
        TO_CHAR(c.fecha, 'YYYY-MM-DD') as fecha,
        c.id_provincia,
        prov.nombre_provincia,
        reg.id_region,
        reg.nombre_region,
        c.puestos_de_trabajo,
        ROUND((CASE 
          WHEN ABS(COALESCE(c.porcentaje_var_mensual, 0)) < 1 AND COALESCE(c.porcentaje_var_mensual, 0) != 0 
          THEN c.porcentaje_var_mensual * 100 
          ELSE c.porcentaje_var_mensual 
        END)::numeric, 1) as puestos_var_mensual,
        ROUND((CASE 
          WHEN ABS(COALESCE(c.puestos_var_ia, 0)) < 1 AND COALESCE(c.puestos_var_ia, 0) != 0 
          THEN c.puestos_var_ia * 100 
          ELSE c.puestos_var_ia 
        END)::numeric, 1) as puestos_var_interanual,
        c.cant_empresas,
        ROUND((CASE 
          WHEN ABS(COALESCE(c.empresas_var_ia, 0)) < 1 AND COALESCE(c.empresas_var_ia, 0) != 0 
          THEN c.empresas_var_ia * 100 
          ELSE c.empresas_var_ia 
        END)::numeric, 1) as empresas_var_interanual
      FROM combined c
      LEFT JOIN dicc_provincia prov ON c.id_provincia = prov.id_provincia
      LEFT JOIN dicc_region reg ON prov.id_region = reg.id_region
      ORDER BY c.fecha ASC;
    `;

    // 2. Regiones disponibles
    const queryRegiones = `
      SELECT DISTINCT reg.id_region, reg.nombre_region 
      FROM dicc_provincia prov
      JOIN dicc_region reg ON prov.id_region = reg.id_region
      WHERE reg.nombre_region IS NOT NULL
      ORDER BY reg.nombre_region ASC;
    `;

    // 3. Todas las fechas únicas (de puestos y de actividad)
    const queryFechas = `
      SELECT DISTINCT TO_CHAR(fecha, 'YYYY-MM-DD') as fecha FROM ieric_puestos_trabajo
      UNION
      SELECT DISTINCT TO_CHAR(fecha, 'YYYY-MM-DD') as fecha FROM ieric_actividad
      ORDER BY fecha DESC;
    `;

    const [resSerie, resRegiones, resFechas] = await Promise.all([
      client.query(querySerie),
      client.query(queryRegiones),
      client.query(queryFechas),
    ]);

    client.release();

    return NextResponse.json(
      {
        serie: resSerie.rows,
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
    console.error('Error fetching IERIC data:', error);
    return NextResponse.json(
      { error: 'Error al consultar las tablas de IERIC', details: error.message },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}