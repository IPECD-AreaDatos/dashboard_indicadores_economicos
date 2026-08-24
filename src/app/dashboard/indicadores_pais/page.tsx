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
import styles from './Indicadores.module.css';

interface IndicadorConfig {
  key: string;
  label: string;
  color: string;
  defaultActive: boolean;
  valKey: string;
  menKey: string;
  iaKey: string;
}

const AVAILABLE_INDICATORS: IndicadorConfig[] = [
  { key: 'ripte', label: 'RIPTE', color: '#1e3a8a', defaultActive: true, valKey: 'ripte_val', menKey: 'ripte_men', iaKey: 'ripte_ia' },
  { key: 'smvm', label: 'SMVM', color: '#0284c7', defaultActive: true, valKey: 'smvm_val', menKey: 'smvm_men', iaKey: 'smvm_ia' },
  { key: 'cbt', label: 'CBT', color: '#16a34a', defaultActive: true, valKey: 'cbt_val', menKey: 'cbt_men', iaKey: 'cbt_ia' },
  { key: 'cba', label: 'CBA', color: '#ca8a04', defaultActive: true, valKey: 'cba_val', menKey: 'cba_men', iaKey: 'cba_ia' },
  { key: 'ipc', label: 'IPC', color: '#dc2626', defaultActive: false, valKey: 'ipc_val', menKey: 'ipc_men', iaKey: 'ipc_ia' },
  { key: 'is_total', label: 'Índice de Salarios', color: '#9333ea', defaultActive: false, valKey: 'is_total_val', menKey: 'is_total_men', iaKey: 'is_total_ia' },
  { key: 'is_reg', label: 'Salarios Registrados', color: '#0d9488', defaultActive: false, valKey: 'is_reg_val', menKey: 'is_reg_men', iaKey: 'is_reg_ia' },
  { key: 'is_no_reg', label: 'Salarios No Registrados', color: '#ea580c', defaultActive: false, valKey: 'is_no_reg_val', menKey: 'is_no_reg_men', iaKey: 'is_no_reg_ia' },
];

export default function IndicadoresPaisPage() {
  const [viewMode, setViewMode] = useState<'montos' | 'mensual' | 'interanual'>('montos');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ULTIMOS_12'); // Por defecto últimos 12 meses
  const [activeIndicators, setActiveIndicators] = useState<string[]>(
    AVAILABLE_INDICATORS.filter((i) => i.defaultActive).map((i) => i.key)
  );

  const [rawRows, setRawRows] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(withBasePath('/api/indicadores_pais'));
        const json = await res.json();
        if (Array.isArray(json)) {
          setRawRows(json);
        }
      } catch (err) {
        console.error('Error cargando indicadores país:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Lista dinámica de años presentes en la base de datos
  const availableYears = useMemo(() => {
    if (!rawRows || rawRows.length === 0) return [];
    const yearsSet = new Set<string>();
    rawRows.forEach((r) => {
      if (r.fecha) {
        yearsSet.add(r.fecha.substring(0, 4));
      }
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [rawRows]);

  useEffect(() => {
    if (!rawRows || rawRows.length === 0) return;

    // 1. Agrupar por mes
    const monthMap: { [key: string]: any } = {};

    rawRows.forEach((row) => {
      const monthKey = row.fecha ? row.fecha.substring(0, 7) : '';
      if (!monthKey) return;

      if (!monthMap[monthKey]) {
        const dateParts = monthKey.split('-');
        const yearShort = dateParts[0] ? dateParts[0].slice(-2) : '';
        const monthNum = parseInt(dateParts[1], 10);
        const monthsEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        const monthLabel = monthsEs[monthNum - 1] || 'mes';

        monthMap[monthKey] = {
          fechaKey: monthKey,
          fechaLabel: `${monthLabel}-${yearShort}`,
        };
      }

      AVAILABLE_INDICATORS.forEach((ind) => {
        let val: number | null = null;
        if (viewMode === 'montos') {
          val = row[ind.valKey] !== null && row[ind.valKey] !== undefined ? Number(row[ind.valKey]) : null;
        } else if (viewMode === 'mensual') {
          val = row[ind.menKey] !== null && row[ind.menKey] !== undefined ? Number(row[ind.menKey]) : null;
        } else {
          val = row[ind.iaKey] !== null && row[ind.iaKey] !== undefined ? Number(row[ind.iaKey]) : null;
        }

        if (val !== null || monthMap[monthKey][ind.key] === undefined) {
          monthMap[monthKey][ind.key] = val;
        }
      });
    });

    const sortedPoints = Object.keys(monthMap)
      .sort()
      .map((k) => monthMap[k]);

    // 2. Aplicar filtro temporal
    let filteredPoints = sortedPoints;

    if (selectedPeriod === 'ULTIMOS_12') {
      filteredPoints = sortedPoints.slice(-12);
    } else if (selectedPeriod === 'ULTIMOS_24') {
      filteredPoints = sortedPoints.slice(-24);
    } else if (selectedPeriod === 'ULTIMOS_36') {
      filteredPoints = sortedPoints.slice(-36);
    } else if (selectedPeriod !== 'TODOS') {
      filteredPoints = sortedPoints.filter((p) => p.fechaKey.startsWith(selectedPeriod));
    }

    setChartData(filteredPoints);
  }, [rawRows, viewMode, selectedPeriod]);

  const toggleIndicator = (key: string) => {
    setActiveIndicators((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const formatTooltipValue = (value: number) => {
    if (viewMode === 'montos') {
      return `$${Math.round(value).toLocaleString('es-AR')}`;
    }
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>PRINCIPALES INDICADORES</h1>
          <p>MACROECONOMÍA Y SALARIOS • NIVEL PAÍS</p>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.viewModeControls}>
              <button
                className={`${styles.modeBtn} ${viewMode === 'montos' ? styles.modeBtnActive : ''}`}
                onClick={() => setViewMode('montos')}
              >
                Evolución de los valores mensuales
              </button>
              <button
                className={`${styles.modeBtn} ${viewMode === 'mensual' ? styles.modeBtnActive : ''}`}
                onClick={() => setViewMode('mensual')}
              >
                Var. mensual
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
                className={styles.selectFilter || ''}
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
              Cargando indicadores macroeconómicos...
            </div>
          ) : (
            <div className={styles.chartScrollArea}>
              <div className={styles.chartCanvas} style={{ height: '520px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="fechaLabel" tick={{ fontSize: 12, fontWeight: 600, fill: '#475569' }} />
                    <YAxis
                      tick={{ fontSize: 12, fontWeight: 600, fill: '#475569' }}
                      tickFormatter={(v) => (viewMode === 'montos' ? `$${(v / 1000).toFixed(0)}k` : `${v}%`)}
                    />
                    <Tooltip formatter={formatTooltipValue} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    {AVAILABLE_INDICATORS.filter((i) => activeIndicators.includes(i.key)).map((ind) => (
                      <Line
                        key={ind.key}
                        type="monotone"
                        dataKey={ind.key}
                        name={ind.label}
                        stroke={ind.color}
                        strokeWidth={2.5}
                        connectNulls={true}
                        dot={{ r: 4, fill: ind.color }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <p className={styles.footerNote}>
            Fuente: Elaboración propia en base a RIPTE, SMVM, INDEC (CBT/CBA, IPC e Índice de Salarios).
          </p>
        </div>

        {/* Panel Lateral */}
        <div className={styles.indicatorsCard}>
          <div className={styles.badgeIndicators}>Indicadores</div>
          <div className={styles.indicatorsList}>
            {AVAILABLE_INDICATORS.map((ind) => (
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
  );
}