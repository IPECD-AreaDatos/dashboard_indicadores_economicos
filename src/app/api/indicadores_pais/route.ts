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

    // Normalizamos todas las fuentes al primer día de cada mes (YYYY-MM-01)
    const query = `
      WITH 
      ripte_m AS (
        SELECT 
          DATE_TRUNC('month', fecha)::date as fecha_m,
          AVG(valor) as valor
        FROM ripte
        GROUP BY 1
      ),
      ripte_calc AS (
        SELECT 
          fecha_m,
          valor as ripte_val,
          ROUND((((valor - LAG(valor, 1) OVER (ORDER BY fecha_m)) / NULLIF(LAG(valor, 1) OVER (ORDER BY fecha_m), 0)) * 100)::numeric, 1) as ripte_men,
          ROUND((((valor - LAG(valor, 12) OVER (ORDER BY fecha_m)) / NULLIF(LAG(valor, 12) OVER (ORDER BY fecha_m), 0)) * 100)::numeric, 1) as ripte_ia
        FROM ripte_m
      ),
      smvm_m AS (
        SELECT 
          DATE_TRUNC('month', fecha)::date as fecha_m,
          AVG(salario_mvm_mensual) as valor
        FROM salario_mvm
        GROUP BY 1
      ),
      smvm_calc AS (
        SELECT 
          fecha_m,
          valor as smvm_val,
          ROUND((((valor - LAG(valor, 1) OVER (ORDER BY fecha_m)) / NULLIF(LAG(valor, 1) OVER (ORDER BY fecha_m), 0)) * 100)::numeric, 1) as smvm_men,
          ROUND((((valor - LAG(valor, 12) OVER (ORDER BY fecha_m)) / NULLIF(LAG(valor, 12) OVER (ORDER BY fecha_m), 0)) * 100)::numeric, 1) as smvm_ia
        FROM smvm_m
      ),
      cbt_cba_m AS (
        SELECT 
          DATE_TRUNC('month', fecha)::date as fecha_m,
          AVG(COALESCE(cbt_hogar, cbt_adulto)) as cbt_val,
          AVG(COALESCE(cba_hogar, cba_adulto)) as cba_val
        FROM cbt_cba
        GROUP BY 1
      ),
      cbt_cba_calc AS (
        SELECT 
          fecha_m,
          cbt_val,
          cba_val,
          ROUND((((cbt_val - LAG(cbt_val, 1) OVER (ORDER BY fecha_m)) / NULLIF(LAG(cbt_val, 1) OVER (ORDER BY fecha_m), 0)) * 100)::numeric, 1) as cbt_men,
          ROUND((((cbt_val - LAG(cbt_val, 12) OVER (ORDER BY fecha_m)) / NULLIF(LAG(cbt_val, 12) OVER (ORDER BY fecha_m), 0)) * 100)::numeric, 1) as cbt_ia,
          ROUND((((cba_val - LAG(cba_val, 1) OVER (ORDER BY fecha_m)) / NULLIF(LAG(cba_val, 1) OVER (ORDER BY fecha_m), 0)) * 100)::numeric, 1) as cba_men,
          ROUND((((cba_val - LAG(cba_val, 12) OVER (ORDER BY fecha_m)) / NULLIF(LAG(cba_val, 12) OVER (ORDER BY fecha_m), 0)) * 100)::numeric, 1) as cba_ia
        FROM cbt_cba_m
      ),
      is_m AS (
        SELECT 
          DATE_TRUNC('month', fecha)::date as fecha_m,
          AVG(is_indice_total) as is_total_val,
          AVG(is_total_registrado) as is_reg_val,
          AVG(is_sector_no_registrado) as is_no_reg_val
        FROM indice_salario
        GROUP BY 1
      ),
      is_calc AS (
        SELECT 
          fecha_m,
          is_total_val,
          is_reg_val,
          is_no_reg_val,
          ROUND((((is_total_val - LAG(is_total_val, 1) OVER (ORDER BY fecha_m)) / NULLIF(LAG(is_total_val, 1) OVER (ORDER BY fecha_m), 0)) * 100)::numeric, 1) as is_total_men,
          ROUND((((is_total_val - LAG(is_total_val, 12) OVER (ORDER BY fecha_m)) / NULLIF(LAG(is_total_val, 12) OVER (ORDER BY fecha_m), 0)) * 100)::numeric, 1) as is_total_ia,
          ROUND((((is_reg_val - LAG(is_reg_val, 1) OVER (ORDER BY fecha_m)) / NULLIF(LAG(is_reg_val, 1) OVER (ORDER BY fecha_m), 0)) * 100)::numeric, 1) as is_reg_men,
          ROUND((((is_reg_val - LAG(is_reg_val, 12) OVER (ORDER BY fecha_m)) / NULLIF(LAG(is_reg_val, 12) OVER (ORDER BY fecha_m), 0)) * 100)::numeric, 1) as is_reg_ia,
          ROUND((((is_no_reg_val - LAG(is_no_reg_val, 1) OVER (ORDER BY fecha_m)) / NULLIF(LAG(is_no_reg_val, 1) OVER (ORDER BY fecha_m), 0)) * 100)::numeric, 1) as is_no_reg_men,
          ROUND((((is_no_reg_val - LAG(is_no_reg_val, 12) OVER (ORDER BY fecha_m)) / NULLIF(LAG(is_no_reg_val, 12) OVER (ORDER BY fecha_m), 0)) * 100)::numeric, 1) as is_no_reg_ia
        FROM is_m
      ),
      ipc_m AS (
        SELECT 
          DATE_TRUNC('month', fecha)::date as fecha_m,
          AVG(valor) as ipc_val,
          AVG(var_mensual) as ipc_men,
          AVG(var_interanual) as ipc_ia
        FROM ipc
        WHERE id_region IS NULL OR id_region = 0 OR id_region = 1
        GROUP BY 1
      ),
      all_months AS (
        SELECT fecha_m FROM ripte_m
        UNION
        SELECT fecha_m FROM smvm_m
        UNION
        SELECT fecha_m FROM cbt_cba_m
        UNION
        SELECT fecha_m FROM is_m
        UNION
        SELECT fecha_m FROM ipc_m
      )
      SELECT 
        TO_CHAR(am.fecha_m, 'YYYY-MM-DD') as fecha,
        r.ripte_val, r.ripte_men, r.ripte_ia,
        s.smvm_val, s.smvm_men, s.smvm_ia,
        c.cbt_val, c.cbt_men, c.cbt_ia,
        c.cba_val, c.cba_men, c.cba_ia,
        i.is_total_val, i.is_total_men, i.is_total_ia,
        i.is_reg_val, i.is_reg_men, i.is_reg_ia,
        i.is_no_reg_val, i.is_no_reg_men, i.is_no_reg_ia,
        p.ipc_val, p.ipc_men, p.ipc_ia
      FROM all_months am
      LEFT JOIN ripte_calc r ON am.fecha_m = r.fecha_m
      LEFT JOIN smvm_calc s ON am.fecha_m = s.fecha_m
      LEFT JOIN cbt_cba_calc c ON am.fecha_m = c.fecha_m
      LEFT JOIN is_calc i ON am.fecha_m = i.fecha_m
      LEFT JOIN ipc_m p ON am.fecha_m = p.fecha_m
      ORDER BY am.fecha_m ASC;
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