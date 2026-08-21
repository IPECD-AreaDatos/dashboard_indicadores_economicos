'use client';

import { withBasePath } from '../../../lib/basePath';
import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import styles from './Srt.module.css';

export default function EmpleoProvincialPage() {
  const [metric, setMetric] = useState<'trabajadores' | 'salario'>('trabajadores');
  const [selectedRegion, setSelectedRegion] = useState<string>('TODAS');
  const [selectedFecha, setSelectedFecha] = useState<string>('');
  
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSectores, setSelectedSectores] = useState<string[]>([]);
  
  const [rawData, setRawData] = useState<any[]>([]);
  const [sectoresList, setSectoresList] = useState<string[]>([]);
  const [regionesList, setRegionesList] = useState<any[]>([]);
  const [fechasList, setFechasList] = useState<string[]>([]);
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [kpis, setKpis] = useState({ totalTrabajadores: 0, salarioPromedio: 0 });
  const [loading, setLoading] = useState(true);

  // Carga inicial y al seleccionar otra fecha
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const url = selectedFecha
          ? withBasePath(`/api/empleo_provincial?fecha=${selectedFecha}`)
          : withBasePath('/api/empleo_provincial');
        const res = await fetch(url);
        const json = await res.json();

        if (json.datos) {
          setRawData(json.datos);
          if (sectoresList.length === 0) setSectoresList(json.sectores || []);
          if (regionesList.length === 0) setRegionesList(json.regiones || []);
          if (fechasList.length === 0) {
            setFechasList(json.fechasDisponibles || []);
            setSelectedFecha(json.fechaActiva || json.fechasDisponibles[0]);
          }
        }
      } catch (err) {
        console.error('Error cargando SRT:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedFecha]);

  // Agrupación y cálculo dinámico por provincia
  useEffect(() => {
    if (!rawData || rawData.length === 0) return;

    const filtered = rawData.filter((r) => {
      const matchRegion =
        selectedRegion === 'TODAS' ||
        r.nombre_region?.trim().toUpperCase() === selectedRegion.trim().toUpperCase();
      const matchSector = selectedSectores.length === 0 || selectedSectores.includes(r.sector);
      return matchRegion && matchSector;
    });

    const provGroup: {
      [key: string]: { provincia: string; trabajadores: number; totalMasa: number };
    } = {};

    filtered.forEach((r) => {
      const p = r.nombre_provincia || `Prov_${r.id_provincia}`;
      const trab = Number(r.trabajadores) || 0;
      const masa = Number(r.masa_salarial) || Number(r.salario_promedio) * trab || 0;

      if (!provGroup[p]) {
        provGroup[p] = { provincia: p, trabajadores: 0, totalMasa: 0 };
      }

      provGroup[p].trabajadores += trab;
      provGroup[p].totalMasa += masa;
    });

    const result = Object.values(provGroup).map((item) => ({
      provincia: item.provincia,
      trabajadores: item.trabajadores,
      salario: item.trabajadores > 0 ? Math.round(item.totalMasa / item.trabajadores) : 0,
    }));

    result.sort((a, b) => (metric === 'trabajadores' ? b.trabajadores - a.trabajadores : b.salario - a.salario));

    setChartData(result);

    const totalTrab = result.reduce((acc, curr) => acc + curr.trabajadores, 0);
    const totalMasaGeneral = Object.values(provGroup).reduce((acc, curr) => acc + curr.totalMasa, 0);
    const avgSalario = totalTrab > 0 ? Math.round(totalMasaGeneral / totalTrab) : 0;

    setKpis({
      totalTrabajadores: totalTrab,
      salarioPromedio: avgSalario,
    });
  }, [rawData, selectedRegion, selectedSectores, metric]);

  const toggleSector = (sector: string) => {
    setSelectedSectores((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
    );
  };

  const toggleSelectAll = () => {
    setSelectedSectores(selectedSectores.length === sectoresList.length ? [] : [...sectoresList]);
  };

  const formatFechaLabel = (fStr: string) => {
    if (!fStr) return '-';
    const parts = fStr.split('-');
    if (parts.length < 2) return fStr;
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${months[parseInt(parts[1], 10) - 1] || ''}-${parts[0].slice(-2)}`;
  };

  const filteredSectoresForList = sectoresList.filter((s) =>
    s.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>EMPLEO REGISTRADO (SRT)</h1>
          <p>SUPERINTENDENCIA DE RIESGOS DEL TRABAJO • TRABAJADORES Y REMUNERACIÓN</p>
        </div>

        <div className={styles.topFilters}>
          <select
            className={styles.selectFilter}
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            <option value="TODAS">Región: Todas</option>
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
            <div className={styles.badgeCategory}>Indicadores por Rama de Actividad</div>

            <div className={styles.metricSelectors}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="srtMetric"
                  checked={metric === 'trabajadores'}
                  onChange={() => setMetric('trabajadores')}
                />
                Cantidad de Trabajadores
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="srtMetric"
                  checked={metric === 'salario'}
                  onChange={() => setMetric('salario')}
                />
                Salario Promedio
              </label>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '100px', textAlign: 'center', color: '#64748b' }}>
              Cargando datos de SRT...
            </div>
          ) : (
            <div className={styles.chartCanvas}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    tickFormatter={(v) =>
                      metric === 'trabajadores'
                        ? v.toLocaleString('es-AR')
                        : `$${v.toLocaleString('es-AR')}`
                    }
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    dataKey="provincia"
                    type="category"
                    tick={{ fontSize: 11, fontWeight: 600, fill: '#1e293b' }}
                    width={95}
                  />
                  <Tooltip
                    cursor={false} /* ELIMINA EL FONDO GRIS AL PASAR EL MOUSE */
                    formatter={(val: number) =>
                      metric === 'trabajadores'
                        ? [`${val.toLocaleString('es-AR')} trabajadores`, 'Total']
                        : [`$${val.toLocaleString('es-AR')}`, 'Salario Promedio']
                    }
                  />
                  <Bar dataKey={metric} barSize={16} radius={[0, 6, 6, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.provincia.toLowerCase().includes('corrientes') ? '#84cc16' : '#1e293b'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <p className={styles.footerNote}>
            Fuente: Superintendencia de Riesgos del Trabajo de la Nación (SRT)
          </p>
        </div>

        <div className={styles.sidebarColumn}>
          <div className={styles.sectorsCard}>
            <div className={styles.sectorsHeader}>
              <div className={styles.badgeSectors}>Sectores</div>
              <button
                onClick={toggleSelectAll}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {selectedSectores.length === sectoresList.length ? 'Desmarcar todo' : 'Seleccionar todo'}
              </button>
            </div>

            <input
              type="text"
              placeholder="Buscar sector..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className={styles.sectorsList}>
              {filteredSectoresForList.map((sector) => (
                <label key={sector} className={styles.sectorItem}>
                  <input
                    type="checkbox"
                    checked={selectedSectores.includes(sector)}
                    onChange={() => toggleSector(sector)}
                  />
                  <span>{sector}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.kpisCard}>
            <div>
              <div className={styles.kpiBigVal}>
                {kpis.totalTrabajadores.toLocaleString('es-AR')}
              </div>
              <div className={styles.kpiLabel}>Trabajadores</div>
            </div>
            <div>
              <div className={styles.kpiBigVal} style={{ color: '#2563eb' }}>
                ${kpis.salarioPromedio.toLocaleString('es-AR')}
              </div>
              <div className={styles.kpiLabel}>Salario Promedio</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}