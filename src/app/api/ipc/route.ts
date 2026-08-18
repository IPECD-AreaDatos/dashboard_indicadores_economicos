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

    // 1. Serie Histórica Nivel General (id_division = 0 o id_categoria = 0 según tu base)
    const querySerie = `
      SELECT 
        TO_CHAR(i.fecha, 'YYYY-MM-DD') as fecha,
        i.id_region,
        COALESCE(r.nombre_region, 'Nacion') as nombre_region,
        i.valor,
        i.var_mensual,
        i.var_interanual,
        i.var_acumulada
      FROM ipc i
      LEFT JOIN dicc_region r ON i.id_region = r.id_region
      WHERE (i.id_division = 0 OR i.id_division IS NULL) 
        AND (i.id_subdivision = 0 OR i.id_subdivision IS NULL)
      ORDER BY i.fecha ASC;
    `;

    // 2. Aperturas y Subdivisiones con Nombres de Diccionarios
    const queryAperturas = `
      SELECT 
        TO_CHAR(i.fecha, 'YYYY-MM-DD') as fecha,
        i.id_region,
        COALESCE(r.nombre_region, 'Nacion') as nombre_region,
        i.id_categoria,
        COALESCE(cat.nombre, 'General') as nombre_categoria,
        i.id_division,
        COALESCE(div.nombre, d.nombre, 'Nivel general') as nombre_division,
        i.id_subdivision,
        i.valor,
        i.var_mensual,
        i.var_interanual,
        i.var_acumulada
      FROM ipc i
      LEFT JOIN dicc_region r ON i.id_region = r.id_region
      LEFT JOIN ipc_categoria cat ON i.id_categoria = cat.id_categoria
      LEFT JOIN ipc_division div ON i.id_division = div.id_division AND i.id_categoria = div.id_categoria
      LEFT JOIN dicc_ipc d ON i.id_subdivision = d.id_subdivision AND i.id_division = d.id_division
      ORDER BY i.fecha DESC, i.var_interanual DESC;
    `;

    // 3. Regiones
    const queryRegiones = `
      SELECT DISTINCT i.id_region, COALESCE(r.nombre_region, 'Nacion') as nombre_region
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
    console.error('Error fetching IPC data:', error);
    return NextResponse.json(
      { error: 'Error al consultar las tablas de IPC', details: error.message },
      { status: 500 }
    );
  }
}