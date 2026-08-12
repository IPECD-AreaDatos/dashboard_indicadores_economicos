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

    // 1. Serie Anual Totales (filtrando por actividad general o agregada si corresponde)
    const queryAnual = `
      SELECT 
        "Año" as anio,
        "Variable" as variable,
        "Actividad" as actividad,
        "Valor" as valor,
        "Variacion" as variacion
      FROM pbg_valor_anual
      ORDER BY "Año" ASC;
    `;

    // 2. Serie Trimestral
    const queryTrimestral = `
      SELECT 
        "Año" as anio,
        "Trimestre" as trimestre,
        "Variable" as variable,
        "Actividad" as actividad,
        "Valor" as valor,
        "Variacion" as variacion
      FROM pbg_valor_trimestral
      ORDER BY "Año" ASC, "Trimestre" ASC;
    `;

    // 3. Desglose Sectorial por Actividad (pbg_anual_desglosado)
    const queryDesglosado = `
      SELECT 
        letra,
        descripcion,
        "año" as anio,
        valor,
        variacion_interanual
      FROM pbg_anual_desglosado
      ORDER BY "año" DESC, valor DESC;
    `;

    const [resAnual, resTrimestral, resDesglosado] = await Promise.all([
      client.query(queryAnual),
      client.query(queryTrimestral),
      client.query(queryDesglosado),
    ]);

    client.release();

    return NextResponse.json({
      anual: resAnual.rows,
      trimestral: resTrimestral.rows,
      desglosado: resDesglosado.rows,
    });
  } catch (error: any) {
    console.error('Error fetching PBG data:', error);
    return NextResponse.json(
      { error: 'Error al consultar las tablas de PBG en datalake_economico', details: error.message },
      { status: 500 }
    );
  }
}