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

    // 1. Consultar la serie histórica con datos de provincia y región
    const querySerie = `
      SELECT 
        TO_CHAR(p.fecha, 'YYYY-MM-DD') as fecha,
        p.id_provincia,
        prov.nombre_provincia,
        reg.id_region,
        reg.nombre_region,
        p.puestos_de_trabajo,
        p.porcentaje_var_mensual as puestos_var_mensual,
        p.porcentaje_var_interanual as puestos_var_interanual,
        a.cant_empresas,
        a.porcentaje_var_interanual as empresas_var_interanual,
        s.salario_promedio
      FROM ieric_puestos_trabajo p
      LEFT JOIN dicc_provincia prov ON p.id_provincia = prov.id_provincia
      LEFT JOIN dicc_region reg ON prov.id_region = reg.id_region
      LEFT JOIN ieric_actividad a ON p.fecha = a.fecha AND p.id_provincia = a.id_provincia
      LEFT JOIN ieric_salario s ON p.fecha = s.fecha AND p.id_provincia = s.id_provincia
      ORDER BY p.fecha ASC;
    `;

    // 2. Traer SOLO las regiones que sí tienen datos en la tabla IERIC
    const queryRegiones = `
      SELECT DISTINCT reg.id_region, reg.nombre_region 
      FROM ieric_puestos_trabajo p
      JOIN dicc_provincia prov ON p.id_provincia = prov.id_provincia
      JOIN dicc_region reg ON prov.id_region = reg.id_region
      WHERE reg.nombre_region IS NOT NULL
      ORDER BY reg.nombre_region ASC;
    `;

    // 3. Fechas disponibles únicas
    const queryFechas = `
      SELECT DISTINCT TO_CHAR(fecha, 'YYYY-MM-DD') as fecha
      FROM ieric_puestos_trabajo 
      ORDER BY fecha DESC;
    `;

    const [resSerie, resRegiones, resFechas] = await Promise.all([
      client.query(querySerie),
      client.query(queryRegiones),
      client.query(queryFechas),
    ]);

    client.release();

    return NextResponse.json({
      serie: resSerie.rows,
      regiones: resRegiones.rows,
      fechasDisponibles: resFechas.rows.map((r) => r.fecha),
    });
  } catch (error: any) {
    console.error('Error fetching IERIC data:', error);
    return NextResponse.json(
      { error: 'Error al consultar las tablas de IERIC', details: error.message },
      { status: 500 }
    );
  }
}