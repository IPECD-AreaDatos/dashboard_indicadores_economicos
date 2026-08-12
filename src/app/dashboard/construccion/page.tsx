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
import { ArrowRight } from 'lucide-react';
import styles from './Construccion.module.css';

const COLOR_PALETTE = [
  '#15803d', // Verde (Corrientes)
  '#b45309', // Ámbar
  '#1d4ed8', // Azul
  '#d97706', // Naranja
  '#7c3aed', // Púrpura
  '#0284c7', // Celeste
  '#e11d48', // Rojo/Rosa
  '#059669', // Esmeralda
];

export default function ConstruccionPage() {
  const [mode, setMode] = useState<'puestos' | 'empresas'>('puestos');
  const [subMetric, setSubMetric] = useState<'valor' | 'interanual' | 'mensual'>('valor');
  const [selectedYear, setSelectedYear] = useState<string>('TODOS');
  const [selectedFecha, setSelectedFecha] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('NEA');

  const [rawSerie, setRawSerie] = useState<any[]>([]);
  const [regionesList, setRegionesList] = useState<any[]>([]);
  const [fechasList, setFechasList] = useState<string[]>([]);

  const [chartData, setChartData] = useState<any[]>([]);
  const [activeProvinces, setActiveProvinces] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/construccion');
        const json = await res.json();

        if (json.serie && json.serie.length > 0) {
          setRawSerie(json.serie);
          setRegionesList(json.regiones || []);
          setFechasList(json.fechasDisponibles || []);

          if (json.fechasDisponibles.length > 0) {
            setSelectedFecha(json.fechasDisponibles[0]);
          }

          const neaReg = json.regiones.find((r: any) => r.nombre_region?.toUpperCase() === 'NEA');
          if (neaReg) {
            setSelectedRegion(neaReg.nombre_region);
          } else if (json.regiones.length > 0) {
            setSelectedRegion(json.regiones[0].nombre_region);
          }
        }
      } catch (err) {
        console.error('Error al cargar datos IERIC:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (!rawSerie || rawSerie.length === 0) return;

    const grouped: { [key: string]: any } = {};
    const provSet = new Set<string>();

    rawSerie.forEach((row) => {
      if (
        selectedRegion !== 'TODAS' &&
        row.nombre_region?.toUpperCase() !== selectedRegion.toUpperCase()
      ) {
        return;
      }

      // Extraer año limpiamente del string YYYY-MM-DD
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

      if (mode === 'puestos') {
        grouped[row.fecha][`${provName}_valor`] = Math.round(Number(row.puestos_de_trabajo) || 0);
        grouped[row.fecha][`${provName}_interanual`] = Number(row.puestos_var_interanual) || 0;
        grouped[row.fecha][`${provName}_mensual`] = Number(row.puestos_var_mensual) || 0;
      } else {
        grouped[row.fecha][`${provName}_valor`] = Math.round(Number(row.cant_empresas) || 0);
        grouped[row.fecha][`${provName}_interanual`] = Number(row.empresas_var_interanual) || 0;
      }
    });

    setChartData(Object.values(grouped));
    setActiveProvinces(Array.from(provSet));
  }, [rawSerie, mode, subMetric, selectedYear, selectedRegion]);

  const getKpis = () => {
    if (!rawSerie || !selectedFecha) return { corrientes: null, regTotalPuestos: 0, regTotalEmpresas: 0 };

    const rowsFecha = rawSerie.filter(
      (r) =>
        r.fecha === selectedFecha &&
        (selectedRegion === 'TODAS' || r.nombre_region?.toUpperCase() === selectedRegion.toUpperCase())
    );

    const corrientes = rawSerie.find(
      (r) => r.fecha === selectedFecha && r.nombre_provincia?.toLowerCase() === 'corrientes'
    );

    const regTotalPuestos = rowsFecha.reduce((acc, curr) => acc + Math.round(Number(curr.puestos_de_trabajo) || 0), 0);
    const regTotalEmpresas = rowsFecha.reduce((acc, curr) => acc + Math.round(Number(curr.cant_empresas) || 0), 0);

    return { corrientes, regTotalPuestos, regTotalEmpresas };
  };

  const kpiData = getKpis();

  const formatFechaLabel = (fStr: string) => {
    if (!fStr) return '-';
    const dateParts = fStr.split('-');
    if (dateParts.length < 2) return fStr;
    const monthsEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const monthNum = parseInt(dateParts[1], 10);
    const monthLabel = monthsEs[monthNum - 1] || '';
    return `${monthLabel}-${dateParts[0].slice(-2)}`;
  };

  const formatTooltipValue = (value: number) => {
    if (subMetric === 'valor') {
      return Math.round(value).toLocaleString('es-AR');
    }
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>IERIC - INDICADORES DEL SECTOR DE CONSTRUCCIÓN</h1>
          <p>PROVINCIA DE CORRIENTES Y ANÁLISIS REGIONAL</p>
        </div>

        <div className={styles.topFilters}>
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

      <div className={styles.mainGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.badgeCategory}>
              {mode === 'puestos'
                ? 'Puestos de Trabajo en el Sector Construcción'
                : 'Cantidad de Empresas en el Sector Construcción'}
            </div>

            <div className={styles.metricSelectors}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="subMetric"
                  checked={subMetric === 'valor'}
                  onChange={() => setSubMetric('valor')}
                />
                {mode === 'puestos' ? 'Puestos de trabajo' : 'Empresas'}
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="subMetric"
                  checked={subMetric === 'interanual'}
                  onChange={() => setSubMetric('interanual')}
                />
                Var. Interanual
              </label>
              {mode === 'puestos' && (
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="subMetric"
                    checked={subMetric === 'mensual'}
                    onChange={() => setSubMetric('mensual')}
                  />
                  Var. Mensual
                </label>
              )}
            </div>

            <div className={styles.yearFilter}>
              <button
                className={`${styles.yearBtn} ${selectedYear === 'TODOS' ? styles.yearBtnActive : ''}`}
                onClick={() => setSelectedYear('TODOS')}
              >
                Todos
              </button>
              <button
                className={`${styles.yearBtn} ${selectedYear === '2024' ? styles.yearBtnActive : ''}`}
                onClick={() => setSelectedYear('2024')}
              >
                2024
              </button>
              <button
                className={`${styles.yearBtn} ${selectedYear === '2025' ? styles.yearBtnActive : ''}`}
                onClick={() => setSelectedYear('2025')}
              >
                2025
              </button>
              <button
                className={`${styles.yearBtn} ${selectedYear === '2026' ? styles.yearBtnActive : ''}`}
                onClick={() => setSelectedYear('2026')}
              >
                2026
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '80px', textAlign: 'center', color: '#64748b' }}>
              Cargando gráfico de IERIC...
            </div>
          ) : chartData.length === 0 ? (
            <div style={{ padding: '80px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
              No existen datos registrados para la región {selectedRegion} en el período {selectedYear}.
            </div>
          ) : (
            <div className={styles.chartScrollArea}>
              <div className={styles.chartCanvas}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="fechaLabel" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={formatTooltipValue} />
                    <Legend />
                    {activeProvinces.map((provName, idx) => (
                      <Line
                        key={provName}
                        type="monotone"
                        dataKey={`${provName}_${subMetric}`}
                        name={provName}
                        stroke={COLOR_PALETTE[idx % COLOR_PALETTE.length]}
                        strokeWidth={provName.toLowerCase() === 'corrientes' ? 3 : 2}
                        dot={{ r: provName.toLowerCase() === 'corrientes' ? 4 : 3 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <p className={styles.footerNote}>
            Fuente: IPECD en base a Instituto de Estadística y Registro de la Industria de la Construcción (IERIC)
          </p>
        </div>

        {/* KPIs Laterales */}
        <div className={styles.kpiColumn}>
          <div className={styles.dateDisplay}>{formatFechaLabel(selectedFecha)}</div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              {mode === 'puestos'
                ? `Puestos de Trabajo ${selectedRegion}`
                : `Empresas Rubro Construcción ${selectedRegion}`}
            </div>
            <div className={styles.kpiMetrics}>
              <div>
                <div className={styles.kpiVal}>
                  {mode === 'puestos'
                    ? kpiData.regTotalPuestos.toLocaleString('es-AR')
                    : kpiData.regTotalEmpresas.toLocaleString('es-AR')}
                </div>
                <div className={styles.kpiLabel}>{mode === 'puestos' ? 'Puestos' : 'Empresas'}</div>
              </div>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              {mode === 'puestos' ? 'Puestos de Trabajo Corrientes' : 'Empresas Rubro Construcción Corrientes'}
            </div>
            <div className={styles.kpiMetrics}>
              <div>
                <div className={styles.kpiVal}>
                  {mode === 'puestos'
                    ? Math.round(Number(kpiData.corrientes?.puestos_de_trabajo || 0)).toLocaleString('es-AR')
                    : Math.round(Number(kpiData.corrientes?.cant_empresas || 0)).toLocaleString('es-AR')}
                </div>
                <div className={styles.kpiLabel}>{mode === 'puestos' ? 'Puestos' : 'Empresas'}</div>
              </div>
              <div>
                <div className={`${styles.kpiVal} text-rose-600`}>
                  {mode === 'puestos'
                    ? `${Number(kpiData.corrientes?.puestos_var_interanual || 0).toFixed(1)}%`
                    : `${Number(kpiData.corrientes?.empresas_var_interanual || 0).toFixed(1)}%`}
                </div>
                <div className={styles.kpiLabel}>Interanual</div>
              </div>
              {mode === 'puestos' && (
                <div>
                  <div className={`${styles.kpiVal} text-emerald-600`}>
                    {`${Number(kpiData.corrientes?.puestos_var_mensual || 0).toFixed(1)}%`}
                  </div>
                  <div className={styles.kpiLabel}>Mensual</div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              setMode(mode === 'puestos' ? 'empresas' : 'puestos');
              setSubMetric('valor');
            }}
            className={styles.switchModeBtn}
          >
            <span>{mode === 'puestos' ? 'Ver Empresas' : 'Ver Puestos de Trabajo'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}