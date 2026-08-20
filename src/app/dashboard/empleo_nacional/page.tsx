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
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ArrowRight } from 'lucide-react';
import styles from './Sipa.module.css';

const DICC_REGISTROS: { [key: number]: string } = {
  1: 'Empleo',
  2: 'Sector Privado',
  3: 'Sector Público',
  4: 'Empleo en casas particulares',
  5: 'Autónomos',
  6: 'Monotributo',
  7: 'Monotributo Social',
  8: 'Total',
};

const COLOR_PALETTE = [
  '#15803d', // Verde Corrientes
  '#b45309', // Ámbar Chaco
  '#1d4ed8', // Azul Formosa
  '#d97706', // Naranja Misiones
  '#7c3aed',
  '#0284c7',
  '#e11d48',
];

export default function EmpleoNacionalPage() {
  const [activeTab, setActiveTab] = useState<'nacion' | 'tipo-registro' | 'provincias'>('provincias');
  const [selectedYear, setSelectedYear] = useState<string>('TODOS');
  const [selectedFecha, setSelectedFecha] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('NEA');

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

          const neaReg = json.regiones?.find((r: any) => r.nombre_region?.toUpperCase() === 'NEA');
          if (neaReg) {
            setSelectedRegion(neaReg.nombre_region);
          } else if (json.regiones?.length > 0) {
            setSelectedRegion(json.regiones[0].nombre_region);
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

  // Procesar serie provincial
  useEffect(() => {
    if (!rawProvincias || rawProvincias.length === 0) return;

    const grouped: { [key: string]: any } = {};
    const provSet = new Set<string>();

    rawProvincias.forEach((row) => {
      if (
        selectedRegion !== 'TODAS' &&
        row.nombre_region?.toUpperCase() !== selectedRegion.toUpperCase()
      ) {
        return;
      }

      const yearStr = row.fecha ? row.fecha.substring(0, 4) : '';
      if (selectedYear !== 'TODOS' && yearStr !== selectedYear) return;

      const dateParts = row.fecha.split('-');
      const yearShort = dateParts[0] ? dateParts[0].slice(-2) : '';
      const monthNum = parseInt(dateParts[1], 10);
      const monthsEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const monthLabel = monthsEs[monthNum - 1] || 'mes';
      const label = `${monthLabel}-${yearShort}`;

      if (!grouped[row.fecha]) {
        grouped[row.fecha] = { fechaLabel: label, originalFecha: row.fecha };
      }

      const provName = row.nombre_provincia || `Prov_${row.id_provincia}`;
      provSet.add(provName);

      const puestosVal = Number(row.cantidad_sin_estacionalidad || row.cantidad_con_estacionalidad) || 0;
      grouped[row.fecha][provName] = puestosVal > 1000 ? +(puestosVal / 1000).toFixed(1) : +puestosVal.toFixed(1);
    });

    setChartDataProv(Object.values(grouped));
    setActiveProvinces(Array.from(provSet));
  }, [rawProvincias, selectedYear, selectedRegion]);

  // Procesar serie nacional
  useEffect(() => {
    if (!rawNacion || rawNacion.length === 0) return;

    const filtered = rawNacion.filter((row) => {
      const yearStr = row.fecha ? row.fecha.substring(0, 4) : '';
      return selectedYear === 'TODOS' || yearStr === selectedYear;
    });

    const formatted = filtered.map((row) => {
      const dateParts = row.fecha.split('-');
      const yearShort = dateParts[0] ? dateParts[0].slice(-2) : '';
      const monthNum = parseInt(dateParts[1], 10);
      const monthsEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const monthLabel = monthsEs[monthNum - 1] || 'mes';

      const totalVal = Number(row.total_puestos) || 0;
      return {
        fechaLabel: `${monthLabel}-${yearShort}`,
        Total: totalVal > 1000 ? +(totalVal / 1000).toFixed(1) : +totalVal.toFixed(1),
        var_mensual: Number(row.var_mensual) || 0,
        var_interanual: Number(row.var_interanual) || 0,
      };
    });

    setChartDataNacion(formatted);
  }, [rawNacion, selectedYear]);

  // Procesar desglose por tipo de registro para la fecha activa
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
          cantidadMil: +(val / 1000).toFixed(1),
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

  // KPIs Provinciales
  const rowsFechaProv = rawProvincias.filter(
    (r) =>
      r.fecha === selectedFecha &&
      (selectedRegion === 'TODAS' || r.nombre_region?.toUpperCase() === selectedRegion.toUpperCase())
  );
  const corrientes = rawProvincias.find(
    (r) => r.fecha === selectedFecha && r.nombre_provincia?.toLowerCase() === 'corrientes'
  );
  const sumPuestos = rowsFechaProv.reduce((acc, curr) => acc + (Number(curr.cantidad_sin_estacionalidad) || 0), 0);
  const avgPuestos = rowsFechaProv.length > 0 ? sumPuestos / rowsFechaProv.length : 0;
  const avgVarInter = rowsFechaProv.length > 0
    ? rowsFechaProv.reduce((acc, curr) => acc + (Number(curr.var_interanual) || 0), 0) / rowsFechaProv.length
    : 0;
  const avgVarMen = rowsFechaProv.length > 0
    ? rowsFechaProv.reduce((acc, curr) => acc + (Number(curr.var_mensual) || 0), 0) / rowsFechaProv.length
    : 0;

  // KPIs Nacionales
  const rowNacionAct = rawNacion.find((r) => r.fecha === selectedFecha);
  const totalNacionMillones = rowNacionAct ? (Number(rowNacionAct.total_puestos) / 1000000).toFixed(1) : '12.8';

  return (
    <div className={styles.container}>
      {/* Header y Control de Sub-Tabs */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>EMPLEO REGISTRADO</h1>
          <p>SISTEMA INTEGRADO PREVISIONAL ARGENTINO (SIPA)</p>
        </div>

        <div className={styles.topControls}>
          {/* Sub Tabs */}
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

          {/* Filtro Región (solo en vista provincial) */}
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

          {/* Selector Fecha Global */}
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
              {activeTab === 'nacion' && 'Evolución mensual empleo registrado (en miles)'}
              {activeTab === 'tipo-registro' && 'Análisis por tipo de registro (en miles)'}
              {activeTab === 'provincias' && `Empleo privado por provincia (${selectedRegion})`}
            </div>

            {activeTab !== 'tipo-registro' && (
              <div className={styles.yearFilter}>
                {['TODOS', '2023', '2024', '2025', '2026'].map((yr) => (
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
              Cargando datos de empleo SIPA...
            </div>
          ) : (
            <div className={styles.chartScrollArea}>
              <div className={styles.chartCanvas}>
                {/* 1. GRÁFICO NACIONAL */}
                {activeTab === 'nacion' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartDataNacion}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="fechaLabel" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => [`${v.toLocaleString('es-AR')} mil`, 'Total']} />
                      <Line type="monotone" dataKey="Total" stroke="#15803d" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {/* 2. GRÁFICO BARRAS POR REGISTRO */}
                {activeTab === 'tipo-registro' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataRegistros} layout="vertical" margin={{ left: 120, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="tipo" type="category" tick={{ fontSize: 11, fontWeight: 600 }} />
                      <Tooltip formatter={(v: number) => [`${v.toLocaleString('es-AR')} mil puestos`, 'Cantidad']} />
                      <Bar dataKey="cantidadMil" fill="#14203b" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {/* 3. GRÁFICO PROVINCIAL */}
                {activeTab === 'provincias' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartDataProv}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="fechaLabel" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => [`${v.toLocaleString('es-AR')} mil`, 'Puestos']} />
                      <Legend />
                      {activeProvinces.map((provName, idx) => (
                        <Line
                          key={provName}
                          type="monotone"
                          dataKey={provName}
                          name={provName}
                          stroke={COLOR_PALETTE[idx % COLOR_PALETTE.length]}
                          strokeWidth={provName.toLowerCase() === 'corrientes' ? 3 : 2}
                          dot={{ r: provName.toLowerCase() === 'corrientes' ? 4 : 3 }}
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
                    {`${Number(rowNacionAct?.var_interanual || 0) >= 0 ? '+' : ''}${Number(rowNacionAct?.var_interanual || 0).toFixed(1)}%`}
                  </div>
                  <div className={styles.kpiLabel}>Interanual</div>
                </div>
                <div>
                  <div
                    className={styles.kpiVal}
                    style={{ color: Number(rowNacionAct?.var_mensual || 0) >= 0 ? '#16a34a' : '#dc2626' }}
                  >
                    {`${Number(rowNacionAct?.var_mensual || 0) >= 0 ? '+' : ''}${Number(rowNacionAct?.var_mensual || 0).toFixed(1)}%`}
                  </div>
                  <div className={styles.kpiLabel}>Mensual (s/e)</div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Tarjeta Regional */}
              <div className={styles.kpiCard}>
                <div className={styles.kpiHeader}>Promedio empleo privado {selectedRegion}</div>
                <div className={styles.kpiMetrics}>
                  <div>
                    <div className={styles.kpiVal}>
                      {avgPuestos > 1000 ? (avgPuestos / 1000).toFixed(1).replace('.', ',') : avgPuestos.toFixed(1)}
                    </div>
                    <div className={styles.kpiLabel}>mil puestos</div>
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
                      {corrientes?.cantidad_sin_estacionalidad
                        ? (Number(corrientes.cantidad_sin_estacionalidad) / 1000).toFixed(1).replace('.', ',')
                        : '-'}
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
                      {corrientes?.var_interanual
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
                      {corrientes?.var_mensual
                        ? `${Number(corrientes.var_mensual) >= 0 ? '+' : ''}${Number(corrientes.var_mensual).toFixed(1)}%`
                        : '-'}
                    </div>
                    <div className={styles.kpiLabel}>Mensual (s/e)</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Botón inferior para pasar de vista */}
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