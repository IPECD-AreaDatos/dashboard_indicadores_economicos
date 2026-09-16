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

    // 1. IPICorr (Corrientes)
    const qIpicorr = `
      SELECT 
        TO_CHAR(fecha, 'YYYY-MM-DD') as fecha,
        ROUND((CASE WHEN ABS(COALESCE(vim_nivel_general, 0)) < 1 AND COALESCE(vim_nivel_general, 0) != 0 THEN vim_nivel_general * 100 ELSE vim_nivel_general END)::numeric, 1) as ipicorr_men,
        ROUND((CASE WHEN ABS(COALESCE(var_ia_nivel_general, 0)) < 1 AND COALESCE(var_ia_nivel_general, 0) != 0 THEN var_ia_nivel_general * 100 ELSE var_ia_nivel_general END)::numeric, 1) as ipicorr_ia,
        ROUND((CASE WHEN ABS(COALESCE(vim_alimentos, 0)) < 1 AND COALESCE(vim_alimentos, 0) != 0 THEN vim_alimentos * 100 ELSE vim_alimentos END)::numeric, 1) as ipicorr_alim_men,
        ROUND((CASE WHEN ABS(COALESCE(var_ia_alimentos, 0)) < 1 AND COALESCE(var_ia_alimentos, 0) != 0 THEN var_ia_alimentos * 100 ELSE var_ia_alimentos END)::numeric, 1) as ipicorr_alim_ia,
        ROUND((CASE WHEN ABS(COALESCE(vim_maderas, 0)) < 1 AND COALESCE(vim_maderas, 0) != 0 THEN vim_maderas * 100 ELSE vim_maderas END)::numeric, 1) as ipicorr_mad_men,
        ROUND((CASE WHEN ABS(COALESCE(var_ia_maderas, 0)) < 1 AND COALESCE(var_ia_maderas, 0) != 0 THEN var_ia_maderas * 100 ELSE var_ia_maderas END)::numeric, 1) as ipicorr_mad_ia,
        ROUND((CASE WHEN ABS(COALESCE(vim_metales, 0)) < 1 AND COALESCE(vim_metales, 0) != 0 THEN vim_metales * 100 ELSE vim_metales END)::numeric, 1) as ipicorr_met_men,
        ROUND((CASE WHEN ABS(COALESCE(var_ia_metales, 0)) < 1 AND COALESCE(var_ia_metales, 0) != 0 THEN var_ia_metales * 100 ELSE var_ia_metales END)::numeric, 1) as ipicorr_met_ia,
        ROUND((CASE WHEN ABS(COALESCE(vim_min_nometalicos, 0)) < 1 AND COALESCE(vim_min_nometalicos, 0) != 0 THEN vim_min_nometalicos * 100 ELSE vim_min_nometalicos END)::numeric, 1) as ipicorr_min_men,
        ROUND((CASE WHEN ABS(COALESCE(var_ia_min_nometalicos, 0)) < 1 AND COALESCE(var_ia_min_nometalicos, 0) != 0 THEN var_ia_min_nometalicos * 100 ELSE var_ia_min_nometalicos END)::numeric, 1) as ipicorr_min_ia,
        ROUND((CASE WHEN ABS(COALESCE(vim_textil, 0)) < 1 AND COALESCE(vim_textil, 0) != 0 THEN vim_textil * 100 ELSE vim_textil END)::numeric, 1) as ipicorr_tex_men,
        ROUND((CASE WHEN ABS(COALESCE(var_ia_textil, 0)) < 1 AND COALESCE(var_ia_textil, 0) != 0 THEN var_ia_textil * 100 ELSE var_ia_textil END)::numeric, 1) as ipicorr_tex_ia
      FROM ipicorr
      ORDER BY fecha ASC;
    `;

    // 2. IPI Nación (Calcula o multiplica x100 las variaciones reales)
    const qIpi = `
      SELECT 
        TO_CHAR(fecha, 'YYYY-MM-DD') as fecha,
        ROUND(COALESCE(
          CASE WHEN ABS(var_mensual_ipi_manufacturero) < 1 AND var_mensual_ipi_manufacturero != 0 THEN var_mensual_ipi_manufacturero * 100 ELSE var_mensual_ipi_manufacturero END,
          (((ipi_manufacturero - LAG(ipi_manufacturero, 1) OVER (ORDER BY fecha)) / NULLIF(LAG(ipi_manufacturero, 1) OVER (ORDER BY fecha), 0)) * 100)
        )::numeric, 1) as ipi_nac_men,
        ROUND((((ipi_manufacturero - LAG(ipi_manufacturero, 12) OVER (ORDER BY fecha)) / NULLIF(LAG(ipi_manufacturero, 12) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as ipi_nac_ia,
        
        ROUND(COALESCE(
          CASE WHEN ABS(var_mensual_alimentos) < 1 AND var_mensual_alimentos != 0 THEN var_mensual_alimentos * 100 ELSE var_mensual_alimentos END,
          (((alimentos - LAG(alimentos, 1) OVER (ORDER BY fecha)) / NULLIF(LAG(alimentos, 1) OVER (ORDER BY fecha), 0)) * 100)
        )::numeric, 1) as ipi_nac_alim_men,
        ROUND((((alimentos - LAG(alimentos, 12) OVER (ORDER BY fecha)) / NULLIF(LAG(alimentos, 12) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as ipi_nac_alim_ia,

        ROUND(COALESCE(
          CASE WHEN ABS(var_mensual_maderas) < 1 AND var_mensual_maderas != 0 THEN var_mensual_maderas * 100 ELSE var_mensual_maderas END,
          (((maderas - LAG(maderas, 1) OVER (ORDER BY fecha)) / NULLIF(LAG(maderas, 1) OVER (ORDER BY fecha), 0)) * 100)
        )::numeric, 1) as ipi_nac_mad_men,
        ROUND((((maderas - LAG(maderas, 12) OVER (ORDER BY fecha)) / NULLIF(LAG(maderas, 12) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as ipi_nac_mad_ia,

        ROUND(COALESCE(
          CASE WHEN ABS(var_mensual_textil) < 1 AND var_mensual_textil != 0 THEN var_mensual_textil * 100 ELSE var_mensual_textil END,
          (((textil - LAG(textil, 1) OVER (ORDER BY fecha)) / NULLIF(LAG(textil, 1) OVER (ORDER BY fecha), 0)) * 100)
        )::numeric, 1) as ipi_nac_tex_men,
        ROUND((((textil - LAG(textil, 12) OVER (ORDER BY fecha)) / NULLIF(LAG(textil, 12) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as ipi_nac_tex_ia,

        ROUND(COALESCE(
          CASE WHEN ABS(var_mensual_min_no_metalicos) < 1 AND var_mensual_min_no_metalicos != 0 THEN var_mensual_min_no_metalicos * 100 ELSE var_mensual_min_no_metalicos END,
          (((min_no_metalicos - LAG(min_no_metalicos, 1) OVER (ORDER BY fecha)) / NULLIF(LAG(min_no_metalicos, 1) OVER (ORDER BY fecha), 0)) * 100)
        )::numeric, 1) as ipi_nac_min_no_met_men,
        ROUND((((min_no_metalicos - LAG(min_no_metalicos, 12) OVER (ORDER BY fecha)) / NULLIF(LAG(min_no_metalicos, 12) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as ipi_nac_min_no_met_ia,

        ROUND(COALESCE(
          CASE WHEN ABS(var_mensual_min_metales) < 1 AND var_mensual_min_metales != 0 THEN var_mensual_min_metales * 100 ELSE var_mensual_min_metales END,
          (((min_metales - LAG(min_metales, 1) OVER (ORDER BY fecha)) / NULLIF(LAG(min_metales, 1) OVER (ORDER BY fecha), 0)) * 100)
        )::numeric, 1) as ipi_nac_min_met_men,
        ROUND((((min_metales - LAG(min_metales, 12) OVER (ORDER BY fecha)) / NULLIF(LAG(min_metales, 12) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as ipi_nac_min_met_ia
      FROM ipi
      ORDER BY fecha ASC;
    `;

    // 3. EMAE Variaciones
    const qEmae = `
      SELECT 
        TO_CHAR(fecha, 'YYYY-MM-DD') as fecha,
        ROUND((CASE WHEN ABS(COALESCE(variacion_mensual, 0)) < 1 AND COALESCE(variacion_mensual, 0) != 0 THEN variacion_mensual * 100 ELSE variacion_mensual END)::numeric, 1) as emae_men,
        ROUND((CASE WHEN ABS(COALESCE(variacion_interanual, 0)) < 1 AND COALESCE(variacion_interanual, 0) != 0 THEN variacion_interanual * 100 ELSE variacion_interanual END)::numeric, 1) as emae_ia
      FROM emae_variaciones
      ORDER BY fecha ASC;
    `;

    const [resIpicorr, resIpi, resEmae] = await Promise.all([
      client.query(qIpicorr),
      client.query(qIpi),
      client.query(qEmae),
    ]);

    client.release();

    return NextResponse.json(
      {
        ipicorr: resIpicorr.rows,
        ipiNacion: resIpi.rows,
        emae: resEmae.rows,
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
    console.error('Error fetching Industria data:', error);
    return NextResponse.json(
      { error: 'Error al consultar datos de industria', details: error.message },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}