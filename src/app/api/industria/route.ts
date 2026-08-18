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

    // 1. IPICorr (Corrientes) con todas sus aperturas
    const qIpicorr = `
      SELECT 
        TO_CHAR(fecha, 'YYYY-MM-DD') as fecha,
        vim_nivel_general as ipicorr_men,
        var_ia_nivel_general as ipicorr_ia,
        vim_alimentos as ipicorr_alim_men,
        var_ia_alimentos as ipicorr_alim_ia,
        vim_maderas as ipicorr_mad_men,
        var_ia_maderas as ipicorr_mad_ia,
        vim_metales as ipicorr_met_men,
        var_ia_metales as ipicorr_met_ia,
        vim_min_nometalicos as ipicorr_min_men,
        var_ia_min_nometalicos as ipicorr_min_ia,
        vim_textil as ipicorr_tex_men,
        var_ia_textil as ipicorr_tex_ia
      FROM ipicorr
      ORDER BY fecha ASC;
    `;

    // 2. IPI Nación con variaciones
    const qIpi = `
      SELECT 
        TO_CHAR(fecha, 'YYYY-MM-DD') as fecha,
        var_mensual_ipi_manufacturero as ipi_nac_men,
        ROUND((((ipi_manufacturero - LAG(ipi_manufacturero, 12) OVER (ORDER BY fecha)) / NULLIF(LAG(ipi_manufacturero, 12) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as ipi_nac_ia,
        var_mensual_alimentos as ipi_nac_alim_men,
        ROUND((((alimentos - LAG(alimentos, 12) OVER (ORDER BY fecha)) / NULLIF(LAG(alimentos, 12) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as ipi_nac_alim_ia,
        var_mensual_maderas as ipi_nac_mad_men,
        ROUND((((maderas - LAG(maderas, 12) OVER (ORDER BY fecha)) / NULLIF(LAG(maderas, 12) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as ipi_nac_mad_ia,
        var_mensual_textil as ipi_nac_tex_men,
        ROUND((((textil - LAG(textil, 12) OVER (ORDER BY fecha)) / NULLIF(LAG(textil, 12) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as ipi_nac_tex_ia,
        var_mensual_min_no_metalicos as ipi_nac_min_no_met_men,
        ROUND((((min_no_metalicos - LAG(min_no_metalicos, 12) OVER (ORDER BY fecha)) / NULLIF(LAG(min_no_metalicos, 12) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as ipi_nac_min_no_met_ia,
        var_mensual_min_metales as ipi_nac_min_met_men,
        ROUND((((min_metales - LAG(min_metales, 12) OVER (ORDER BY fecha)) / NULLIF(LAG(min_metales, 12) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as ipi_nac_min_met_ia
      FROM ipi
      ORDER BY fecha ASC;
    `;

    // 3. EMAE Variaciones
    const qEmae = `
      SELECT 
        TO_CHAR(fecha, 'YYYY-MM-DD') as fecha,
        variacion_mensual as emae_men,
        variacion_interanual as emae_ia
      FROM emae_variaciones
      ORDER BY fecha ASC;
    `;

    const [resIpicorr, resIpi, resEmae] = await Promise.all([
      client.query(qIpicorr),
      client.query(qIpi),
      client.query(qEmae),
    ]);

    client.release();

    return NextResponse.json({
      ipicorr: resIpicorr.rows,
      ipiNacion: resIpi.rows,
      emae: resEmae.rows,
    });
  } catch (error: any) {
    console.error('Error fetching Industria data:', error);
    return NextResponse.json(
      { error: 'Error al consultar datos de industria', details: error.message },
      { status: 500 }
    );
  }
}