'use client';

import { useEffect, useState } from 'react';
import styles from './Semaforo.module.css';

interface SemaforoRow {
  fecha: string;
  combustible_vendido: number | null;
  empleo_privado_registrado_sipa: number | null;
  exportaciones_aduana_corrientes_dolares: number | null;
  exportaciones_aduana_corrientes_toneladas: number | null;
  pasajeros_salidos_terminal_corrientes: number | null;
  pasajeros_aeropuerto_corrientes: number | null;
  patentamiento_0km_auto: number | null;
  patentamiento_0km_motocicleta: number | null;
  venta_supermercados_autoservicios_mayoristas: number | null;
}

export default function SemaforoPage() {
  const [tipo, setTipo] = useState<'interanual' | 'intermensual'>('interanual');
  const [data, setData] = useState<SemaforoRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/semaforo?tipo=${tipo}`);
        const json = await res.json();
        if (Array.isArray(json)) {
          setData(json); // Carga todo el historial
        }
      } catch (err) {
        console.error('Error al cargar datos del semáforo:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [tipo]);

  const formatVal = (rawVal: number | null) => {
    if (rawVal === null || rawVal === undefined) return null;
    return Math.abs(rawVal) < 1 && rawVal !== 0 ? rawVal * 100 : rawVal;
  };

  // Clasificación de los 6 niveles
  const getCellClass = (rawVal: number | null) => {
    const val = formatVal(rawVal);
    if (val === null) return styles.colorNeutral;
    
    if (val < -5) return styles.redDark;        // Rojo Oscuro
    if (val < 0) return styles.redLight;        // Rojo Claro
    if (val <= 3) return styles.yellowLight;    // Amarillo Claro
    if (val <= 7) return styles.yellowDark;     // Amarillo Oscuro
    if (val <= 15) return styles.greenLight;    // Verde Claro
    return styles.greenDark;                    // Verde Oscuro
  };

  const formatPercent = (rawVal: number | null) => {
    const val = formatVal(rawVal);
    if (val === null) return '-';
    return `${val.toFixed(1).replace('.', ',')}%`;
  };

  const formatFecha = (fechaStr: string) => {
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return { trim: '-', mes: fechaStr };

    const year = d.getFullYear().toString().slice(-2);
    const monthIndex = d.getMonth();
    const quarter = Math.floor(monthIndex / 3) + 1;

    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return {
      trim: `T${quarter}-${year}`,
      mes: meses[monthIndex]
    };
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>SEMÁFORO DE INDICADORES</h1>
          <p>CORRIENTES</p>
        </div>
      </div>

      <div className={styles.controlsBar}>
        <div className={styles.badge}>
          {tipo === 'interanual' ? 'Variaciones interanuales' : 'Variaciones mensuales'}
        </div>

        <button
          onClick={() => setTipo(tipo === 'interanual' ? 'intermensual' : 'interanual')}
          className={styles.toggleBtn}
        >
          {tipo === 'interanual' ? 'Ver Semáforo Intermensual' : 'Ver Semáforo Interanual'}
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          Cargando datos del semáforo...
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Trimestre</th>
                <th>Mes</th>
                <th>Combustible Vendido</th>
                <th>SIPA privado registrado</th>
                <th>Exportaciones Aduana Corrientes (US$)</th>
                <th>Exportaciones Aduana Corrientes (Tn.)</th>
                <th>Pasajeros terminal Corrientes</th>
                <th>Pasajeros Aeropuerto Corrientes</th>
                <th>Patentamiento automóviles</th>
                <th>Patentamiento motocicletas</th>
                <th>Ventas autoservicios mayoristas</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => {
                const { trim, mes } = formatFecha(row.fecha);
                return (
                  <tr key={idx}>
                    <td className={styles.fixedCol}>{trim}</td>
                    <td className={styles.fixedCol}>{mes}</td>
                    <td className={getCellClass(row.combustible_vendido)}>{formatPercent(row.combustible_vendido)}</td>
                    <td className={getCellClass(row.empleo_privado_registrado_sipa)}>{formatPercent(row.empleo_privado_registrado_sipa)}</td>
                    <td className={getCellClass(row.exportaciones_aduana_corrientes_dolares)}>{formatPercent(row.exportaciones_aduana_corrientes_dolares)}</td>
                    <td className={getCellClass(row.exportaciones_aduana_corrientes_toneladas)}>{formatPercent(row.exportaciones_aduana_corrientes_toneladas)}</td>
                    <td className={getCellClass(row.pasajeros_salidos_terminal_corrientes)}>{formatPercent(row.pasajeros_salidos_terminal_corrientes)}</td>
                    <td className={getCellClass(row.pasajeros_aeropuerto_corrientes)}>{formatPercent(row.pasajeros_aeropuerto_corrientes)}</td>
                    <td className={getCellClass(row.patentamiento_0km_auto)}>{formatPercent(row.patentamiento_0km_auto)}</td>
                    <td className={getCellClass(row.patentamiento_0km_motocicleta)}>{formatPercent(row.patentamiento_0km_motocicleta)}</td>
                    <td className={getCellClass(row.venta_supermercados_autoservicios_mayoristas)}>{formatPercent(row.venta_supermercados_autoservicios_mayoristas)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}