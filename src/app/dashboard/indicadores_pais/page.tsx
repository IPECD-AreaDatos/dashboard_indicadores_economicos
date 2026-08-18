'use client';

import { useEffect, useState } from 'react';
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
  const [selectedYear, setSelectedYear] = useState<string>('TODOS');
  const [activeIndicators, setActiveIndicators] = useState<string[]>(
    AVAILABLE_INDICATORS.filter((i) => i.defaultActive).map((i) => i.key)
  );

  const [rawRows, setRawRows] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/indicadores_pais');
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

  useEffect(() => {
    if (!rawRows || rawRows.length === 0) return;

    const filtered = rawRows.filter((row) => {
      const yearStr = row.fecha ? row.fecha.substring(0, 4) : '';
      return selectedYear === 'TODOS' || yearStr === selectedYear;
    });

    const formatted = filtered.map((row) => {
      const dateParts = row.fecha.split('-');
      const yearShort = dateParts[0] ? dateParts[0].slice(-2) : '';
      const monthNum = parseInt(dateParts[1], 10);
      const monthsEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const monthLabel = monthsEs[monthNum - 1] || 'mes';

      const point: any = {
        fechaLabel: `${monthLabel}-${yearShort}`,
      };

      AVAILABLE_INDICATORS.forEach((ind) => {
        let val: number | null = null;
        if (viewMode === 'montos') {
          val = Number(row[ind.valKey]) || null;
        } else if (viewMode === 'mensual') {
          val = Number(row[ind.menKey]) || null;
        } else {
          val = Number(row[ind.iaKey]) || null;
        }
        point[ind.key] = val;
      });

      return point;
    });

    setChartData(formatted);
  }, [rawRows, viewMode, selectedYear]);

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
        {/* Gráfico Recharts */}
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
              Cargando indicadores macroeconómicos...
            </div>
          ) : (
            <div className={styles.chartScrollArea}>
              <div className={styles.chartCanvas}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="fechaLabel" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) => (viewMode === 'montos' ? `$${(v / 1000).toFixed(0)}k` : `${v}%`)}
                    />
                    <Tooltip formatter={formatTooltipValue} />
                    <Legend />
                    {AVAILABLE_INDICATORS.filter((i) => activeIndicators.includes(i.key)).map((ind) => (
                      <Line
                        key={ind.key}
                        type="monotone"
                        dataKey={ind.key}
                        name={ind.label}
                        stroke={ind.color}
                        strokeWidth={2.5}
                        dot={{ r: 3.5, fill: ind.color }}
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

        {/* Panel Lateral de Selección de Indicadores */}
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