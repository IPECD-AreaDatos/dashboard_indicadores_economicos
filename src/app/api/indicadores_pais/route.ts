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

    // Unificamos las series macroeconómicas por fecha calculando variaciones
    const query = `
      WITH 
      ripte_calc AS (
        SELECT 
          fecha,
          valor as ripte_val,
          ROUND((((valor - LAG(valor, 1) OVER (ORDER BY fecha)) / NULLIF(LAG(valor, 1) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as ripte_men,
          ROUND((((valor - LAG(valor, 12) OVER (ORDER BY fecha)) / NULLIF(LAG(valor, 12) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as ripte_ia
        FROM ripte
      ),
      smvm_calc AS (
        SELECT 
          fecha,
          salario_mvm_mensual as smvm_val,
          ROUND((((salario_mvm_mensual - LAG(salario_mvm_mensual, 1) OVER (ORDER BY fecha)) / NULLIF(LAG(salario_mvm_mensual, 1) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as smvm_men,
          ROUND((((salario_mvm_mensual - LAG(salario_mvm_mensual, 12) OVER (ORDER BY fecha)) / NULLIF(LAG(salario_mvm_mensual, 12) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as smvm_ia
        FROM salario_mvm
      ),
      cbt_cba_calc AS (
        SELECT 
          fecha,
          COALESCE(cbt_hogar, cbt_adulto) as cbt_val,
          COALESCE(cba_hogar, cba_adulto) as cba_val,
          ROUND((((COALESCE(cbt_hogar, cbt_adulto) - LAG(COALESCE(cbt_hogar, cbt_adulto), 1) OVER (ORDER BY fecha)) / NULLIF(LAG(COALESCE(cbt_hogar, cbt_adulto), 1) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as cbt_men,
          ROUND((((COALESCE(cbt_hogar, cbt_adulto) - LAG(COALESCE(cbt_hogar, cbt_adulto), 12) OVER (ORDER BY fecha)) / NULLIF(LAG(COALESCE(cbt_hogar, cbt_adulto), 12) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as cbt_ia,
          ROUND((((COALESCE(cba_hogar, cba_adulto) - LAG(COALESCE(cba_hogar, cba_adulto), 1) OVER (ORDER BY fecha)) / NULLIF(LAG(COALESCE(cba_hogar, cba_adulto), 1) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as cba_men,
          ROUND((((COALESCE(cba_hogar, cba_adulto) - LAG(COALESCE(cba_hogar, cba_adulto), 12) OVER (ORDER BY fecha)) / NULLIF(LAG(COALESCE(cba_hogar, cba_adulto), 12) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as cba_ia
        FROM cbt_cba
      ),
      is_calc AS (
        SELECT 
          fecha,
          is_indice_total as is_total_val,
          is_total_registrado as is_reg_val,
          is_sector_no_registrado as is_no_reg_val,
          ROUND((((is_indice_total - LAG(is_indice_total, 1) OVER (ORDER BY fecha)) / NULLIF(LAG(is_indice_total, 1) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as is_total_men,
          ROUND((((is_indice_total - LAG(is_indice_total, 12) OVER (ORDER BY fecha)) / NULLIF(LAG(is_indice_total, 12) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as is_total_ia,
          ROUND((((is_total_registrado - LAG(is_total_registrado, 1) OVER (ORDER BY fecha)) / NULLIF(LAG(is_total_registrado, 1) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as is_reg_men,
          ROUND((((is_total_registrado - LAG(is_total_registrado, 12) OVER (ORDER BY fecha)) / NULLIF(LAG(is_total_registrado, 12) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as is_reg_ia,
          ROUND((((is_sector_no_registrado - LAG(is_sector_no_registrado, 1) OVER (ORDER BY fecha)) / NULLIF(LAG(is_sector_no_registrado, 1) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as is_no_reg_men,
          ROUND((((is_sector_no_registrado - LAG(is_sector_no_registrado, 12) OVER (ORDER BY fecha)) / NULLIF(LAG(is_sector_no_registrado, 12) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as is_no_reg_ia
        FROM indice_salario
      ),
      ipc_calc AS (
        SELECT 
          fecha,
          valor as ipc_val,
          var_mensual as ipc_men,
          var_interanual as ipc_ia
        FROM ipc
        WHERE id_region IS NULL OR id_region = 0 OR id_region = 1
      ),
      all_fechas AS (
        SELECT DISTINCT fecha FROM ripte
        UNION
        SELECT DISTINCT fecha FROM salario_mvm
        UNION
        SELECT DISTINCT fecha FROM cbt_cba
        UNION
        SELECT DISTINCT fecha FROM indice_salario
        UNION
        SELECT DISTINCT fecha FROM ipc
      )
      SELECT 
        TO_CHAR(af.fecha, 'YYYY-MM-DD') as fecha,
        r.ripte_val, r.ripte_men, r.ripte_ia,
        s.smvm_val, s.smvm_men, s.smvm_ia,
        c.cbt_val, c.cbt_men, c.cbt_ia,
        c.cba_val, c.cba_men, c.cba_ia,
        i.is_total_val, i.is_total_men, i.is_total_ia,
        i.is_reg_val, i.is_reg_men, i.is_reg_ia,
        i.is_no_reg_val, i.is_no_reg_men, i.is_no_reg_ia,
        p.ipc_val, p.ipc_men, p.ipc_ia
      FROM all_fechas af
      LEFT JOIN ripte_calc r ON af.fecha = r.fecha
      LEFT JOIN smvm_calc s ON af.fecha = s.fecha
      LEFT JOIN cbt_cba_calc c ON af.fecha = c.fecha
      LEFT JOIN is_calc i ON af.fecha = i.fecha
      LEFT JOIN ipc_calc p ON af.fecha = p.fecha
      ORDER BY af.fecha ASC;
    `;

    const result = await client.query(query);
    client.release();

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching Indicadores Pais data:', error);
    return NextResponse.json(
      { error: 'Error al consultar indicadores país', details: error.message },
      { status: 500 }
    );
  }
}