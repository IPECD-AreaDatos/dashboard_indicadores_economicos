'use client';

import { withBasePath } from '../../../lib/basePath';
import { useEffect, useState, useMemo } from 'react';
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

// Las 13 aperturas oficiales de INDEC (Nivel General + 12 Divisiones principales)
const OFFICIAL_DIVISIONS_MAP: { [key: string]: string } = {
  'NIVEL GENERAL': 'Nivel general',
  'ALIMENTOS Y BEBIDAS NO ALCOHOLICAS': 'Alimentos y bebidas no alcohólicas',
  'BEBIDAS ALCOHOLICAS Y TABACO': 'Bebidas alcohólicas y tabaco',
  'PRENDAS DE VESTIR Y CALZADO': 'Prendas de vestir y calzado',
  'VIVIENDA, AGUA, ELECTRICIDAD, GAS Y OTROS COMBUSTIBLES': 'Vivienda, agua, electricidad, gas y otros combustibles',
  'EQUIPAMIENTO Y MANTENIMIENTO DEL HOGAR': 'Equipamiento y mantenimiento del hogar',
  'SALUD': 'Salud',
  'TRANSPORTE': 'Transporte',
  'COMUNICACION': 'Comunicación',
  'COMUNICACIONES': 'Comunicación',
  'RECREACION Y CULTURA': 'Recreación y cultura',
  'EDUCACION': 'Educación',
  'RESTAURANTES Y HOTELES': 'Restaurantes y hoteles',
  'BIENES Y SERVICIOS VARIOS': 'Bienes y servicios varios',
};

