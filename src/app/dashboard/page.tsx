'use client';

import { withBasePath } from '../../lib/basePath';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import {
  Tag,
  Users,
  DollarSign,
  Factory,
  ArrowUpRight,
} from 'lucide-react';
import styles from './Resumen.module.css';

export default function ResumenPrincipalPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(withBasePath('/api/resumen'));
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Error cargando datos del resumen:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const formatMonthLabel = (fStr?: string) => {
    if (!fStr) return 'may-26';
    const parts = fStr.split('-');
    if (parts.length < 2) return fStr;
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${months[parseInt(parts[1], 10) - 1]}-${parts[0].slice(-2)}`;
  };

  // 1. PRECIOS & CANASTAS
  const ipcRows = data?.ipc || [];
  const ipcNacSeries = ipcRows.filter((r: any) => r.region?.toLowerCase().includes('nacion')).map((r: any) => ({
    ...r,
    var_mensual: Number(r.var_mensual) || 0,
  }));
  const ipcNeaSeries = ipcRows.filter((r: any) => r.region?.toLowerCase().includes('nea')).map((r: any) => ({
    ...r,
    var_mensual: Number(r.var_mensual) || 0,
  }));
  const lastIpcNac = ipcNacSeries[ipcNacSeries.length - 1];
  const lastIpcNea = ipcNeaSeries[ipcNeaSeries.length - 1] || lastIpcNac;

  const cbtCbaRows = data?.cbt_cba || [];
  const lastCbtCba = cbtCbaRows[cbtCbaRows.length - 1];

  // 2. EMPLEO (SIPA & SRT)
  const sipaRows = data?.sipa || [];
  const sipaNacSeries = sipaRows.filter((r: any) => r.ambito === 'Nacion');
  const sipaCtesSeries = sipaRows.filter((r: any) => r.ambito === 'Corrientes');
  const lastSipaNac = sipaNacSeries[sipaNacSeries.length - 1];
  const lastSipaCtes = sipaCtesSeries[sipaCtesSeries.length - 1];

  const srtRows = data?.srt || [];
  const srtNacSeries = srtRows.filter((r: any) => r.ambito === 'Nacion');
  const srtCtesSeries = srtRows.filter((r: any) => r.ambito === 'Corrientes');
  const lastSrtNac = srtNacSeries[srtNacSeries.length - 1];
  const lastSrtCtes = srtCtesSeries[srtCtesSeries.length - 1];

  const formatSipaNacion = (val: number) => {
    if (!val) return '12,8 mill.';
    const num = Number(val);
    const millones = num > 100000 ? num / 1000000 : num / 1000;
    return `${millones.toFixed(1).replace('.', ',')} mill.`;
  };

  const formatSipaCtes = (val: number) => {
    if (!val) return '76,2 mil';
    const num = Number(val);
    const miles = num > 10000 ? num / 1000 : num;
    return `${miles.toFixed(1).replace('.', ',')} mil`;
  };

  // 3. SALARIOS
  const ripteRows = data?.ripte || [];
  const smvmRows = data?.smvm || [];
  const lastRipte = ripteRows[ripteRows.length - 1];
  const lastSmvm = smvmRows[smvmRows.length - 1];

  // 4. INDUSTRIA & CONSTRUCCIÓN
  const ipiRows = data?.ipi || [];
  const lastIpi = ipiRows[ipiRows.length - 1];

  const ipicorrRows = data?.ipicorr || [];
  const lastIpicorr = ipicorrRows[ipicorrRows.length - 1];

  const iericRows = data?.ieric || [];
  const iericNeaSeries = iericRows.filter((r: any) => r.ambito === 'NEA');
  const iericCtesSeries = iericRows.filter((r: any) => r.ambito === 'Corrientes');
  const lastIericNea = iericNeaSeries[iericNeaSeries.length - 1];
  const lastIericCtes = iericCtesSeries[iericCtesSeries.length - 1];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>PRINCIPALES INDICADORES ECONÓMICOS</h1>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '80px', textAlign: 'center', color: '#64748b' }}>
          Cargando indicadores económicos...
        </div>
      ) : (
        <div className={styles.gridCards}>
          {/* ========================================================================= */}
          {/* CARD 1: PRECIOS Y CANASTAS BÁSICAS (4 FILAS) */}
          {/* ========================================================================= */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <Tag size={16} />
                <span>Precios y Canastas Básicas</span>
              </div>
              <span className={styles.cardDate}>{formatMonthLabel(lastIpcNac?.fecha)}</span>
            </div>

            <div className={styles.cardBody}>
              {/* 1. IPC Nación */}
              <div className={styles.indicatorRow}>
                <div className={styles.mapIconCircle}>PAÍS</div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastIpcNac?.var_acumulada ? `${Number(lastIpcNac.var_acumulada).toFixed(1)}%` : '14,7%'}
                  </div>
                  <div className={styles.metricLabel}>IPC Acumulado</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastIpcNac?.var_interanual ? `${Number(lastIpcNac.var_interanual).toFixed(1)}%` : '33,2%'}
                  </div>
                  <div className={styles.metricLabel}>Interanual</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastIpcNac?.var_mensual ? `${Number(lastIpcNac.var_mensual).toFixed(1)}%` : '2,1%'}
                  </div>
                  <div className={styles.metricLabel}>Mensual</div>
                </div>
                <div className={styles.sparklineContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ipcNacSeries.slice(-12)}>
                      <Line type="monotone" dataKey="var_mensual" stroke="#0284c7" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <Link href="/dashboard/ipc" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              {/* 2. IPC NEA */}
              <div className={styles.indicatorRow}>
                <div className={`${styles.mapIconCircle} ${styles.mapIconCorrientes}`}>NEA</div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastIpcNea?.var_acumulada ? `${Number(lastIpcNea.var_acumulada).toFixed(1)}%` : '17,6%'}
                  </div>
                  <div className={styles.metricLabel}>IPC Acumulado</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastIpcNea?.var_interanual ? `${Number(lastIpcNea.var_interanual).toFixed(1)}%` : '35,3%'}
                  </div>
                  <div className={styles.metricLabel}>Interanual</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastIpcNea?.var_mensual ? `${Number(lastIpcNea.var_mensual).toFixed(1)}%` : '2,6%'}
                  </div>
                  <div className={styles.metricLabel}>Mensual</div>
                </div>
                <div className={styles.sparklineContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ipcNeaSeries.slice(-12)}>
                      <Line type="monotone" dataKey="var_mensual" stroke="#84cc16" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <Link href="/dashboard/ipc" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              {/* 3. CBT Hogar */}
              <div className={styles.indicatorRow}>
                <div className={styles.mapIconCircle}>CBT</div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    ${lastCbtCba?.cbt_hogar ? Math.round(Number(lastCbtCba.cbt_hogar)).toLocaleString('es-AR') : '1.564.716'}
                  </div>
                  <div className={styles.metricLabel}>CBT Hogar</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastCbtCba?.cbt_ia ? `${Number(lastCbtCba.cbt_ia).toFixed(1)}%` : '36,1%'}
                  </div>
                  <div className={styles.metricLabel}>Interanual</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastCbtCba?.cbt_men ? `${Number(lastCbtCba.cbt_men).toFixed(1)}%` : '2,2%'}
                  </div>
                  <div className={styles.metricLabel}>CBT m.m.</div>
                </div>
                <div className={styles.sparklineContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cbtCbaRows.slice(-12)}>
                      <Line type="monotone" dataKey="cbt_men" stroke="#0284c7" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <Link href="/dashboard/indicadores_pais" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              {/* 4. CBA Hogar */}
              <div className={styles.indicatorRow}>
                <div className={styles.mapIconCircle}>CBA</div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    ${lastCbtCba?.cba_hogar ? Math.round(Number(lastCbtCba.cba_hogar)).toLocaleString('es-AR') : '708.016'}
                  </div>
                  <div className={styles.metricLabel}>CBA Hogar</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastCbtCba?.cba_ia ? `${Number(lastCbtCba.cba_ia).toFixed(1)}%` : '37,4%'}
                  </div>
                  <div className={styles.metricLabel}>Interanual</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastCbtCba?.cba_men ? `${Number(lastCbtCba.cba_men).toFixed(1)}%` : '2,6%'}
                  </div>
                  <div className={styles.metricLabel}>CBA m.m.</div>
                </div>
                <div className={styles.sparklineContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cbtCbaRows.slice(-12)}>
                      <Line type="monotone" dataKey="cba_men" stroke="#84cc16" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <Link href="/dashboard/indicadores_pais" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD 2: EMPLEO PRIVADO Y REGISTRADO (4 FILAS) */}
          {/* ========================================================================= */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <Users size={16} />
                <span>Empleo Privado y Registrado</span>
              </div>
              <span className={styles.cardDate}>{formatMonthLabel(lastSipaNac?.fecha)}</span>
            </div>

            <div className={styles.cardBody}>
              {/* 1. SIPA Nación */}
              <div className={styles.indicatorRow}>
                <div className={styles.mapIconCircle}>PAÍS</div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {formatSipaNacion(lastSipaNac?.puestos)}
                  </div>
                  <div className={styles.metricLabel}>Puestos Privados (SIPA)</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastSipaNac?.var_interanual ? `${Number(lastSipaNac.var_interanual).toFixed(1)}%` : '-2,2%'}
                  </div>
                  <div className={styles.metricLabel}>Interanual</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastSipaNac?.var_mensual ? `${Number(lastSipaNac.var_mensual).toFixed(1)}%` : '-0,1%'}
                  </div>
                  <div className={styles.metricLabel}>Mensual (s/e)</div>
                </div>
                <div className={styles.sparklineContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sipaNacSeries.slice(-12)}>
                      <Line type="monotone" dataKey="puestos" stroke="#0284c7" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <Link href="/dashboard/empleo_nacional" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              {/* 2. SIPA Corrientes */}
              <div className={styles.indicatorRow}>
                <div className={`${styles.mapIconCircle} ${styles.mapIconCorrientes}`}>CTES</div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {formatSipaCtes(lastSipaCtes?.puestos)}
                  </div>
                  <div className={styles.metricLabel}>Puestos Privados (SIPA)</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastSipaCtes?.var_interanual ? `${Number(lastSipaCtes.var_interanual).toFixed(1)}%` : '-5,3%'}
                  </div>
                  <div className={styles.metricLabel}>Interanual</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastSipaCtes?.var_mensual ? `${Number(lastSipaCtes.var_mensual).toFixed(1)}%` : '0,1%'}
                  </div>
                  <div className={styles.metricLabel}>Mensual (s/e)</div>
                </div>
                <div className={styles.sparklineContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sipaCtesSeries.slice(-12)}>
                      <Line type="monotone" dataKey="puestos" stroke="#84cc16" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <Link href="/dashboard/empleo_nacional" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              {/* 3. SRT Nación */}
              <div className={styles.indicatorRow}>
                <div className={styles.mapIconCircle}>PAÍS</div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastSrtNac?.trabajadores ? `${(Number(lastSrtNac.trabajadores) / 1000000).toFixed(1)} mill.` : '10,0 mill.'}
                  </div>
                  <div className={styles.metricLabel}>Trabajadores SRT</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    ${lastSrtNac?.salario_promedio ? Math.round(Number(lastSrtNac.salario_promedio)).toLocaleString('es-AR') : '$850.000'}
                  </div>
                  <div className={styles.metricLabel}>Salario Promedio</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>Nacional</div>
                  <div className={styles.metricLabel}>Cobertura</div>
                </div>
                <div className={styles.sparklineContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={srtNacSeries.slice(-12)}>
                      <Line type="monotone" dataKey="trabajadores" stroke="#0284c7" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <Link href="/dashboard/empleo_provincial" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              {/* 4. SRT Corrientes */}
              <div className={styles.indicatorRow}>
                <div className={`${styles.mapIconCircle} ${styles.mapIconCorrientes}`}>CTES</div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastSrtCtes?.trabajadores ? `${(Number(lastSrtCtes.trabajadores) / 1000).toFixed(1)} mil` : '170,2 mil'}
                  </div>
                  <div className={styles.metricLabel}>Trabajadores SRT</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    ${lastSrtCtes?.salario_promedio ? Math.round(Number(lastSrtCtes.salario_promedio)).toLocaleString('es-AR') : '$713.464'}
                  </div>
                  <div className={styles.metricLabel}>Salario Promedio</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>Corrientes</div>
                  <div className={styles.metricLabel}>Cobertura</div>
                </div>
                <div className={styles.sparklineContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={srtCtesSeries.slice(-12)}>
                      <Line type="monotone" dataKey="trabajadores" stroke="#84cc16" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <Link href="/dashboard/empleo_provincial" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD 3: SALARIOS E INGRESOS (4 FILAS) */}
          {/* ========================================================================= */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <DollarSign size={16} />
                <span>Salarios e Ingresos</span>
              </div>
              <span className={styles.cardDate}>{formatMonthLabel(lastRipte?.fecha)}</span>
            </div>

            <div className={styles.cardBody}>
              {/* 1. RIPTE */}
              <div className={styles.indicatorRow}>
                <div className={styles.mapIconCircle}>PAÍS</div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>RIPTE</div>
                  <div className={styles.metricLabel}>{formatMonthLabel(lastRipte?.fecha)}</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    ${lastRipte?.valor ? Math.round(Number(lastRipte.valor)).toLocaleString('es-AR') : '$1.915.879'}
                  </div>
                  <div className={styles.metricLabel}>Monto RIPTE</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastRipte?.var_interanual ? `${Number(lastRipte.var_interanual).toFixed(1)}%` : '30,5%'}
                  </div>
                  <div className={styles.metricLabel}>Interanual</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastRipte?.var_mensual ? `${Number(lastRipte.var_mensual).toFixed(1)}%` : '3,6%'}
                  </div>
                  <div className={styles.metricLabel}>Mensual</div>
                </div>
                <Link href="/dashboard/indicadores_pais" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              {/* 2. SMVM */}
              <div className={styles.indicatorRow}>
                <div className={styles.mapIconCircle}>PAÍS</div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>SMVM</div>
                  <div className={styles.metricLabel}>{formatMonthLabel(lastSmvm?.fecha)}</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    ${lastSmvm?.valor ? Math.round(Number(lastSmvm.valor)).toLocaleString('es-AR') : '$376.600'}
                  </div>
                  <div className={styles.metricLabel}>Monto SMVM</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastSmvm?.var_interanual ? `${Number(lastSmvm.var_interanual).toFixed(1)}%` : '17,0%'}
                  </div>
                  <div className={styles.metricLabel}>Interanual</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastSmvm?.var_mensual ? `${Number(lastSmvm.var_mensual).toFixed(1)}%` : '1,1%'}
                  </div>
                  <div className={styles.metricLabel}>Mensual</div>
                </div>
                <Link href="/dashboard/indicadores_pais" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              {/* 3. RIPTE Sparkline */}
              <div className={styles.indicatorRow}>
                <div className={styles.mapIconCircle}>SERIE</div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>Tendencia</div>
                  <div className={styles.metricLabel}>RIPTE últimos 12 m.</div>
                </div>
                <div className={styles.metricCol} style={{ gridColumn: 'span 3' }}>
                  <div style={{ width: '100%', height: '26px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={ripteRows.slice(-12)}>
                        <Line type="monotone" dataKey="var_mensual" stroke="#0284c7" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <Link href="/dashboard/indicadores" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              {/* 4. SMVM Sparkline */}
              <div className={styles.indicatorRow}>
                <div className={styles.mapIconCircle}>SERIE</div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>Tendencia</div>
                  <div className={styles.metricLabel}>SMVM últimos 12 m.</div>
                </div>
                <div className={styles.metricCol} style={{ gridColumn: 'span 3' }}>
                  <div style={{ width: '100%', height: '26px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={smvmRows.slice(-12)}>
                        <Line type="monotone" dataKey="var_mensual" stroke="#84cc16" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <Link href="/dashboard/indicadores_pais" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD 4: INDUSTRIA Y CONSTRUCCIÓN (4 FILAS) */}
          {/* ========================================================================= */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <Factory size={16} />
                <span>Industria y Construcción</span>
              </div>
              <span className={styles.cardDate}>{formatMonthLabel(lastIpi?.fecha)}</span>
            </div>

            <div className={styles.cardBody}>
              {/* 1. IPI Manufacturero País */}
              <div className={styles.indicatorRow}>
                <div className={styles.mapIconCircle}>IPI</div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>Nacional</div>
                  <div className={styles.metricLabel}>IPI Manufacturero</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={`${styles.metricVal} text-rose-600`}>
                    {lastIpi?.var_interanual ? `${Number(lastIpi.var_interanual).toFixed(1)}%` : '-0,6%'}
                  </div>
                  <div className={styles.metricLabel}>Interanual</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastIpi?.var_mensual ? `${Number(lastIpi.var_mensual).toFixed(1)}%` : '0,0%'}
                  </div>
                  <div className={styles.metricLabel}>Mensual</div>
                </div>
                <div className={styles.sparklineContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ipiRows.slice(-12)}>
                      <Line type="monotone" dataKey="var_mensual" stroke="#0284c7" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <Link href="/dashboard/industria" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              {/* 2. IPICorr (Corrientes) */}
              <div className={styles.indicatorRow}>
                <div className={`${styles.mapIconCircle} ${styles.mapIconCorrientes}`}>CTES</div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>IPICorr</div>
                  <div className={styles.metricLabel}>{formatMonthLabel(lastIpicorr?.fecha)}</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={`${styles.metricVal} text-rose-600`}>
                    {lastIpicorr?.var_interanual ? `${Number(lastIpicorr.var_interanual).toFixed(1)}%` : '-0,3%'}
                  </div>
                  <div className={styles.metricLabel}>Interanual</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastIpicorr?.var_mensual ? `${Number(lastIpicorr.var_mensual).toFixed(1)}%` : '0,0%'}
                  </div>
                  <div className={styles.metricLabel}>Mensual</div>
                </div>
                <div className={styles.sparklineContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ipicorrRows.slice(-12)}>
                      <Line type="monotone" dataKey="var_mensual" stroke="#84cc16" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <Link href="/dashboard/industria" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              {/* 3. IERIC Construcción NEA */}
              <div className={styles.indicatorRow}>
                <div className={`${styles.mapIconCircle} ${styles.mapIconCorrientes}`}>NEA</div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastIericNea?.puestos ? Number(lastIericNea.puestos).toLocaleString('es-AR') : '15.439.415'}
                  </div>
                  <div className={styles.metricLabel}>Puestos Construcción</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={`${styles.metricVal} text-rose-600`}>
                    {lastIericNea?.puestos_ia ? `${Number(lastIericNea.puestos_ia).toFixed(1)}%` : '-0,1%'}
                  </div>
                  <div className={styles.metricLabel}>Interanual</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastIericNea?.empresas ? Number(lastIericNea.empresas).toLocaleString('es-AR') : '979'}
                  </div>
                  <div className={styles.metricLabel}>Empresas Activas</div>
                </div>
                <div className={styles.sparklineContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={iericNeaSeries.slice(-12)}>
                      <Line type="monotone" dataKey="puestos_ia" stroke="#84cc16" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <Link href="/dashboard/construccion" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              {/* 4. IERIC Construcción Corrientes */}
              <div className={styles.indicatorRow}>
                <div className={`${styles.mapIconCircle} ${styles.mapIconCorrientes}`}>CTES</div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastIericCtes?.puestos ? Number(lastIericCtes.puestos).toLocaleString('es-AR') : '3.793.071'}
                  </div>
                  <div className={styles.metricLabel}>Puestos Corrientes</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={`${styles.metricVal} text-rose-600`}>
                    {lastIericCtes?.puestos_ia ? `${Number(lastIericCtes.puestos_ia).toFixed(1)}%` : '-0,3%'}
                  </div>
                  <div className={styles.metricLabel}>Interanual</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastIericCtes?.empresas ? Number(lastIericCtes.empresas).toLocaleString('es-AR') : '290'}
                  </div>
                  <div className={styles.metricLabel}>Empresas Activas</div>
                </div>
                <div className={styles.sparklineContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={iericCtesSeries.slice(-12)}>
                      <Line type="monotone" dataKey="puestos_ia" stroke="#84cc16" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <Link href="/dashboard/construccion" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}