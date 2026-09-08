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
  Legend,
  ResponsiveContainer,
} from 'recharts';
import styles from './Industria.module.css';

interface IndicatorItem {
  key: string;
  label: string;
  color: string;
  defaultChecked: boolean;
  menKey: string;
  iaKey: string;
}

const AVAILABLE_SERIES: IndicatorItem[] = [
  // --- CORRIENTES ---
  { key: 'ipicorr', label: 'IPICorr', color: '#15803d', defaultChecked: true, menKey: 'ipicorr_men', iaKey: 'ipicorr_ia' },
  { key: 'ipicorr_alim', label: 'IPICorr Alimentos', color: '#65a30d', defaultChecked: false, menKey: 'ipicorr_alim_men', iaKey: 'ipicorr_alim_ia' },
  { key: 'ipicorr_mad', label: 'IPICorr Maderas', color: '#a16207', defaultChecked: false, menKey: 'ipicorr_mad_men', iaKey: 'ipicorr_mad_ia' },
  { key: 'ipicorr_met', label: 'IPICorr Metales', color: '#475569', defaultChecked: false, menKey: 'ipicorr_met_men', iaKey: 'ipicorr_met_ia' },
  { key: 'ipicorr_min', label: 'IPICorr Min. no metálicos', color: '#ca8a04', defaultChecked: false, menKey: 'ipicorr_min_men', iaKey: 'ipicorr_min_ia' },
  { key: 'ipicorr_tex', label: 'IPICorr Textil', color: '#0d9488', defaultChecked: false, menKey: 'ipicorr_tex_men', iaKey: 'ipicorr_tex_ia' },

  // --- NACIÓN ---
  { key: 'ipi_nac', label: 'IPI Nación', color: '#84cc16', defaultChecked: true, menKey: 'ipi_nac_men', iaKey: 'ipi_nac_ia' },
  { key: 'ipi_nac_alim', label: 'IPI Nación Alimentos', color: '#eab308', defaultChecked: false, menKey: 'ipi_nac_alim_men', iaKey: 'ipi_nac_alim_ia' },
  { key: 'ipi_nac_mad', label: 'IPI Nación Maderas', color: '#b45309', defaultChecked: false, menKey: 'ipi_nac_mad_men', iaKey: 'ipi_nac_mad_ia' },
  { key: 'ipi_nac_tex', label: 'IPI Nación Textil', color: '#06b6d4', defaultChecked: false, menKey: 'ipi_nac_tex_men', iaKey: 'ipi_nac_tex_ia' },
  { key: 'ipi_nac_min_no_met', label: 'IPI Nación Min. no metálicos', color: '#8b5cf6', defaultChecked: false, menKey: 'ipi_nac_min_no_met_men', iaKey: 'ipi_nac_min_no_met_ia' },
  { key: 'ipi_nac_min_met', label: 'IPI Nación Metales', color: '#94a3b8', defaultChecked: false, menKey: 'ipi_nac_min_met_men', iaKey: 'ipi_nac_min_met_ia' },

  // --- ACTIVIDAD GLOBAL ---
  { key: 'emae', label: 'EMAE', color: '#0284c7', defaultChecked: true, menKey: 'emae_men', iaKey: 'emae_ia' },
];