export default function IpcPage() {
  const [activeTab, setActiveTab] = useState<'serie' | 'aperturas' | 'subdivisiones'>('serie');
  const [metric, setMetric] = useState<'mensual' | 'interanual'>('interanual');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ULTIMOS_12');
  const [selectedFecha, setSelectedFecha] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('Nación');

  const [rawSerie, setRawSerie] = useState<any[]>([]);
  const [rawItems, setRawItems] = useState<any[]>([]);
  const [regionesList, setRegionesList] = useState<any[]>([]);
  const [fechasList, setFechasList] = useState<string[]>([]);

  const [chartDataSerie, setChartDataSerie] = useState<any[]>([]);
  const [chartDataAperturas, setChartDataAperturas] = useState<any[]>([]);
  const [tableDataSubdivisiones, setTableDataSubdivisiones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(withBasePath('/api/ipc'));
        const json = await res.json();

        if (json.serieGeneral) {
          setRawSerie(json.serieGeneral);
          setRawItems(json.items || []);
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

  const availableYears = useMemo(() => {
    if (!rawSerie || rawSerie.length === 0) return [];
    const yearsSet = new Set<string>();
    rawSerie.forEach((r) => {
      if (r.fecha) yearsSet.add(r.fecha.substring(0, 4));
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [rawSerie]);

  // 1. Serie Histórica
  useEffect(() => {
    if (!rawSerie || rawSerie.length === 0) return;

    const target = norm(selectedRegion);

    let regionFiltered = rawSerie.filter((row) => {
      const rowReg = norm(row.nombre_region);
      return target.includes('NACION') || target === ''
        ? rowReg.includes('NACION') || rowReg === '' || Number(row.id_region) <= 1
        : rowReg.includes(target) || target.includes(rowReg);
    });

    regionFiltered.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    let periodFiltered = regionFiltered;
    if (selectedPeriod === 'ULTIMOS_12') {
      periodFiltered = regionFiltered.slice(-12);
    } else if (selectedPeriod === 'ULTIMOS_24') {
      periodFiltered = regionFiltered.slice(-24);
    } else if (selectedPeriod === 'ULTIMOS_36') {
      periodFiltered = regionFiltered.slice(-36);
    } else if (selectedPeriod !== 'TODOS') {
      periodFiltered = regionFiltered.filter((row) => row.fecha?.startsWith(selectedPeriod));
    }

    const formatted = periodFiltered.map((row) => {
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
  }, [rawSerie, selectedRegion, selectedPeriod, metric]);

  // 2. Aperturas y Subdivisiones
  useEffect(() => {
    if (!rawItems || rawItems.length === 0 || !selectedFecha) return;

    const target = norm(selectedRegion);

    const regionFiltered = rawItems.filter((row) => {
      const matchFecha = row.fecha === selectedFecha;
      const rowReg = norm(row.nombre_region);
      const matchRegion =
        target.includes('NACION') || target === ''
          ? rowReg.includes('NACION') || rowReg === '' || Number(row.id_region) <= 1
          : rowReg.includes(target) || target.includes(rowReg);

      return matchFecha && matchRegion;
    });

    const divMap: { [key: string]: any } = {};
    const subMap: { [key: string]: any } = {};
    const allMap: { [key: string]: any } = {};

    regionFiltered.forEach((r) => {
      const rawName = (r.nombre_division || r.nombre_categoria || '').trim();
      const nameNorm = norm(rawName);

      // Match con las 12 divisiones canónicas + Nivel General
      const matchedCanonical = OFFICIAL_DIVISIONS_MAP[nameNorm];

      if (matchedCanonical) {
        if (!divMap[matchedCanonical]) {
          divMap[matchedCanonical] = {
            division: matchedCanonical,
            var_mensual: Number(r.var_mensual) || 0,
            var_interanual: Number(r.var_interanual) || 0,
          };
        }
      } else if (rawName) {
        // Subdivisiones específicas
        if (!subMap[rawName]) {
          subMap[rawName] = {
            categoria: rawName,
            var_mensual: Number(r.var_mensual) || 0,
            var_interanual: Number(r.var_interanual) || 0,
          };
        }
      }

      // Registro de todas las categorías
      if (rawName && !allMap[rawName]) {
        allMap[rawName] = {
          categoria: rawName,
          var_mensual: Number(r.var_mensual) || 0,
          var_interanual: Number(r.var_interanual) || 0,
        };
      }
    });

    const sortedAperturas = Object.values(divMap).sort((a, b) =>
      metric === 'mensual' ? b.var_mensual - a.var_mensual : b.var_interanual - a.var_interanual
    );

    // Si tiene subdivisiones detalladas (como NEA), muestra subMap.
    // Si no tiene (como Nación), muestra allMap para que no quede vacía.
    const subList = Object.keys(subMap).length > 0 ? Object.values(subMap) : Object.values(allMap);
    const sortedSubdivisiones = subList.sort((a, b) => b.var_mensual - a.var_mensual);

    setChartDataAperturas(sortedAperturas);
    setTableDataSubdivisiones(sortedSubdivisiones);
  }, [rawItems, selectedFecha, selectedRegion, metric]);

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
              {activeTab === 'serie' && 'Evolución temporal del IPC'}
              {activeTab === 'aperturas' && 'IPC por principales aperturas (12 divisiones)'}
              {activeTab === 'subdivisiones' && 'IPC desglose por subdivisiones'}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Período:</span>
                <select
                  className={styles.selectFilter}
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  style={{ minWidth: '150px' }}
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
                    <XAxis dataKey="fechaLabel" tick={{ fontSize: 12, fontWeight: 600, fill: '#475569' }} />
                    <YAxis tick={{ fontSize: 12, fontWeight: 600, fill: '#475569' }} unit="%" />
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

              {/* 2. APERTURAS (12 CATEGORÍAS PRINCIPALES EXACTAS) */}
              {activeTab === 'aperturas' && (
                <ResponsiveContainer width="100%" height={520}>
                  <BarChart
                    data={chartDataAperturas}
                    layout="vertical"
                    margin={{ left: 230, right: 40, top: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
                    <YAxis
                      dataKey="division"
                      type="category"
                      tick={{ fontSize: 11, fontWeight: 600, fill: '#1e293b' }}
                      width={220}
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

              {/* 3. SUBDIVISIONES (DESGLOSE COMPLETO) */}
              {activeTab === 'subdivisiones' && (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Categoría / Subdivisión</th>
                        <th style={{ textAlign: 'right' }}>Variación mensual</th>
                        <th style={{ textAlign: 'right' }}>Variación interanual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableDataSubdivisiones.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>
                            {row.categoria}
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