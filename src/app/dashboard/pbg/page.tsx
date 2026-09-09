'use client';

import { withBasePath } from '../../../lib/basePath';
import { useEffect, useState, useMemo } from 'react';
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
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ULTIMOS_5');
  const [dataAnual, setDataAnual] = useState<any[]>([]);
  const [dataTrimestral, setDataTrimestral] = useState<any[]>([]);
  const [desglosado, setDesglosado] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedYearDesglose, setSelectedYearDesglose] = useState<number>(2024);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(withBasePath('/api/pbg'));
        const json = await res.json();

        if (json.anual) {
          const formattedAnual = json.anual.map((r: any) => ({
            anio: String(r.anio),
            label: String(r.anio),
            valor: Number(r.valor) || 0,
            variacion: Number(r.variacion) || 0,
          }));
          setDataAnual(formattedAnual);
        }

        if (json.trimestral) {
          const formattedTrim = json.trimestral.map((r: any) => ({
            anio: String(r.anio),
            label: `${r.anio}-${r.trimestre.startsWith('T') ? r.trimestre : `T${r.trimestre}`}`,
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

  const availableYears = useMemo(() => {
    const list = freq === 'anual' ? dataAnual : dataTrimestral;
    const yearsSet = new Set<string>();
    list.forEach((r) => {
      if (r.anio) yearsSet.add(r.anio);
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [freq, dataAnual, dataTrimestral]);

  const filteredChartData = useMemo(() => {
    const source = freq === 'anual' ? dataAnual : dataTrimestral;
    if (source.length === 0) return [];

    if (selectedPeriod === 'ULTIMOS_5') {
      return source.slice(freq === 'anual' ? -5 : -8);
    }
    if (selectedPeriod === 'ULTIMOS_10') {
      return source.slice(freq === 'anual' ? -10 : -16);
    }
    if (selectedPeriod !== 'TODOS') {
      return source.filter((r) => r.anio === selectedPeriod);
    }
    return source;
  }, [freq, dataAnual, dataTrimestral, selectedPeriod]);

  const rawActiveData = freq === 'anual' ? dataAnual : dataTrimestral;
  const lastItem = rawActiveData.length > 0 ? rawActiveData[rawActiveData.length - 1] : null;

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
              onClick={() => {
                setFreq('anual');
                setSelectedPeriod('ULTIMOS_5');
              }}
            >
              Anual
            </button>
            <button
              className={`${styles.freqBtn} ${freq === 'trimestral' ? styles.freqBtnActive : ''}`}
              onClick={() => {
                setFreq('trimestral');
                setSelectedPeriod('ULTIMOS_5');
              }}
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

            {/* Selector Desplegable de Período */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Período:</span>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="ULTIMOS_5">
                  {freq === 'anual' ? 'Últimos 5 años' : 'Últimos 8 trimestres (2 años)'}
                </option>
                <option value="ULTIMOS_10">
                  {freq === 'anual' ? 'Últimos 10 años' : 'Últimos 16 trimestres (4 años)'}
                </option>
                <optgroup label="Por Año Específico">
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      Año {yr}
                    </option>
                  ))}
                </optgroup>
                <option value="TODOS">Toda la serie histórica</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '80px', textAlign: 'center', color: '#64748b' }}>
              Cargando datos del PBG...
            </div>
          ) : (
            <div className={styles.chartCanvas}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredChartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fontWeight: 600, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 12, fontWeight: 600, fill: '#475569' }} unit="%" />
                  <Tooltip formatter={formatTooltipValue} />
                  <Line
                    type="monotone"
                    dataKey="variacion"
                    name="Variación %"
                    stroke="#15803d"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#15803d' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <p className={styles.footerNote}>
            Fuente: IMI — Valor Agregado Bruto a Precios Constantes del 2004.
          </p>
        </div>

        {/* KPIs Lateral */}
        <div className={styles.kpiColumn}>
          <div className={styles.dateDisplay}>
            {freq === 'anual' ? `Año ${lastItem?.label || '2024'}` : `Período ${lastItem?.label || '2023-TIV'}`}
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiSubtitle}>Valor Agregado Bruto Total</div>
            <div className={styles.kpiMainVal}>
              ${lastItem ? (lastItem.valor / 1000).toLocaleString('es-AR', { maximumFractionDigits: 2 }) : '-'} mill.
            </div>
            <div className={styles.kpiSubtitle}>A Precios Constantes del 2004</div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiSubtitle}>Variación del Período</div>
            <div
              className={styles.kpiMainVal}
              style={{ color: (lastItem?.variacion || 0) >= 0 ? '#16a34a' : '#dc2626' }}
            >
              {lastItem ? `${lastItem.variacion > 0 ? '+' : ''}${lastItem.variacion.toFixed(1)}%` : '-'}
            </div>
            <div className={styles.kpiSubtitle}>Respecto al período anterior</div>
          </div>
        </div>
      </div>

      {/* Sección Desglose por Actividades Económicas */}
      <div className={styles.desgloseSection}>
        <div className={styles.desgloseHeader}>
          <div>
            <h2 className={styles.desgloseTitle}>Estructura y Desglose por Actividad Económica</h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>
              Cifras expresadas en miles de pesos a precios constantes de 2004
            </p>
          </div>

          <select
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontWeight: 700,
              backgroundColor: '#ffffff',
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
                <th>Valor (miles de $ a precios de 2004)</th>
                <th>Variación Interanual</th>
              </tr>
            </thead>
            <tbody>
              {desgloseFiltrado.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 700, color: '#1e2d4a' }}>{row.letra}</td>
                  <td style={{ fontWeight: row.letra === 'PBG' ? 800 : 500 }}>{row.descripcion}</td>
                  <td style={{ fontWeight: 700 }}>
                    ${Number(row.valor || 0).toLocaleString('es-AR')}
                  </td>
                  <td
                    style={{
                      fontWeight: 700,
                      color: Number(row.variacion_interanual || 0) >= 0 ? '#16a34a' : '#dc2626',
                    }}
                  >
                    {row.variacion_interanual !== null && row.variacion_interanual !== undefined
                      ? `${Number(row.variacion_interanual) > 0 ? '+' : ''}${Number(row.variacion_interanual).toFixed(1)}%`
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