export default function IndustriaPage() {
  const [viewMode, setViewMode] = useState<'mensual' | 'interanual'>('mensual');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ULTIMOS_12'); // Por defecto últimos 12 meses
  const [activeIndicators, setActiveIndicators] = useState<string[]>(
    AVAILABLE_SERIES.filter((i) => i.defaultChecked).map((i) => i.key)
  );

  const [rawData, setRawData] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(withBasePath('/api/industria'));
        const json = await res.json();
        setRawData(json);
      } catch (err) {
        console.error('Error cargando indicadores industriales:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Extraer lista de años disponibles en los datos
  const availableYears = useMemo(() => {
    if (!rawData) return [];
    const yearsSet = new Set<string>();
    const all = [...(rawData.ipicorr || []), ...(rawData.ipiNacion || []), ...(rawData.emae || [])];
    all.forEach((r) => {
      if (r.fecha) yearsSet.add(r.fecha.substring(0, 4));
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [rawData]);

  useEffect(() => {
    if (!rawData) return;

    const ipicorrRows = rawData.ipicorr || [];
    const ipiNacRows = rawData.ipiNacion || [];
    const emaeRows = rawData.emae || [];

    const dateMap: { [key: string]: any } = {};

    ipicorrRows.forEach((r: any) => {
      if (!dateMap[r.fecha]) dateMap[r.fecha] = { fecha: r.fecha };
      Object.assign(dateMap[r.fecha], r);
    });

    ipiNacRows.forEach((r: any) => {
      if (!dateMap[r.fecha]) dateMap[r.fecha] = { fecha: r.fecha };
      Object.assign(dateMap[r.fecha], r);
    });

    emaeRows.forEach((r: any) => {
      if (!dateMap[r.fecha]) dateMap[r.fecha] = { fecha: r.fecha };
      Object.assign(dateMap[r.fecha], r);
    });

    const sortedDates = Object.keys(dateMap).sort();
    const allPoints: any[] = [];

    sortedDates.forEach((fechaStr) => {
      const dateParts = fechaStr.split('-');
      const yearShort = dateParts[0] ? dateParts[0].slice(-2) : '';
      const monthNum = parseInt(dateParts[1], 10);
      const monthsEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const monthLabel = monthsEs[monthNum - 1] || 'mes';

      const point: any = {
        fechaLabel: `${monthLabel}-${yearShort}`,
        fecha: fechaStr,
      };

      const row = dateMap[fechaStr];

      AVAILABLE_SERIES.forEach((ind) => {
        const rawVal = viewMode === 'mensual' ? row[ind.menKey] : row[ind.iaKey];
        const val = Number(rawVal);
        point[ind.key] = rawVal !== null && rawVal !== undefined && !isNaN(val) ? val : null;
      });

      allPoints.push(point);
    });

    // Aplicar filtro de período
    let filteredPoints = allPoints;

    if (selectedPeriod === 'ULTIMOS_12') {
      filteredPoints = allPoints.slice(-12);
    } else if (selectedPeriod === 'ULTIMOS_24') {
      filteredPoints = allPoints.slice(-24);
    } else if (selectedPeriod === 'ULTIMOS_36') {
      filteredPoints = allPoints.slice(-36);
    } else if (selectedPeriod !== 'TODOS') {
      filteredPoints = allPoints.filter((p) => p.fecha.startsWith(selectedPeriod));
    }

    setChartData(filteredPoints);
  }, [rawData, viewMode, selectedPeriod]);

  const toggleIndicator = (key: string) => {
    setActiveIndicators((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const formatTooltipValue = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>INDICADORES INDUSTRIALES / ACTIVIDAD</h1>
          <p>NIVEL PAÍS • PROVINCIA DE CORRIENTES</p>
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* Gráfico Recharts */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.modeControls}>
              <button
                className={`${styles.modeBtn} ${viewMode === 'mensual' ? styles.modeBtnActive : ''}`}
                onClick={() => setViewMode('mensual')}
              >
                Evolución de la variación intermensual
              </button>
              <button
                className={`${styles.modeBtn} ${viewMode === 'interanual' ? styles.modeBtnActive : ''}`}
                onClick={() => setViewMode('interanual')}
              >
                Var. interanual
              </button>
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
                <option value="ULTIMOS_12">Últimos 12 meses</option>
                <option value="ULTIMOS_24">Últimos 2 años (24 m.)</option>
                <option value="ULTIMOS_36">Últimos 3 años (36 m.)</option>
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
              Cargando indicadores industriales...
            </div>
          ) : (
            <div className={styles.chartScrollArea}>
              <div className={styles.chartCanvas} style={{ height: '520px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="fechaLabel" tick={{ fontSize: 12, fontWeight: 600, fill: '#475569' }} />
                    <YAxis tick={{ fontSize: 12, fontWeight: 600, fill: '#475569' }} unit="%" />
                    <Tooltip formatter={formatTooltipValue} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    {AVAILABLE_SERIES.filter((i) => activeIndicators.includes(i.key)).map((ind) => (
                      <Line
                        key={ind.key}
                        type="monotone"
                        dataKey={ind.key}
                        name={ind.label}
                        stroke={ind.color}
                        strokeWidth={ind.key === 'ipicorr' ? 3 : 2}
                        connectNulls={true}
                        dot={{ r: ind.key === 'ipicorr' ? 4 : 3, fill: ind.color }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <p className={styles.footerNote}>
            Fuente: IMI en base a INDEC y relevamientos sectoriales.
          </p>
        </div>

        {/* Panel Lateral de Checkboxes */}
        <div className={styles.sidebarColumn}>
          <div className={styles.indicatorsCard}>
            <div className={styles.badgeIndicators}>Indicadores</div>
            <div className={styles.indicatorsList}>
              {AVAILABLE_SERIES.map((ind) => (
                <label key={ind.key} className={styles.indicatorItem}>
                  <input
                    type="checkbox"
                    checked={activeIndicators.includes(ind.key)}
                    onChange={() => toggleIndicator(ind.key)}
                  />
                  <span className={styles.colorBullet} style={{ backgroundColor: ind.color }} />
                  <span>{ind.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}