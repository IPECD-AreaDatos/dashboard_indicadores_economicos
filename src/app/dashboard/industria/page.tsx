'use client';

import { withBasePath } from '../../../lib/basePath';
import { useEffect, useState } from 'react';
import Link from 'next/link';
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
import { ArrowRight } from 'lucide-react';
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
  const [selectedYear, setSelectedYear] = useState<string>('TODOS');
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

  useEffect(() => {
    if (!rawData) return;

    const ipicorrRows = rawData.ipicorr || [];
    const ipiNacRows = rawData.ipiNacion || [];
    const emaeRows = rawData.emae || [];

    // Colección de todas las fechas disponibles
    const dateMap: { [key: string]: any } = {};

    // 1. Integrar IPICorr
    ipicorrRows.forEach((r: any) => {
      if (!dateMap[r.fecha]) dateMap[r.fecha] = { fecha: r.fecha };
      Object.assign(dateMap[r.fecha], r);
    });

    // 2. Integrar IPI Nación
    ipiNacRows.forEach((r: any) => {
      if (!dateMap[r.fecha]) dateMap[r.fecha] = { fecha: r.fecha };
      Object.assign(dateMap[r.fecha], r);
    });

    // 3. Integrar EMAE
    emaeRows.forEach((r: any) => {
      if (!dateMap[r.fecha]) dateMap[r.fecha] = { fecha: r.fecha };
      Object.assign(dateMap[r.fecha], r);
    });

    // Ordenar fechas y formatear puntos del gráfico
    const sortedDates = Object.keys(dateMap).sort();
    const formattedPoints: any[] = [];

    sortedDates.forEach((fechaStr) => {
      const yearStr = fechaStr.substring(0, 4);
      if (selectedYear !== 'TODOS' && yearStr !== selectedYear) return;

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
        const val = viewMode === 'mensual' ? Number(row[ind.menKey]) : Number(row[ind.iaKey]);
        point[ind.key] = isNaN(val) ? null : val;
      });

      formattedPoints.push(point);
    });

    setChartData(formattedPoints);
  }, [rawData, viewMode, selectedYear]);

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
                Var. i.a.
              </button>
            </div>

            <div className={styles.yearFilter}>
              {['TODOS', '2024', '2025', '2026'].map((yr) => (
                <button
                  key={yr}
                  className={`${styles.yearBtn} ${selectedYear === yr ? styles.yearBtnActive : ''}`}
                  onClick={() => setSelectedYear(yr)}
                >
                  {yr === 'TODOS' ? 'Todos' : yr}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '80px', textAlign: 'center', color: '#64748b' }}>
              Cargando indicadores industriales...
            </div>
          ) : (
            <div className={styles.chartScrollArea}>
              <div className={styles.chartCanvas}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="fechaLabel" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} unit="%" />
                    <Tooltip formatter={formatTooltipValue} />
                    <Legend />
                    {AVAILABLE_SERIES.filter((i) => activeIndicators.includes(i.key)).map((ind) => (
                      <Line
                        key={ind.key}
                        type="monotone"
                        dataKey={ind.key}
                        name={ind.label}
                        stroke={ind.color}
                        strokeWidth={ind.key === 'ipicorr' ? 3 : 2}
                        dot={{ r: ind.key === 'ipicorr' ? 4 : 3 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <p className={styles.footerNote}>
            Fuente: IPECD en base a INDEC y relevamientos sectoriales.
          </p>
        </div>

        {/* Panel Lateral de Checkboxes y Enlaces */}
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