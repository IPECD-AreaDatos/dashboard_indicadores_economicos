'use client';

import { withBasePath } from '../../../lib/basePath';
import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import styles from './Pbg.module.css';

export default function PbgPage() {
  const [freq, setFreq] = useState<'anual' | 'trimestral'>('anual');
  const [dataAnual, setDataAnual] = useState<any[]>([]);
  const [dataTrimestral, setDataTrimestral] = useState<any[]>([]);
  const [desglosado, setDesglosado] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedYearDesglose, setSelectedYearDesglose] = useState<number>(2023);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(withBasePath('/api/pbg'));
        const json = await res.json();

        if (json.anual) {
          const totalAnual = json.anual.filter((r: any) => r.actividad === 'A' || !r.actividad);
          const formattedAnual = (totalAnual.length > 0 ? totalAnual : json.anual.slice(0, 20)).map((r: any) => ({
            label: String(r.anio),
            valor: Number(r.valor) || 0,
            variacion: Number(r.variacion) || 0,
          }));
          setDataAnual(formattedAnual);
        }

        if (json.trimestral) {
          const totalTrim = json.trimestral.filter((r: any) => r.actividad === 'A' || !r.actividad);
          const formattedTrim = (totalTrim.length > 0 ? totalTrim : json.trimestral.slice(0, 40)).map((r: any) => ({
            label: `${r.anio}-T${r.trimestre}`,
            valor: Number(r.valor) || 0,
            variacion: Number(r.variacion) || 0,
          }));
          setDataTrimestral(formattedTrim);
        }

        if (json.desglosado) {
          setDesglosado(json.desglosado);
          if (json.desglosado.length > 0) {
            setSelectedYearDesglose(Number(json.desglosado[0].anio));
          }
        }
      } catch (err) {
        console.error('Error cargando PBG:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const activeChartData = freq === 'anual' ? dataAnual : dataTrimestral;
  const lastItem = activeChartData.length > 0 ? activeChartData[activeChartData.length - 1] : null;

  const desgloseFiltrado = desglosado.filter((d) => Number(d.anio) === selectedYearDesglose);
  const anosDesglose = Array.from(new Set(desglosado.map((d) => Number(d.anio)))).sort((a, b) => b - a);

  const formatTooltipValue = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>PRODUCTO BRUTO GEOGRÁFICO (PBG)</h1>
          <p>PROVINCIA DE CORRIENTES • EVOLUCIÓN MACROECONÓMICA Y SECTORIAL</p>
        </div>

        <div className={styles.topControls}>
          <div className={styles.freqSelector}>
            <button
              className={`${styles.freqBtn} ${freq === 'anual' ? styles.freqBtnActive : ''}`}
              onClick={() => setFreq('anual')}
            >
              Anual
            </button>
            <button
              className={`${styles.freqBtn} ${freq === 'trimestral' ? styles.freqBtnActive : ''}`}
              onClick={() => setFreq('trimestral')}
            >
              Trimestral
            </button>
          </div>
        </div>
      </div>

      {/* Grid Principal */}
      <div className={styles.mainGrid}>
        {/* Gráfico de Línea */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.badgeCategory}>
              {freq === 'anual' ? 'Evolución Anual del PBG' : 'Evolución Trimestral del PBG'}
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '80px', textAlign: 'center', color: '#64748b' }}>
              Cargando datos del PBG...
            </div>
          ) : (
            <div className={styles.chartCanvas}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} unit="%" />
                  <Tooltip formatter={formatTooltipValue} />
                  <Line
                    type="monotone"
                    dataKey="variacion"
                    name="Variación %"
                    stroke="#15803d"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#15803d' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <p className={styles.footerNote}>
            Fuente: IPECD — Valor Agregado Bruto a Precios Constantes.
          </p>
        </div>

        {/* KPIs Lateral */}
        <div className={styles.kpiColumn}>
          <div className={styles.dateDisplay}>Año {lastItem?.label || '2023'}</div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiSubtitle}>Valor Agregado Bruto</div>
            <div className={styles.kpiMainVal}>
              ${lastItem ? (lastItem.valor / 1000).toFixed(2) : '11,09'} mill.
            </div>
            <div className={styles.kpiSubtitle}>A Precios Constantes del 2004</div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiSubtitle}>Variación del Período</div>
            <div
              className={styles.kpiMainVal}
              style={{ color: (lastItem?.variacion || 0) >= 0 ? '#16a34a' : '#dc2626' }}
            >
              {lastItem ? `${lastItem.variacion.toFixed(1)}%` : '-0,1%'}
            </div>
            <div className={styles.kpiSubtitle}>Respecto al período anterior</div>
          </div>
        </div>
      </div>

      {/* Sección Desglose por Actividades Económicas */}
      <div className={styles.desgloseSection}>
        <div className={styles.desgloseHeader}>
          <h2 className={styles.desgloseTitle}>Estructura y Desglose por Actividad Económica</h2>
          <select
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontWeight: 600,
            }}
            value={selectedYearDesglose}
            onChange={(e) => setSelectedYearDesglose(Number(e.target.value))}
          >
            {anosDesglose.map((a) => (
              <option key={a} value={a}>
                Año {a}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción del Sector</th>
                <th>Valor ($)</th>
                <th>Variación Interanual</th>
              </tr>
            </thead>
            <tbody>
              {desgloseFiltrado.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 700, color: '#1e2d4a' }}>{row.letra}</td>
                  <td>{row.descripcion}</td>
                  <td style={{ fontWeight: 600 }}>
                    ${Number(row.valor || 0).toLocaleString('es-AR')}
                  </td>
                  <td
                    style={{
                      fontWeight: 700,
                      color: Number(row.variacion_interanual || 0) >= 0 ? '#16a34a' : '#dc2626',
                    }}
                  >
                    {row.variacion_interanual
                      ? `${Number(row.variacion_interanual).toFixed(1)}%`
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}