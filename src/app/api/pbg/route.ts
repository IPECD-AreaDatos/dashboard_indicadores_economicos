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

    // 1. Serie Anual TOTAL PBG combinando pbg_valor_anual y pbg_anual_desglosado
    const queryAnual = `
      WITH combined_anual AS (
        SELECT 
          "Año"::int as anio,
          "Valor"::numeric as valor
        FROM pbg_valor_anual
        WHERE UPPER(TRIM(COALESCE("Actividad", ''))) = 'PBG' 
           OR UPPER(TRIM(COALESCE("Variable", ''))) = 'PBG'
        
        UNION
        
        SELECT 
          "año"::int as anio,
          valor::numeric as valor
        FROM pbg_anual_desglosado
        WHERE UPPER(TRIM(COALESCE(letra, ''))) = 'PBG'
      ),
      dedup_anual AS (
        SELECT 
          anio, 
          MAX(valor) as valor
        FROM combined_anual
        GROUP BY anio
      )
      SELECT 
        anio,
        valor,
        ROUND(
          (
            ((valor - LAG(valor, 1) OVER (ORDER BY anio)) 
            / NULLIF(LAG(valor, 1) OVER (ORDER BY anio), 0)) * 100
          )::numeric, 1
        ) as variacion
      FROM dedup_anual
      ORDER BY anio ASC;
    `;

    // 2. Serie Trimestral TOTAL PBG
    const queryTrimestral = `
      WITH trim_raw AS (
        SELECT 
          "Año"::int as anio,
          "Trimestre"::text as trimestre,
          "Valor"::numeric as valor
        FROM pbg_valor_trimestral
        WHERE UPPER(TRIM(COALESCE("Actividad", ''))) = 'PBG' 
           OR UPPER(TRIM(COALESCE("Variable", ''))) = 'PBG'
        ORDER BY "Año" ASC, "Trimestre" ASC
      )
      SELECT 
        anio,
        trimestre,
        valor,
        ROUND(
          (
            ((valor - LAG(valor, 1) OVER (ORDER BY anio, trimestre)) 
            / NULLIF(LAG(valor, 1) OVER (ORDER BY anio, trimestre), 0)) * 100
          )::numeric, 1
        ) as variacion
      FROM trim_raw;
    `;

    // 3. Desglose Sectorial por Actividad
    const queryDesglosado = `
      SELECT 
        letra,
        descripcion,
        "año" as anio,
        valor,
        ROUND((CASE WHEN ABS(COALESCE(variacion_interanual, 0)) < 1 AND COALESCE(variacion_interanual, 0) != 0 THEN variacion_interanual * 100 ELSE variacion_interanual END)::numeric, 1) as variacion_interanual
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