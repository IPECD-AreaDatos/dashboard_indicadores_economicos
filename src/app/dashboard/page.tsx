'use client';

import { withBasePath } from '../../lib/basePath';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Tag,
  Users,
  DollarSign,
  Factory,
  ArrowUpRight,
} from 'lucide-react';
import styles from './Resumen.module.css';

// Componente para renderizar el logo circular del mapa con tooltip
function MapLogo({ type }: { type: 'pais' | 'nea' | 'corrientes' }) {
  const mapConfig = {
    pais: {
      src: withBasePath('/images/Argentina.jpg.jpeg'),
      label: 'Nivel País (Nacional)',
    },
    nea: {
      src: withBasePath('/images/NEA.jpg.jpeg'),
      label: 'Región NEA',
    },
    corrientes: {
      src: withBasePath('/images/Corrientes.jpg.jpeg'),
      label: 'Provincia de Corrientes',
    },
  };

  const item = mapConfig[type];

  return (
    <div className={styles.mapIconCircle}>
      <div className={styles.mapImgWrapper}>
        <img
          src={item.src}
          alt={type}
          className={styles.mapImg}
        />
      </div>
      <span className={styles.mapTooltip}>{item.label}</span>
    </div>
  );
}

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
    if (!fStr) return '-';
    const parts = fStr.split('-');
    if (parts.length < 2) return fStr;
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${months[parseInt(parts[1], 10) - 1]}-${parts[0].slice(-2)}`;
  };

  const formatPct = (val?: number | string | null) => {
    if (val === undefined || val === null) return '0,0%';
    let num = Number(val);
    if (Math.abs(num) < 1 && num !== 0) {
      num = num * 100;
    }
    return `${num.toFixed(1).replace('.', ',')}%`;
  };

  // 1. PRECIOS & CANASTAS
  const ipcRows = data?.ipc || [];
  const ipcNacSeries = ipcRows.filter((r: any) => r.region?.toLowerCase().includes('nacion'));
  const ipcNeaSeries = ipcRows.filter((r: any) => r.region?.toLowerCase().includes('nea'));
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

  const formatSipaNacion = (val?: number) => {
    if (!val) return '-';
    const num = Number(val);
    const millones = num > 10000 ? num / 1000 : num;
    return `${millones.toFixed(1).replace('.', ',')} mill.`;
  };

  const formatSipaCtes = (val?: number) => {
    if (!val) return '-';
    const num = Number(val);
    const miles = num > 10000 ? num / 1000 : num;
    return `${miles.toFixed(1).replace('.', ',')} mil`;
  };

  // 3. SALARIOS (4 Series Reales)
  const ripteRows = data?.ripte || [];
  const smvmRows = data?.smvm || [];
  const indiceSalRows = data?.indice_salario || [];
  const iericSalRows = data?.ieric_salario || [];

  const lastRipte = ripteRows[ripteRows.length - 1];
  const lastSmvm = smvmRows[smvmRows.length - 1];
  const lastIndiceSal = indiceSalRows[indiceSalRows.length - 1];
  const lastIericSal = iericSalRows[iericSalRows.length - 1];

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
          {/* CARD 1: PRECIOS Y CANASTAS BÁSICAS */}
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
                <MapLogo type="pais" />
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {formatPct(lastIpcNac?.var_acumulada)}
                  </div>
                  <div className={styles.metricLabel}>IPC Acumulado</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {formatPct(lastIpcNac?.var_interanual)}
                  </div>
                  <div className={styles.metricLabel}>Interanual</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {formatPct(lastIpcNac?.var_mensual)}
                  </div>
                  <div className={styles.metricLabel}>Mensual</div>
                </div>
                <Link href="/dashboard/ipc" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              {/* 2. IPC NEA */}
              <div className={styles.indicatorRow}>
                <MapLogo type="nea" />
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {formatPct(lastIpcNea?.var_acumulada)}
                  </div>
                  <div className={styles.metricLabel}>IPC Acumulado</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {formatPct(lastIpcNea?.var_interanual)}
                  </div>
                  <div className={styles.metricLabel}>Interanual</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {formatPct(lastIpcNea?.var_mensual)}
                  </div>
                  <div className={styles.metricLabel}>Mensual</div>
                </div>
                <Link href="/dashboard/ipc" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              {/* 3. CBA NEA */}
              <div className={styles.indicatorRow}>
                <MapLogo type="nea" />
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    ${lastCbtCba?.cba_nea !== undefined ? Math.round(Number(lastCbtCba.cba_nea)).toLocaleString('es-AR') : '-'}
                  </div>
                  <div className={styles.metricLabel}>CBA NEA</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastCbtCba?.cba_ia !== undefined && lastCbtCba?.cba_ia !== null
                      ? `${Number(lastCbtCba.cba_ia).toFixed(1).replace('.', ',')}%`
                      : '-'}
                  </div>
                  <div className={styles.metricLabel}>Interanual</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastCbtCba?.cba_men !== undefined && lastCbtCba?.cba_men !== null
                      ? `${Number(lastCbtCba.cba_men).toFixed(1).replace('.', ',')}%`
                      : '-'}
                  </div>
                  <div className={styles.metricLabel}>CBA m.m.</div>
                </div>
                <Link href="/dashboard/indicadores_pais" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              {/* 4. CBT NEA */}
              <div className={styles.indicatorRow}>
                <MapLogo type="nea" />
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    ${lastCbtCba?.cbt_nea !== undefined ? Math.round(Number(lastCbtCba.cbt_nea)).toLocaleString('es-AR') : '-'}
                  </div>
                  <div className={styles.metricLabel}>CBT NEA</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastCbtCba?.cbt_ia !== undefined && lastCbtCba?.cbt_ia !== null
                      ? `${Number(lastCbtCba.cbt_ia).toFixed(1).replace('.', ',')}%`
                      : '-'}
                  </div>
                  <div className={styles.metricLabel}>Interanual</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastCbtCba?.cbt_men !== undefined && lastCbtCba?.cbt_men !== null
                      ? `${Number(lastCbtCba.cbt_men).toFixed(1).replace('.', ',')}%`
                      : '-'}
                  </div>
                  <div className={styles.metricLabel}>CBT m.m.</div>
                </div>
                <Link href="/dashboard/indicadores_pais" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD 2: EMPLEO PRIVADO Y REGISTRADO */}
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
                <MapLogo type="pais" />
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {formatSipaNacion(lastSipaNac?.puestos)}
                  </div>
                  <div className={styles.metricLabel}>Puestos Privados (SIPA)</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastSipaNac?.var_interanual ? `${Number(lastSipaNac.var_interanual).toFixed(1)}%` : '-'}
                  </div>
                  <div className={styles.metricLabel}>Interanual</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastSipaNac?.var_mensual ? `${Number(lastSipaNac.var_mensual).toFixed(1)}%` : '-'}
                  </div>
                  <div className={styles.metricLabel}>Mensual (s/e)</div>
                </div>
                <Link href="/dashboard/empleo_nacional" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              {/* 2. SIPA Corrientes */}
              <div className={styles.indicatorRow}>
                <MapLogo type="corrientes" />
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {formatSipaCtes(lastSipaCtes?.puestos)}
                  </div>
                  <div className={styles.metricLabel}>Puestos Privados (SIPA)</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastSipaCtes?.var_interanual ? `${Number(lastSipaCtes.var_interanual).toFixed(1)}%` : '-'}
                  </div>
                  <div className={styles.metricLabel}>Interanual</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastSipaCtes?.var_mensual ? `${Number(lastSipaCtes.var_mensual).toFixed(1)}%` : '-'}
                  </div>
                  <div className={styles.metricLabel}>Mensual (s/e)</div>
                </div>
                <Link href="/dashboard/empleo_nacional" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              {/* 3. SRT Nación */}
              <div className={styles.indicatorRow}>
                <MapLogo type="pais" />
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastSrtNac?.trabajadores ? `${(Number(lastSrtNac.trabajadores) / 1000000).toFixed(1)} mill.` : '-'}
                  </div>
                  <div className={styles.metricLabel}>Trabajadores SRT</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    ${lastSrtNac?.salario_promedio ? Math.round(Number(lastSrtNac.salario_promedio)).toLocaleString('es-AR') : '-'}
                  </div>
                  <div className={styles.metricLabel}>Salario Promedio</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>Nacional</div>
                  <div className={styles.metricLabel}>Cobertura</div>
                </div>
                <Link href="/dashboard/empleo_provincial" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              {/* 4. SRT Corrientes */}
              <div className={styles.indicatorRow}>
                <MapLogo type="corrientes" />
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastSrtCtes?.trabajadores ? `${(Number(lastSrtCtes.trabajadores) / 1000).toFixed(1)} mil` : '-'}
                  </div>
                  <div className={styles.metricLabel}>Trabajadores SRT</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    ${lastSrtCtes?.salario_promedio ? Math.round(Number(lastSrtCtes.salario_promedio)).toLocaleString('es-AR') : '-'}
                  </div>
                  <div className={styles.metricLabel}>Salario Promedio</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>Corrientes</div>
                  <div className={styles.metricLabel}>Cobertura</div>
                </div>
                <Link href="/dashboard/empleo_provincial" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD 3: SALARIOS E INGRESOS (RIPTE, SMVM, ÍNDICE SALARIO, IERIC CORRIENTES) */}
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
              {/* 1. RIPTE Remuneración */}
              <div className={styles.indicatorRow}>
                <MapLogo type="pais" />
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    ${lastRipte?.valor ? Math.round(Number(lastRipte.valor)).toLocaleString('es-AR') : '-'}
                  </div>
                  <div className={styles.metricLabel}>Remuneración RIPTE</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {formatPct(lastRipte?.var_interanual)}
                  </div>
                  <div className={styles.metricLabel}>Interanual</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {formatPct(lastRipte?.var_mensual)}
                  </div>
                  <div className={styles.metricLabel}>Mensual</div>
                </div>
                <Link href="/dashboard/indicadores_pais" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              {/* 2. Salario Mínimo Vital y Móvil */}
              <div className={styles.indicatorRow}>
                <MapLogo type="pais" />
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    ${lastSmvm?.valor ? Math.round(Number(lastSmvm.valor)).toLocaleString('es-AR') : '-'}
                  </div>
                  <div className={styles.metricLabel}>Monto SMVM</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {formatPct(lastSmvm?.var_interanual)}
                  </div>
                  <div className={styles.metricLabel}>Interanual</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {formatPct(lastSmvm?.var_mensual)}
                  </div>
                  <div className={styles.metricLabel}>Mensual</div>
                </div>
                <Link href="/dashboard/indicadores_pais" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              {/* 3. Índice de Salarios INDEC */}
              <div className={styles.indicatorRow}>
                <MapLogo type="pais" />
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastIndiceSal?.valor ? Number(lastIndiceSal.valor).toFixed(1).replace('.', ',') : '-'}
                  </div>
                  <div className={styles.metricLabel}>Índice Salarios INDEC</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {formatPct(lastIndiceSal?.var_interanual)}
                  </div>
                  <div className={styles.metricLabel}>Interanual</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {formatPct(lastIndiceSal?.var_mensual)}
                  </div>
                  <div className={styles.metricLabel}>Mensual</div>
                </div>
                <Link href="/dashboard/indicadores_pais" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              {/* 4. Salario Promedio Construcción (Corrientes) */}
              <div className={styles.indicatorRow}>
                <MapLogo type="corrientes" />
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    ${lastIericSal?.valor ? Math.round(Number(lastIericSal.valor)).toLocaleString('es-AR') : '-'}
                  </div>
                  <div className={styles.metricLabel}>Salario Construcción</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {formatPct(lastIericSal?.var_interanual)}
                  </div>
                  <div className={styles.metricLabel}>Interanual</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {formatPct(lastIericSal?.var_mensual)}
                  </div>
                  <div className={styles.metricLabel}>Mensual</div>
                </div>
                <Link href="/dashboard/construccion" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD 4: INDUSTRIA Y CONSTRUCCIÓN */}
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
                <MapLogo type="pais" />
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>IPI Manufacturero</div>
                  <div className={styles.metricLabel}>Nacional</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={`${styles.metricVal} ${Number(lastIpi?.var_interanual || 0) < 0 ? 'text-rose-600' : ''}`}>
                    {lastIpi?.var_interanual ? `${Number(lastIpi.var_interanual).toFixed(1)}%` : '-'}
                  </div>
                  <div className={styles.metricLabel}>Interanual</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastIpi?.var_mensual ? `${Number(lastIpi.var_mensual).toFixed(1)}%` : '-'}
                  </div>
                  <div className={styles.metricLabel}>Mensual</div>
                </div>
                <Link href="/dashboard/industria" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              {/* 2. IPICorr (Corrientes) */}
              <div className={styles.indicatorRow}>
                <MapLogo type="corrientes" />
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>IPICorr</div>
                  <div className={styles.metricLabel}>Corrientes</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={`${styles.metricVal} ${Number(lastIpicorr?.var_interanual || 0) < 0 ? 'text-rose-600' : ''}`}>
                    {lastIpicorr?.var_interanual ? `${Number(lastIpicorr.var_interanual).toFixed(1)}%` : '-'}
                  </div>
                  <div className={styles.metricLabel}>Interanual</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastIpicorr?.var_mensual ? `${Number(lastIpicorr.var_mensual).toFixed(1)}%` : '-'}
                  </div>
                  <div className={styles.metricLabel}>Mensual</div>
                </div>
                <Link href="/dashboard/industria" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              {/* 3. IERIC Construcción NEA */}
              <div className={styles.indicatorRow}>
                <MapLogo type="nea" />
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastIericNea?.puestos ? Number(lastIericNea.puestos).toLocaleString('es-AR') : '-'}
                  </div>
                  <div className={styles.metricLabel}>Puestos Construcción</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={`${styles.metricVal} ${Number(lastIericNea?.puestos_ia || 0) < 0 ? 'text-rose-600' : ''}`}>
                    {lastIericNea?.puestos_ia ? `${Number(lastIericNea.puestos_ia).toFixed(1)}%` : '-'}
                  </div>
                  <div className={styles.metricLabel}>Interanual</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastIericNea?.empresas ? Number(lastIericNea.empresas).toLocaleString('es-AR') : '-'}
                  </div>
                  <div className={styles.metricLabel}>Empresas Activas</div>
                </div>
                <Link href="/dashboard/construccion" className={styles.arrowLink}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              {/* 4. IERIC Construcción Corrientes */}
              <div className={styles.indicatorRow}>
                <MapLogo type="corrientes" />
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastIericCtes?.puestos ? Number(lastIericCtes.puestos).toLocaleString('es-AR') : '-'}
                  </div>
                  <div className={styles.metricLabel}>Puestos Corrientes</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={`${styles.metricVal} ${Number(lastIericCtes?.puestos_ia || 0) < 0 ? 'text-rose-600' : ''}`}>
                    {lastIericCtes?.puestos_ia ? `${Number(lastIericCtes.puestos_ia).toFixed(1)}%` : '-'}
                  </div>
                  <div className={styles.metricLabel}>Interanual</div>
                </div>
                <div className={styles.metricCol}>
                  <div className={styles.metricVal}>
                    {lastIericCtes?.empresas ? Number(lastIericCtes.empresas).toLocaleString('es-AR') : '-'}
                  </div>
                  <div className={styles.metricLabel}>Empresas Activas</div>
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