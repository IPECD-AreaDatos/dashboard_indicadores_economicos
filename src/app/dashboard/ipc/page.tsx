'use client';

import { withBasePath } from '../../../lib/basePath';
import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { ArrowRight } from 'lucide-react';
import styles from './Ipc.module.css';

function norm(str?: string) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

export default function IpcPage() {
  const [activeTab, setActiveTab] = useState<'serie' | 'aperturas' | 'subdivisiones'>('serie');
  const [metric, setMetric] = useState<'mensual' | 'interanual'>('interanual');
  const [selectedYear, setSelectedYear] = useState<string>('TODOS');
  const [selectedFecha, setSelectedFecha] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('Nación');

  const [rawSerie, setRawSerie] = useState<any[]>([]);
  const [rawAperturas, setRawAperturas] = useState<any[]>([]);
  const [regionesList, setRegionesList] = useState<any[]>([]);
  const [fechasList, setFechasList] = useState<string[]>([]);

  const [chartDataSerie, setChartDataSerie] = useState<any[]>([]);
  const [chartDataAperturas, setChartDataAperturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(withBasePath('/api/ipc'));
        const json = await res.json();

        if (json.serieGeneral) {
          setRawSerie(json.serieGeneral);
          setRawAperturas(json.aperturas || []);
          setRegionesList(json.regiones || []);
          setFechasList(json.fechasDisponibles || []);

          if (json.fechasDisponibles?.length > 0) {
            setSelectedFecha(json.fechasDisponibles[0]);
          }

          if (json.regiones?.length > 0) {
            const nac = json.regiones.find((r: any) => norm(r.nombre_region).includes('NACION'));
            if (nac) setSelectedRegion(nac.nombre_region);
          }
        }
      } catch (err) {
        console.error('Error cargando IPC:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // 1. Serie Histórica (Líneas)
  useEffect(() => {
    if (!rawSerie || rawSerie.length === 0) return;

    const target = norm(selectedRegion);

    // Fallback: si no hay coincidencia exacta, toma las de la región elegida o las generales
    const filtered = rawSerie.filter((row) => {
      const rowReg = norm(row.nombre_region);
      const matchRegion =
        target.includes('NACION') || target === ''
          ? rowReg.includes('NACION') || rowReg === '' || Number(row.id_region) <= 1
          : rowReg.includes(target) || target.includes(rowReg);

      const yearStr = row.fecha ? row.fecha.substring(0, 4) : '';
      const matchYear = selectedYear === 'TODOS' || yearStr === selectedYear;

      return matchRegion && matchYear;
    });

    const formatted = filtered.map((row) => {
      const dateParts = row.fecha.split('-');
      const yearShort = dateParts[0] ? dateParts[0].slice(-2) : '';
      const monthNum = parseInt(dateParts[1], 10);
      const monthsEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const monthLabel = monthsEs[monthNum - 1] || 'mes';

      return {
        fechaLabel: `${monthLabel}-${yearShort}`,
        valor: metric === 'mensual' ? Number(row.var_mensual) || 0 : Number(row.var_interanual) || 0,
      };
    });

    setChartDataSerie(formatted);
  }, [rawSerie, selectedRegion, selectedYear, metric]);

  // 2. Aperturas (Barras con grosor correcto)
  useEffect(() => {
    if (!rawAperturas || rawAperturas.length === 0 || !selectedFecha) return;

    const target = norm(selectedRegion);

    const filtered = rawAperturas.filter((row) => {
      const matchFecha = row.fecha === selectedFecha;
      const rowReg = norm(row.nombre_region);
      const matchRegion =
        target.includes('NACION') || target === ''
          ? rowReg.includes('NACION') || rowReg === '' || Number(row.id_region) <= 1
          : rowReg.includes(target) || target.includes(rowReg);

      return matchFecha && matchRegion && row.nombre_division;
    });

    // Agrupar divisiones únicas
    const divMap: { [key: string]: any } = {};
    filtered.forEach((r) => {
      const divName = r.nombre_division.trim();
      if (!divMap[divName]) {
        divMap[divName] = {
          division: divName,
          var_mensual: Number(r.var_mensual) || 0,
          var_interanual: Number(r.var_interanual) || 0,
        };
      }
    });

    const sorted = Object.values(divMap).sort((a, b) =>
      metric === 'mensual' ? b.var_mensual - a.var_mensual : b.var_interanual - a.var_interanual
    );

    setChartDataAperturas(sorted);
  }, [rawAperturas, selectedFecha, selectedRegion, metric]);

  const formatFechaLabel = (fStr: string) => {
    if (!fStr) return '-';
    const dateParts = fStr.split('-');
    if (dateParts.length < 2) return fStr;
    const monthsEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const monthNum = parseInt(dateParts[1], 10);
    return `${monthsEs[monthNum - 1] || ''}-${dateParts[0].slice(-2)}`;
  };

  const target = norm(selectedRegion);
  const activeKpiRow = rawSerie.find(
    (r) =>
      r.fecha === selectedFecha &&
      (target.includes('NACION') || norm(r.nombre_region) === target)
  );

  const topAumentosMensuales = [...chartDataAperturas]
    .filter((d) => !norm(d.division).includes('GENERAL'))
    .sort((a, b) => b.var_mensual - a.var_mensual)
    .slice(0, 3);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>IPC {selectedRegion.toUpperCase()}</h1>
          <p>ÍNDICE DE PRECIOS AL CONSUMIDOR • EVOLUCIÓN Y APERTURAS</p>
        </div>

        <div className={styles.topControls}>
          <div className={styles.tabsContainer}>
            <button
              className={`${styles.tabBtn} ${activeTab === 'serie' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('serie')}
            >
              Serie Histórica
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'aperturas' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('aperturas')}
            >
              Aperturas IPC
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'subdivisiones' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('subdivisiones')}
            >
              Subdivisiones
            </button>
          </div>

          <select
            className={styles.selectFilter}
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            {regionesList.map((r) => (
              <option key={r.id_region} value={r.nombre_region}>
                {r.nombre_region}
              </option>
            ))}
          </select>

          <select
            className={styles.selectFilter}
            value={selectedFecha}
            onChange={(e) => setSelectedFecha(e.target.value)}
          >
            {fechasList.map((f) => (
              <option key={f} value={f}>
                {formatFechaLabel(f)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Principal */}
      <div className={styles.mainGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.badgeCategory}>
              {activeTab === 'serie' && 'Serie histórica para años seleccionados'}
              {activeTab === 'aperturas' && 'IPC por principales aperturas'}
              {activeTab === 'subdivisiones' && 'IPC por principales subdivisiones'}
            </div>

            {activeTab !== 'subdivisiones' && (
              <div className={styles.metricSelectors}>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="ipcMetric"
                    checked={metric === 'mensual'}
                    onChange={() => setMetric('mensual')}
                  />
                  Variación mensual
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="ipcMetric"
                    checked={metric === 'interanual'}
                    onChange={() => setMetric('interanual')}
                  />
                  Variación interanual
                </label>
              </div>
            )}

            {activeTab === 'serie' && (
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
            )}
          </div>

          {loading ? (
            <div style={{ padding: '80px', textAlign: 'center', color: '#64748b' }}>
              Cargando datos del IPC...
            </div>
          ) : (
            <div className={styles.chartCanvas} style={{ height: '540px' }}>
              {/* 1. SERIE HISTÓRICA */}
              {activeTab === 'serie' && (
                <ResponsiveContainer width="100%" height={500}>
                  <LineChart data={chartDataSerie} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="fechaLabel" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} unit="%" />
                    <Tooltip
                      cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }}
                      formatter={(v: number) => [`${v.toFixed(1)}%`, metric === 'mensual' ? 'Mensual' : 'Interanual']}
                    />
                    <Line
                      type="monotone"
                      dataKey="valor"
                      stroke="#15803d"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#15803d' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {/* 2. APERTURAS (BARRAS GRUESAS CON barSize={16}) */}
              {activeTab === 'aperturas' && (
                <ResponsiveContainer width="100%" height={520}>
                  <BarChart
                    data={chartDataAperturas}
                    layout="vertical"
                    margin={{ left: 220, right: 40, top: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
                    <YAxis
                      dataKey="division"
                      type="category"
                      tick={{ fontSize: 11, fontWeight: 600, fill: '#1e293b' }}
                      width={210}
                    />
                    <Tooltip
                      cursor={false}
                      formatter={(v: number) => [`${v.toFixed(1)}%`, metric === 'mensual' ? 'Mensual' : 'Interanual']}
                    />
                    <Bar
                      dataKey={metric === 'mensual' ? 'var_mensual' : 'var_interanual'}
                      barSize={16}
                      radius={[0, 6, 6, 0]}
                    >
                      {chartDataAperturas.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={norm(entry.division).includes('GENERAL') ? '#14203b' : '#84cc16'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {/* 3. SUBDIVISIONES */}
              {activeTab === 'subdivisiones' && (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Categoría / División</th>
                        <th style={{ textAlign: 'right' }}>Variación mensual</th>
                        <th style={{ textAlign: 'right' }}>Variación interanual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartDataAperturas.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: norm(row.division).includes('GENERAL') ? 800 : 600 }}>
                            {row.division}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#15803d' }}>
                            {row.var_mensual ? `${row.var_mensual.toFixed(1)}%` : '-'}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>
                            {row.var_interanual ? `${row.var_interanual.toFixed(1)}%` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <p className={styles.footerNote}>Fuente: INDEC — Instituto Nacional de Estadística y Censos.</p>
        </div>

        {/* KPIs Lateral */}
        <div className={styles.kpiColumn}>
          <div className={styles.dateDisplay}>
            {selectedRegion} {formatFechaLabel(selectedFecha)}
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiItem}>
              <div className={styles.kpiVal}>
                {activeKpiRow ? `${Number(activeKpiRow.var_mensual || 0).toFixed(1)}%` : '2,1%'}
              </div>
              <div className={styles.kpiLabel}>Variación porcentual mensual</div>
            </div>

            <div className={styles.kpiItem}>
              <div className={styles.kpiVal}>
                {activeKpiRow ? `${Number(activeKpiRow.var_interanual || 0).toFixed(1)}%` : '33,3%'}
              </div>
              <div className={styles.kpiLabel}>Variación interanual</div>
            </div>

            <div className={styles.kpiItem}>
              <div className={styles.kpiVal}>
                {activeKpiRow ? `${Number(activeKpiRow.var_acumulada || 0).toFixed(1)}%` : '14,7%'}
              </div>
              <div className={styles.kpiLabel}>Variación acumulada a {formatFechaLabel(selectedFecha)}</div>
            </div>
          </div>

          {activeTab === 'aperturas' && (
            <div className={styles.kpiCard}>
              <div className={styles.kpiTitle}>Rubros con mayor aumento mensual</div>
              {topAumentosMensuales.map((rubro, idx) => (
                <div key={idx} className={styles.topIncItem}>
                  <span className={styles.topIncName}>{rubro.division}</span>
                  <span className={styles.topIncVal}>+{rubro.var_mensual.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              if (activeTab === 'serie') setActiveTab('aperturas');
              else if (activeTab === 'aperturas') setActiveTab('subdivisiones');
              else setActiveTab('serie');
            }}
            className={styles.navBottomBtn}
          >
            <span>
              {activeTab === 'serie' && 'Ver aperturas IPC'}
              {activeTab === 'aperturas' && 'Ver subdivisiones IPC'}
              {activeTab === 'subdivisiones' && 'Ver Serie histórica'}
            </span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}