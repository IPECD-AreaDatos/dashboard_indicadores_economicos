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

    const { searchParams } = new URL(request.url);
    const fechaParam = searchParams.get('fecha');

    // 1. Fechas únicas disponibles
    const qFechas = `
      SELECT DISTINCT TO_CHAR(fecha, 'YYYY-MM-DD') as fecha 
      FROM srt 
      WHERE fecha IS NOT NULL
      ORDER BY fecha DESC;
    `;

    // 2. Sectores únicos
    const qSectores = `
      SELECT DISTINCT desc_seccion as sector 
      FROM dicc_srt 
      WHERE desc_seccion IS NOT NULL 
      ORDER BY desc_seccion ASC;
    `;

    // 3. Regiones reales (excluyendo Nación)
    const qRegiones = `
      SELECT DISTINCT reg.id_region, reg.nombre_region 
      FROM dicc_region reg 
      WHERE reg.nombre_region IS NOT NULL 
        AND LOWER(reg.nombre_region) NOT LIKE '%nacion%'
      ORDER BY reg.nombre_region ASC;
    `;

    const [resFechas, resSectores, resRegiones] = await Promise.all([
      client.query(qFechas),
      client.query(qSectores),
      client.query(qRegiones),
    ]);

    const fechasDisponibles = resFechas.rows.map((r) => r.fecha);
    const fechaTarget = fechaParam || fechasDisponibles[0];

    // 4. Agrupación precisa: aseguramos la masa salarial real
    const qData = `
      WITH srt_clean AS (
        SELECT 
          id_provincia,
          id_seccion,
          COALESCE(cant_personas_trabaj_up, 0) as trabajadores,
          CASE 
            WHEN COALESCE(remuneracion, 0) > 0 AND remuneracion >= COALESCE(salario, 0) 
            THEN remuneracion
            WHEN COALESCE(salario, 0) > 0 
            THEN salario * COALESCE(cant_personas_trabaj_up, 0)
            ELSE COALESCE(remuneracion, 0)
          END as masa_salarial
        FROM srt
        WHERE fecha = $1::date
          AND id_provincia IS NOT NULL 
          AND id_provincia > 0
      ),
      srt_mes AS (
        SELECT 
          id_provincia,
          id_seccion,
          SUM(trabajadores) as trabajadores,
          SUM(masa_salarial) as masa_salarial
        FROM srt_clean
        GROUP BY id_provincia, id_seccion
      )
      SELECT 
        s.id_provincia,
        prov.nombre_provincia,
        reg.id_region,
        reg.nombre_region,
        d.desc_seccion as sector,
        s.trabajadores,
        s.masa_salarial,
        CASE 
          WHEN s.trabajadores > 0 
          THEN ROUND((s.masa_salarial / s.trabajadores)::numeric, 0)
          ELSE 0 
        END as salario_promedio
      FROM srt_mes s
      JOIN dicc_provincia prov ON s.id_provincia = prov.id_provincia
      LEFT JOIN dicc_region reg ON prov.id_region = reg.id_region
      LEFT JOIN (
        SELECT DISTINCT id_seccion, desc_seccion 
        FROM dicc_srt
      ) d ON s.id_seccion = d.id_seccion
      WHERE prov.nombre_provincia IS NOT NULL;
    `;

    const resData = await client.query(qData, [fechaTarget]);
    client.release();

    return NextResponse.json(
      {
        datos: resData.rows,
        sectores: resSectores.rows.map((r) => r.sector),
        regiones: resRegiones.rows,
        fechasDisponibles,
        fechaActiva: fechaTarget,
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
    console.error('Error fetching SRT data:', error);
    return NextResponse.json(
      { error: 'Error al consultar SRT', details: error.message },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}