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
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ArrowRight } from 'lucide-react';
import styles from './Sipa.module.css';

function norm(str?: string) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

const DICC_REGISTROS: { [key: number]: string } = {
  1: 'Asalariados Sector Privado',
  2: 'Asalariados Sector Público',
  3: 'Casas Particulares',
  4: 'Autónomos',
  5: 'Monotributo',
  6: 'Monotributo Social',
  7: 'Otros',
  8: 'Total Registrado',
};

const COLOR_PALETTE = [
  '#15803d', // Verde
  '#b45309', // Ámbar
  '#1d4ed8', // Azul
  '#d97706', // Naranja
  '#7c3aed',
  '#0284c7',
  '#e11d48',
  '#475569',
];

export default function EmpleoNacionalPage() {
  const [activeTab, setActiveTab] = useState<'nacion' | 'tipo-registro' | 'provincias'>('nacion');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ULTIMOS_12');
  const [selectedFecha, setSelectedFecha] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('Nación');

  const [rawProvincias, setRawProvincias] = useState<any[]>([]);
  const [rawNacion, setRawNacion] = useState<any[]>([]);
  const [rawRegistros, setRawRegistros] = useState<any[]>([]);
  const [regionesList, setRegionesList] = useState<any[]>([]);
  const [fechasList, setFechasList] = useState<string[]>([]);

  const [chartDataProv, setChartDataProv] = useState<any[]>([]);
  const [chartDataNacion, setChartDataNacion] = useState<any[]>([]);
  const [chartDataRegistros, setChartDataRegistros] = useState<any[]>([]);
  const [activeProvinces, setActiveProvinces] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(withBasePath('/api/empleo_nacional'));
        const json = await res.json();

        if (json.serieProvincias) {
          setRawProvincias(json.serieProvincias);
          setRawNacion(json.serieNacion || []);
          setRawRegistros(json.desgloseRegistros || []);
          setRegionesList(json.regiones || []);
          setFechasList(json.fechasDisponibles || []);

          if (json.fechasDisponibles?.length > 0) {
            setSelectedFecha(json.fechasDisponibles[0]);
          }

          if (json.regiones?.length > 0) {
            const defaultReg = json.regiones.find((r: any) => norm(r.nombre_region) === 'NACION') || json.regiones[0];
            setSelectedRegion(defaultReg.nombre_region);
          }
        }
      } catch (err) {
        console.error('Error cargando SIPA:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    const all = [...rawProvincias, ...rawNacion];
    all.forEach((r) => {
      if (r.fecha) yearsSet.add(r.fecha.substring(0, 4));
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [rawProvincias, rawNacion]);

  // 1. Serie Provincial
  useEffect(() => {
    if (!rawProvincias || rawProvincias.length === 0) return;

    const targetReg = norm(selectedRegion);
    const isNacion = targetReg.includes('NACION') || targetReg === '';

    const grouped: { [key: string]: any } = {};
    const provSet = new Set<string>();

    rawProvincias.forEach((row) => {
      const rowReg = norm(row.nombre_region);
      const isRowNacion = Number(row.id_provincia) === 1 || Number(row.id_region) === 1 || rowReg.includes('NACION');

      const matchRegion = isNacion ? isRowNacion : rowReg === targetReg && Number(row.id_provincia) !== 1;
      if (!matchRegion) return;

      const dateParts = row.fecha.split('-');
      const yearShort = dateParts[0] ? dateParts[0].slice(-2) : '';
      const monthNum = parseInt(dateParts[1], 10);
      const monthsEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const monthLabel = monthsEs[monthNum - 1] || 'mes';
      const label = `${monthLabel}-${yearShort}`;

      if (!grouped[row.fecha]) {
        grouped[row.fecha] = { fechaLabel: label, originalFecha: row.fecha };
      }

      const provName = isRowNacion ? 'Nación' : row.nombre_provincia || `Prov_${row.id_provincia}`;
      provSet.add(provName);

      // Los datos vienen en miles (ej: 75.6 o 6106.5)
      const rawVal = Number(row.cantidad_con_estacionalidad || row.cantidad_sin_estacionalidad) || 0;
      grouped[row.fecha][provName] = +rawVal.toFixed(1);
    });

    const sortedPoints = Object.keys(grouped)
      .sort()
      .map((k) => grouped[k]);

    let filteredPoints = sortedPoints;
    if (selectedPeriod === 'ULTIMOS_12') {
      filteredPoints = sortedPoints.slice(-12);
    } else if (selectedPeriod === 'ULTIMOS_24') {
      filteredPoints = sortedPoints.slice(-24);
    } else if (selectedPeriod === 'ULTIMOS_36') {
      filteredPoints = sortedPoints.slice(-36);
    } else if (selectedPeriod !== 'TODOS') {
      filteredPoints = sortedPoints.filter((p) => p.originalFecha?.startsWith(selectedPeriod));
    }

    setChartDataProv(filteredPoints);
    setActiveProvinces(Array.from(provSet));
  }, [rawProvincias, selectedPeriod, selectedRegion]);

  // 2. Serie Nacional (Total Registrado)
  useEffect(() => {
    if (!rawNacion || rawNacion.length === 0) return;

    const formatted = rawNacion.map((row) => {
      const dateParts = row.fecha.split('-');
      const yearShort = dateParts[0] ? dateParts[0].slice(-2) : '';
      const monthNum = parseInt(dateParts[1], 10);
      const monthsEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const monthLabel = monthsEs[monthNum - 1] || 'mes';

      const totalVal = Number(row.total_puestos) || 0;

      return {
        originalFecha: row.fecha,
        fechaLabel: `${monthLabel}-${yearShort}`,
        Total: +totalVal.toFixed(1),
        var_mensual: Number(row.var_mensual) || 0,
        var_interanual: Number(row.var_interanual) || 0,
      };
    });

    let filtered = formatted;
    if (selectedPeriod === 'ULTIMOS_12') {
      filtered = formatted.slice(-12);
    } else if (selectedPeriod === 'ULTIMOS_24') {
      filtered = formatted.slice(-24);
    } else if (selectedPeriod === 'ULTIMOS_36') {
      filtered = formatted.slice(-36);
    } else if (selectedPeriod !== 'TODOS') {
      filtered = formatted.filter((p) => p.originalFecha?.startsWith(selectedPeriod));
    }

    setChartDataNacion(filtered);
  }, [rawNacion, selectedPeriod]);

  // 3. Desglose por registro
  useEffect(() => {
    if (!rawRegistros || rawRegistros.length === 0 || !selectedFecha) return;

    const rowsFecha = rawRegistros.filter((r) => r.fecha === selectedFecha);
    const formatted = rowsFecha
      .map((r) => {
        const id = Number(r.id_registro);
        const val = Number(r.cantidad) || 0;
        return {
          id,
          tipo: DICC_REGISTROS[id] || `Registro ${id}`,
          cantidadMil: +val.toFixed(1),
        };
      })
      .sort((a, b) => b.cantidadMil - a.cantidadMil);

    setChartDataRegistros(formatted);
  }, [rawRegistros, selectedFecha]);

  const formatFechaLabel = (fStr: string) => {
    if (!fStr) return '-';
    const dateParts = fStr.split('-');
    if (dateParts.length < 2) return fStr;
    const monthsEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const monthNum = parseInt(dateParts[1], 10);
    return `${monthsEs[monthNum - 1] || ''}-${dateParts[0].slice(-2)}`;
  };

  // KPIs
  const targetReg = norm(selectedRegion);
  const isNacionSelected = targetReg.includes('NACION') || targetReg === '';

  const rowsFechaProv = rawProvincias.filter((r) => {
    const rowReg = norm(r.nombre_region);
    const isRowNacion = Number(r.id_provincia) === 1 || Number(r.id_region) === 1 || rowReg.includes('NACION');
    return r.fecha === selectedFecha && (isNacionSelected ? isRowNacion : rowReg === targetReg && Number(r.id_provincia) !== 1);
  });

  const corrientes = rawProvincias.find(
    (r) => r.fecha === selectedFecha && norm(r.nombre_provincia) === 'CORRIENTES'
  );

  const nacionRow = rawProvincias.find(
    (r) => r.fecha === selectedFecha && (Number(r.id_provincia) === 1 || norm(r.nombre_provincia).includes('NACION'))
  );

  const sumPuestos = rowsFechaProv.reduce((acc, curr) => {
    return acc + (Number(curr.cantidad_con_estacionalidad || curr.cantidad_sin_estacionalidad) || 0);
  }, 0);

  const displayRegionalPuestos = isNacionSelected
    ? Number(nacionRow?.cantidad_con_estacionalidad || nacionRow?.cantidad_sin_estacionalidad || sumPuestos)
    : rowsFechaProv.length > 0
    ? sumPuestos / rowsFechaProv.length
    : 0;

  const avgVarInter = isNacionSelected
    ? Number(nacionRow?.var_interanual || 0)
    : rowsFechaProv.length > 0
    ? rowsFechaProv.reduce((acc, curr) => acc + (Number(curr.var_interanual) || 0), 0) / rowsFechaProv.length
    : 0;

  const avgVarMen = isNacionSelected
    ? Number(nacionRow?.var_mensual || 0)
    : rowsFechaProv.length > 0
    ? rowsFechaProv.reduce((acc, curr) => acc + (Number(curr.var_mensual) || 0), 0) / rowsFechaProv.length
    : 0;

  // Total Nación en Millones (dividido por 1000 porque viene en miles)
  const rowNacionAct = rawNacion.find((r) => r.fecha === selectedFecha);
  const totalNacionMillones = rowNacionAct
    ? (Number(rowNacionAct.total_puestos) / 1000).toFixed(2).replace('.', ',')
    : '-';

  const formatPuestosVal = (val?: number) => {
    if (val === undefined || val === null) return '-';
    return Number(val).toFixed(1).replace('.', ',');
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>EMPLEO REGISTRADO</h1>
          <p>SISTEMA INTEGRADO PREVISIONAL ARGENTINO (SIPA)</p>
        </div>

        <div className={styles.topControls}>
          <div className={styles.tabsContainer}>
            <button
              className={`${styles.tabBtn} ${activeTab === 'nacion' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('nacion')}
            >
              Nivel País
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'tipo-registro' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('tipo-registro')}
            >
              Por Registro
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'provincias' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('provincias')}
            >
              Provincias
            </button>
          </div>

          {activeTab === 'provincias' && (
            <select
              className={styles.selectFilter}
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              {regionesList.map((r) => (
                <option key={r.id_region} value={r.nombre_region}>
                  Región: {r.nombre_region}
                </option>
              ))}
            </select>
          )}

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
              {activeTab === 'nacion' && 'Evolución mensual empleo registrado nacional (en miles)'}
              {activeTab === 'tipo-registro' && 'Análisis por tipo de registro (en miles)'}
              {activeTab === 'provincias' && `Empleo privado por provincia (${selectedRegion})`}
            </div>

            {activeTab !== 'tipo-registro' && (
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
            )}
          </div>

          {loading ? (
            <div style={{ padding: '80px', textAlign: 'center', color: '#64748b' }}>
              Cargando datos de empleo SIPA...
            </div>
          ) : (
            <div className={styles.chartScrollArea}>
              <div className={styles.chartCanvas} style={{ height: '520px' }}>
                {/* 1. GRÁFICO NACIONAL */}
                {activeTab === 'nacion' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartDataNacion} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="fechaLabel" tick={{ fontSize: 12, fontWeight: 600, fill: '#475569' }} />
                      <YAxis tick={{ fontSize: 12, fontWeight: 600, fill: '#475569' }} unit="k" domain={['dataMin - 500', 'dataMax + 500']} />
                      <Tooltip formatter={(v: number) => [`${(v / 1000).toFixed(2).replace('.', ',')} mill. (${Math.round(v).toLocaleString('es-AR')} mil puestos)`, 'Total Registrado']} />
                      <Line type="monotone" dataKey="Total" stroke="#15803d" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {/* 2. GRÁFICO BARRAS POR REGISTRO */}
                {activeTab === 'tipo-registro' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataRegistros} layout="vertical" margin={{ left: 180, right: 30, top: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="tipo" type="category" tick={{ fontSize: 11, fontWeight: 600 }} width={170} />
                      <Tooltip formatter={(v: number) => [`${v.toLocaleString('es-AR')} mil puestos`, 'Cantidad']} />
                      <Bar dataKey="cantidadMil" fill="#14203b" radius={[0, 6, 6, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {/* 3. GRÁFICO PROVINCIAL */}
                {activeTab === 'provincias' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartDataProv} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="fechaLabel" tick={{ fontSize: 12, fontWeight: 600, fill: '#475569' }} />
                      <YAxis tick={{ fontSize: 12, fontWeight: 600, fill: '#475569' }} unit="k" />
                      <Tooltip
                        formatter={(val: number, name: string) => [
                          `${val.toLocaleString('es-AR')} mil puestos`,
                          name,
                        ]}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                      {activeProvinces.map((provName, idx) => (
                        <Line
                          key={provName}
                          type="monotone"
                          dataKey={provName}
                          name={provName}
                          stroke={COLOR_PALETTE[idx % COLOR_PALETTE.length]}
                          strokeWidth={provName.toLowerCase() === 'corrientes' ? 3 : 2}
                          dot={{ r: provName.toLowerCase() === 'corrientes' ? 4 : 3, fill: COLOR_PALETTE[idx % COLOR_PALETTE.length] }}
                          activeDot={{ r: 6 }}
                          connectNulls={true}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          <p className={styles.footerNote}>
            Fuente: Sistema Integrado Previsional Argentino (SIPA) — Subsecretaría de Políticas, Estadísticas y Estudios Laborales.
          </p>
        </div>

        {/* Panel Lateral de KPIs */}
        <div className={styles.kpiColumn}>
          <div className={styles.dateDisplay}>{formatFechaLabel(selectedFecha)}</div>

          {activeTab === 'nacion' ? (
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>Total puestos de trabajo Nación</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                {totalNacionMillones} mill.
              </div>
              <div className={styles.kpiMetrics}>
                <div>
                  <div
                    className={styles.kpiVal}
                    style={{ color: Number(rowNacionAct?.var_interanual || 0) >= 0 ? '#16a34a' : '#dc2626' }}
                  >
                    {rowNacionAct?.var_interanual !== null && rowNacionAct?.var_interanual !== undefined
                      ? `${Number(rowNacionAct.var_interanual) >= 0 ? '+' : ''}${Number(rowNacionAct.var_interanual).toFixed(1)}%`
                      : '-'}
                  </div>
                  <div className={styles.kpiLabel}>Interanual</div>
                </div>
                <div>
                  <div
                    className={styles.kpiVal}
                    style={{ color: Number(rowNacionAct?.var_mensual || 0) >= 0 ? '#16a34a' : '#dc2626' }}
                  >
                    {rowNacionAct?.var_mensual !== null && rowNacionAct?.var_mensual !== undefined
                      ? `${Number(rowNacionAct.var_mensual) >= 0 ? '+' : ''}${Number(rowNacionAct.var_mensual).toFixed(1)}%`
                      : '-'}
                  </div>
                  <div className={styles.kpiLabel}>Mensual (s/e)</div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Tarjeta Regional o Nacional */}
              <div className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                  {isNacionSelected ? 'Total empleo privado Nación' : `Promedio empleo privado ${selectedRegion}`}
                </div>
                <div className={styles.kpiMetrics}>
                  <div>
                    <div className={styles.kpiVal}>
                      {displayRegionalPuestos > 1000
                        ? (displayRegionalPuestos / 1000).toFixed(2).replace('.', ',') + ' mill.'
                        : displayRegionalPuestos.toFixed(1).replace('.', ',') + ' mil'}
                    </div>
                    <div className={styles.kpiLabel}>Puestos</div>
                  </div>
                  <div>
                    <div
                      className={styles.kpiVal}
                      style={{ color: avgVarInter >= 0 ? '#16a34a' : '#dc2626' }}
                    >
                      {`${avgVarInter >= 0 ? '+' : ''}${avgVarInter.toFixed(1)}%`}
                    </div>
                    <div className={styles.kpiLabel}>Interanual</div>
                  </div>
                  <div>
                    <div
                      className={styles.kpiVal}
                      style={{ color: avgVarMen >= 0 ? '#16a34a' : '#dc2626' }}
                    >
                      {`${avgVarMen >= 0 ? '+' : ''}${avgVarMen.toFixed(1)}%`}
                    </div>
                    <div className={styles.kpiLabel}>Mensual (s/e)</div>
                  </div>
                </div>
              </div>

              {/* Tarjeta Corrientes */}
              <div className={styles.kpiCard}>
                <div className={styles.kpiHeader}>Empleo privado Corrientes</div>
                <div className={styles.kpiMetrics}>
                  <div>
                    <div className={styles.kpiVal}>
                      {formatPuestosVal(
                        Number(corrientes?.cantidad_con_estacionalidad || corrientes?.cantidad_sin_estacionalidad)
                      )}
                    </div>
                    <div className={styles.kpiLabel}>mil puestos</div>
                  </div>
                  <div>
                    <div
                      className={styles.kpiVal}
                      style={{
                        color: Number(corrientes?.var_interanual || 0) >= 0 ? '#16a34a' : '#dc2626',
                      }}
                    >
                      {corrientes?.var_interanual !== null && corrientes?.var_interanual !== undefined
                        ? `${Number(corrientes.var_interanual) >= 0 ? '+' : ''}${Number(corrientes.var_interanual).toFixed(1)}%`
                        : '-'}
                    </div>
                    <div className={styles.kpiLabel}>Interanual</div>
                  </div>
                  <div>
                    <div
                      className={styles.kpiVal}
                      style={{
                        color: Number(corrientes?.var_mensual || 0) >= 0 ? '#16a34a' : '#dc2626',
                      }}
                    >
                      {corrientes?.var_mensual !== null && corrientes?.var_mensual !== undefined
                        ? `${Number(corrientes.var_mensual) >= 0 ? '+' : ''}${Number(corrientes.var_mensual).toFixed(1)}%`
                        : '-'}
                    </div>
                    <div className={styles.kpiLabel}>Mensual (s/e)</div>
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            onClick={() => {
              if (activeTab === 'nacion') setActiveTab('tipo-registro');
              else if (activeTab === 'tipo-registro') setActiveTab('provincias');
              else setActiveTab('nacion');
            }}
            className={styles.navBottomBtn}
          >
            <span>
              {activeTab === 'nacion' && 'Ver Análisis por Registro'}
              {activeTab === 'tipo-registro' && 'Ver Comparativa Provincial'}
              {activeTab === 'provincias' && 'Ver Nivel País'}
            </span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}