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

    // 1. IPC (Nación y NEA)
    const qIpc = `
      SELECT 
        TO_CHAR(i.fecha, 'YYYY-MM-DD') as fecha,
        COALESCE(r.nombre_region, 'Nacion') as region,
        COALESCE(i.var_mensual, 0) as var_mensual,
        COALESCE(i.var_interanual, 0) as var_interanual,
        COALESCE(i.var_acumulada, 0) as var_acumulada
      FROM ipc i
      LEFT JOIN dicc_region r ON i.id_region = r.id_region
      LEFT JOIN ipc_division div ON i.id_division = div.id_division
      WHERE (
        i.id_division = 1
        OR LOWER(COALESCE(div.nombre, '')) LIKE '%nivel general%'
      )
      ORDER BY i.fecha ASC;
    `;

    // 2. Canastas (CBT y CBA Hogar)
    const qCbtCba = `
      SELECT 
        TO_CHAR(fecha, 'YYYY-MM-DD') as fecha,
        cbt_hogar,
        cba_hogar,
        ROUND((((cbt_hogar - LAG(cbt_hogar, 1) OVER (ORDER BY fecha)) / NULLIF(LAG(cbt_hogar, 1) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as cbt_men,
        ROUND((((cbt_hogar - LAG(cbt_hogar, 12) OVER (ORDER BY fecha)) / NULLIF(LAG(cbt_hogar, 12) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as cbt_ia,
        ROUND((((cba_hogar - LAG(cba_hogar, 1) OVER (ORDER BY fecha)) / NULLIF(LAG(cba_hogar, 1) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as cba_men,
        ROUND((((cba_hogar - LAG(cba_hogar, 12) OVER (ORDER BY fecha)) / NULLIF(LAG(cba_hogar, 12) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as cba_ia
      FROM cbt_cba
      ORDER BY fecha ASC;
    `;

    // 3. SIPA (Nación y Corrientes)
    const qSipa = `
      WITH sipa_ctes AS (
        SELECT 
          s.fecha,
          'Corrientes' as ambito,
          s.cantidad_sin_estacionalidad as puestos,
          ROUND((((s.cantidad_sin_estacionalidad - LAG(s.cantidad_sin_estacionalidad, 1) OVER (ORDER BY s.fecha)) / NULLIF(LAG(s.cantidad_sin_estacionalidad, 1) OVER (ORDER BY s.fecha), 0)) * 100)::numeric, 1) as var_mensual,
          ROUND((((s.cantidad_sin_estacionalidad - LAG(s.cantidad_sin_estacionalidad, 12) OVER (ORDER BY s.fecha)) / NULLIF(LAG(s.cantidad_sin_estacionalidad, 12) OVER (ORDER BY s.fecha), 0)) * 100)::numeric, 1) as var_interanual
        FROM sipa s
        JOIN dicc_provincia prov ON s.id_provincia = prov.id_provincia
        WHERE LOWER(prov.nombre_provincia) = 'corrientes' AND s.id_registro IN (1, 2)
      ),
      sipa_nac AS (
        SELECT 
          fecha,
          'Nacion' as ambito,
          SUM(cantidad_sin_estacionalidad) as puestos,
          ROUND((((SUM(cantidad_sin_estacionalidad) - LAG(SUM(cantidad_sin_estacionalidad), 1) OVER (ORDER BY fecha)) / NULLIF(LAG(SUM(cantidad_sin_estacionalidad), 1) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as var_mensual,
          ROUND((((SUM(cantidad_sin_estacionalidad) - LAG(SUM(cantidad_sin_estacionalidad), 12) OVER (ORDER BY fecha)) / NULLIF(LAG(SUM(cantidad_sin_estacionalidad), 12) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as var_interanual
        FROM sipa
        WHERE id_registro IN (1, 2)
        GROUP BY fecha
      )
      SELECT TO_CHAR(fecha, 'YYYY-MM-DD') as fecha, ambito, puestos, var_mensual, var_interanual FROM sipa_ctes
      UNION ALL
      SELECT TO_CHAR(fecha, 'YYYY-MM-DD') as fecha, ambito, puestos, var_mensual, var_interanual FROM sipa_nac
      ORDER BY fecha ASC;
    `;

    // 4. SRT (Nación y Corrientes)
    const qSrt = `
      WITH srt_ctes AS (
        SELECT 
          s.fecha,
          'Corrientes' as ambito,
          SUM(s.cant_personas_trabaj_up) as trabajadores,
          ROUND(AVG(NULLIF(s.salario, 0))::numeric, 0) as salario_promedio
        FROM srt s
        JOIN dicc_provincia prov ON s.id_provincia = prov.id_provincia
        WHERE LOWER(prov.nombre_provincia) = 'corrientes'
        GROUP BY s.fecha
      ),
      srt_nac AS (
        SELECT 
          fecha,
          'Nacion' as ambito,
          SUM(cant_personas_trabaj_up) as trabajadores,
          ROUND(AVG(NULLIF(salario, 0))::numeric, 0) as salario_promedio
        FROM srt
        GROUP BY fecha
      )
      SELECT TO_CHAR(fecha, 'YYYY-MM-DD') as fecha, ambito, trabajadores, salario_promedio FROM srt_ctes
      UNION ALL
      SELECT TO_CHAR(fecha, 'YYYY-MM-DD') as fecha, ambito, trabajadores, salario_promedio FROM srt_nac
      ORDER BY fecha ASC;
    `;

    // 5. RIPTE & SMVM
    const qRipte = `
      SELECT 
        TO_CHAR(fecha, 'YYYY-MM-DD') as fecha,
        valor,
        ROUND((((valor - LAG(valor, 1) OVER (ORDER BY fecha)) / NULLIF(LAG(valor, 1) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as var_mensual,
        ROUND((((valor - LAG(valor, 12) OVER (ORDER BY fecha)) / NULLIF(LAG(valor, 12) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as var_interanual
      FROM ripte
      ORDER BY fecha ASC;
    `;

    const qSmvm = `
      SELECT 
        TO_CHAR(fecha, 'YYYY-MM-DD') as fecha,
        salario_mvm_mensual as valor,
        ROUND((((salario_mvm_mensual - LAG(salario_mvm_mensual, 1) OVER (ORDER BY fecha)) / NULLIF(LAG(salario_mvm_mensual, 1) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as var_mensual,
        ROUND((((salario_mvm_mensual - LAG(salario_mvm_mensual, 12) OVER (ORDER BY fecha)) / NULLIF(LAG(salario_mvm_mensual, 12) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as var_interanual
      FROM salario_mvm
      ORDER BY fecha ASC;
    `;

    // 6. IPI Nación
    const qIpi = `
      SELECT 
        TO_CHAR(fecha, 'YYYY-MM-DD') as fecha,
        ipi_manufacturero,
        var_mensual_ipi_manufacturero as var_mensual,
        ROUND((((ipi_manufacturero - LAG(ipi_manufacturero, 12) OVER (ORDER BY fecha)) / NULLIF(LAG(ipi_manufacturero, 12) OVER (ORDER BY fecha), 0)) * 100)::numeric, 1) as var_interanual
      FROM ipi
      ORDER BY fecha ASC;
    `;

    // 7. IPICorr (Corrientes)
    const qIpicorr = `
      SELECT 
        TO_CHAR(fecha, 'YYYY-MM-DD') as fecha,
        vim_nivel_general as var_mensual,
        var_ia_nivel_general as var_interanual
      FROM ipicorr
      ORDER BY fecha ASC;
    `;

    // 8. IERIC (NEA y Corrientes con puestos y empresas)
    const qIeric = `
      WITH ieric_ctes AS (
        SELECT 
          p.fecha,
          'Corrientes' as ambito,
          p.puestos_de_trabajo as puestos,
          p.porcentaje_var_interanual as puestos_ia,
          a.cant_empresas as empresas,
          a.porcentaje_var_interanual as empresas_ia
        FROM ieric_puestos_trabajo p
        LEFT JOIN ieric_actividad a ON p.fecha = a.fecha AND p.id_provincia = a.id_provincia
        JOIN dicc_provincia prov ON p.id_provincia = prov.id_provincia
        WHERE LOWER(prov.nombre_provincia) = 'corrientes'
      ),
      ieric_nea AS (
        SELECT 
          p.fecha,
          'NEA' as ambito,
          SUM(p.puestos_de_trabajo) as puestos,
          ROUND(AVG(p.porcentaje_var_interanual)::numeric, 1) as puestos_ia,
          SUM(a.cant_empresas) as empresas,
          ROUND(AVG(a.porcentaje_var_interanual)::numeric, 1) as empresas_ia
        FROM ieric_puestos_trabajo p
        LEFT JOIN ieric_actividad a ON p.fecha = a.fecha AND p.id_provincia = a.id_provincia
        JOIN dicc_provincia prov ON p.id_provincia = prov.id_provincia
        JOIN dicc_region reg ON prov.id_region = reg.id_region
        WHERE UPPER(reg.nombre_region) = 'NEA'
        GROUP BY p.fecha
      )
      SELECT TO_CHAR(fecha, 'YYYY-MM-DD') as fecha, ambito, puestos, puestos_ia, empresas, empresas_ia FROM ieric_ctes
      UNION ALL
      SELECT TO_CHAR(fecha, 'YYYY-MM-DD') as fecha, ambito, puestos, puestos_ia, empresas, empresas_ia FROM ieric_nea
      ORDER BY fecha ASC;
    `;

    const [rIpc, rCbtCba, rSipa, rSrt, rRipte, rSmvm, rIpi, rIpicorr, rIeric] = await Promise.all([
      client.query(qIpc),
      client.query(qCbtCba),
      client.query(qSipa),
      client.query(qSrt),
      client.query(qRipte),
      client.query(qSmvm),
      client.query(qIpi),
      client.query(qIpicorr),
      client.query(qIeric),
    ]);

    client.release();

    return NextResponse.json({
      ipc: rIpc.rows,
      cbt_cba: rCbtCba.rows,
      sipa: rSipa.rows,
      srt: rSrt.rows,
      ripte: rRipte.rows,
      smvm: rSmvm.rows,
      ipi: rIpi.rows,
      ipicorr: rIpicorr.rows,
      ieric: rIeric.rows,
    });
  } catch (error: any) {
    console.error('Error en /api/resumen:', error);
    return NextResponse.json(
      { error: 'Error al consultar datos de resumen', details: error.message },
      { status: 500 }
    );
  }
}