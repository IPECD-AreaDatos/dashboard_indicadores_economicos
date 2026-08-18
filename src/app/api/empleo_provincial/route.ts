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

    // 1. Datos agrupados por fecha, provincia y sección
    const queryData = `
      SELECT 
        TO_CHAR(s.fecha, 'YYYY-MM-DD') as fecha,
        s.id_provincia,
        prov.nombre_provincia,
        reg.id_region,
        reg.nombre_region,
        d.desc_seccion as sector,
        SUM(s.cant_personas_trabaj_up) as trabajadores,
        ROUND(AVG(NULLIF(s.salario, 0))::numeric, 2) as salario_promedio
      FROM srt s
      LEFT JOIN dicc_provincia prov ON s.id_provincia = prov.id_provincia
      LEFT JOIN dicc_region reg ON prov.id_region = reg.id_region
      LEFT JOIN dicc_srt d ON s.id_seccion = d.id_seccion
      GROUP BY s.fecha, s.id_provincia, prov.nombre_provincia, reg.id_region, reg.nombre_region, d.desc_seccion
      ORDER BY s.fecha DESC;
    `;

    // 2. Sectores únicos
    const querySectores = `
      SELECT DISTINCT desc_seccion as sector
      FROM dicc_srt
      WHERE desc_seccion IS NOT NULL
      ORDER BY desc_seccion ASC;
    `;

    // 3. Regiones
    const queryRegiones = `
      SELECT DISTINCT reg.id_region, reg.nombre_region
      FROM dicc_region reg
      JOIN dicc_provincia prov ON reg.id_region = prov.id_region
      JOIN srt s ON prov.id_provincia = s.id_provincia
      ORDER BY reg.nombre_region ASC;
    `;

    // 4. Fechas únicas
    const queryFechas = `
      SELECT DISTINCT TO_CHAR(fecha, 'YYYY-MM-DD') as fecha
      FROM srt
      ORDER BY fecha DESC;
    `;

    const [resData, resSectores, resRegiones, resFechas] = await Promise.all([
      client.query(queryData),
      client.query(querySectores),
      client.query(queryRegiones),
      client.query(queryFechas)
    ]);

    client.release();

    return NextResponse.json({
      datos: resData.rows,
      sectores: resSectores.rows.map((r) => r.sector),
      regiones: resRegiones.rows,
      fechasDisponibles: resFechas.rows.map((r) => r.fecha)
    });
  } catch (error: any) {
    console.error('Error fetching SRT data:', error);
    return NextResponse.json(
      { error: 'Error al consultar las tablas de SRT', details: error.message },
      { status: 500 }
    );
  }
}