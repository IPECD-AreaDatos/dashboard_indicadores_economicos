import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.HOST_DBB2,
  port: Number(process.env.PORT_DBB2) || 5432,
  user: process.env.USER_DBB2,
  password: process.env.PASSWORD_DBB2,
  database: process.env.DB_DWH || 'dwh_economico',
  ssl: false,
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get('tipo') || 'interanual';

  const tabla = tipo === 'intermensual' ? 'semaforo_intermensual' : 'semaforo_interanual';

  try {
    const client = await pool.connect();
    const query = `
      SELECT 
        fecha,
        combustible_vendido,
        patentamiento_0km_auto,
        patentamiento_0km_motocicleta,
        pasajeros_salidos_terminal_corrientes,
        pasajeros_aeropuerto_corrientes,
        venta_supermercados_autoservicios_mayoristas,
        exportaciones_aduana_corrientes_dolares,
        exportaciones_aduana_corrientes_toneladas,
        empleo_privado_registrado_sipa
      FROM ${tabla}
      ORDER BY fecha DESC;
    `;

    const result = await client.query(query);
    client.release();

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching semaforo data:', error);
    return NextResponse.json(
      { error: 'Error al conectar con la base de datos', details: error.message },
      { status: 500 }
    );
  }
}