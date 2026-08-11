'use client'

import { useEffect, useState } from 'react'

type IpcTrendPoint = {
  fecha: string
  var_mensual: number
}

type CbaCbtRow = {
  fecha: string
  cba_hogar: number | null
  cbt_hogar: number | null
}

type SipaRow = {
  fecha: string
  cantidad_con_estacionalidad: number | null
  cantidad_sin_estacionalidad: number | null
}

type SummaryData = {
  ipc: {
    var_mensual: number
    var_acumulada: number
    var_interanual: number
  } | null
  ipcTrend: IpcTrendPoint[]
  cbaCbt: CbaCbtRow[]
  sipa: SipaRow[]
}

const priceOptions = ['IPC', 'CBA/CBT'] as const
const empleoOptions = ['SRT', 'SIPA'] as const
const salarioOptions = ['RIPTE', 'SMVM'] as const
const industriaOptions = ['IPI', 'IERIC'] as const

const emptySummary: SummaryData = {
  ipc: null,
  ipcTrend: [],
  cbaCbt: [],
  sipa: [],
}

const formatPercent = (value: number | null | undefined) =>
  value != null ? `${value.toFixed(1)} %` : '—'

const formatNumber = (value: number | null | undefined) =>
  value != null ? value.toLocaleString('es-AR') : '—'

export default function DashboardPage() {
  const [priceView, setPriceView] = useState<(typeof priceOptions)[number]>('IPC')
  const [empleoView, setEmpleoView] = useState<(typeof empleoOptions)[number]>('SRT')
  const [salarioView, setSalarioView] = useState<(typeof salarioOptions)[number]>('RIPTE')
  const [industriaView, setIndustriaView] = useState<(typeof industriaOptions)[number]>('IPI')
  const [summaryData, setSummaryData] = useState<SummaryData>(emptySummary)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const response = await fetch('/api/resumen')
        if (!response.ok) {
          throw new Error(`Error ${response.status}`)
        }
        const data = await response.json()
        setSummaryData(data)
      } catch (err) {
        setError('No se pudieron cargar los datos del resumen.')
      } finally {
        setLoading(false)
      }
    }

    loadSummary()
  }, [])

  const ipcLast = summaryData.ipc
  const ipcValues = summaryData.ipcTrend
  const latestCbaCbt = summaryData.cbaCbt[0] ?? null
  const latestSipa = summaryData.sipa[0] ?? null

  return (
    <>
      <div className="top-bar">
        <div>
          <h1>Principales Indicadores Económicos</h1>
          <p className="subtitle">Resumen del tablero migrado de Power BI.</p>
        </div>
      </div>

      {(loading || error) && (
        <div style={{ padding: '18px 0', color: '#475569' }}>{loading ? 'Cargando datos del resumen...' : error}</div>
      )}

      <div className="summary-grid">
        <section className="summary-card">
            <div className="summary-card-header">
              <div>
                <span className="summary-card-label">Precios</span>
                <strong>Último registro</strong>
              </div>
              <div className="pill-group">
                {priceOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={option === priceView ? 'pill active' : 'pill'}
                    onClick={() => setPriceView(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {priceView === 'IPC' ? (
              <>
                <div className="summary-row">
                  <div>
                    <div className="row-icon">1</div>
                    <div>
                      <div className="row-title">IPC general</div>
                      <div className="row-note">Último dato</div>
                    </div>
                  </div>
                  <div className="row-stats">
                    <div>
                      <strong>{formatPercent(ipcLast?.var_acumulada)}</strong>
                      <span>Acumulado</span>
                    </div>
                    <div>
                      <strong>{formatPercent(ipcLast?.var_interanual)}</strong>
                      <span>Interanual</span>
                    </div>
                    <div>
                      <strong>{formatPercent(ipcLast?.var_mensual)}</strong>
                      <span>Mensual</span>
                    </div>
                    <button className="icon-button">?</button>
                  </div>
                </div>
                {ipcValues.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <small>Últimos 12 meses</small>
                    <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'flex-end', minHeight: 120 }}>
                      {ipcValues.map((point) => {
                        const height = Math.max(12, Math.min(100, point.var_mensual + 45))
                        return (
                          <div key={point.fecha} style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ height: `${height}%`, background: '#0f172a', borderRadius: 9999, marginBottom: 6 }} />
                            <span style={{ fontSize: 10, color: '#64748b' }}>
                              {new Date(point.fecha).toLocaleDateString('es-AR', { month: 'short' })}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="summary-row">
                <div>
                  <div className="row-icon">1</div>
                  <div>
                    <div className="row-title">CBA / CBT Hogar</div>
                    <div className="row-note">Último valor</div>
                  </div>
                </div>
                <div className="row-stats">
                  <div>
                    <strong>{latestCbaCbt?.cba_hogar != null ? latestCbaCbt.cba_hogar.toFixed(1) : '—'}</strong>
                    <span>CBA Hogar</span>
                  </div>
                  <div>
                    <strong>{latestCbaCbt?.cbt_hogar != null ? latestCbaCbt.cbt_hogar.toFixed(1) : '—'}</strong>
                    <span>CBT Hogar</span>
                  </div>
                  <div>
                    <strong>{latestCbaCbt ? new Date(latestCbaCbt.fecha).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }) : '—'}</strong>
                    <span>Período</span>
                  </div>
                  <button className="icon-button">?</button>
                </div>
              </div>
            )}
          </section>

          <section className="summary-card">
            <div className="summary-card-header">
              <div>
                <span className="summary-card-label">Empleo privado</span>
                <strong>Último registro</strong>
              </div>
              <div className="pill-group">
                {empleoOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={option === empleoView ? 'pill active' : 'pill'}
                    onClick={() => setEmpleoView(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {empleoView === 'SIPA' ? (
              <div className="summary-row">
                <div>
                  <div className="row-icon">2</div>
                  <div>
                    <div className="row-title">SIPA empleo privado</div>
                    <div className="row-note">Último dato</div>
                  </div>
                </div>
                <div className="row-stats">
                  <div>
                    <strong>{formatNumber(latestSipa?.cantidad_con_estacionalidad)}</strong>
                    <span>Con estac.</span>
                  </div>
                  <div>
                    <strong>{formatNumber(latestSipa?.cantidad_sin_estacionalidad)}</strong>
                    <span>Sin estac.</span>
                  </div>
                  <div>
                    <strong>{latestSipa ? new Date(latestSipa.fecha).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }) : '—'}</strong>
                    <span>Período</span>
                  </div>
                  <button className="icon-button">?</button>
                </div>
              </div>
            ) : (
              <div className="summary-row">
                <div>
                  <div className="row-icon">2</div>
                  <div>
                    <div className="row-title">SRT</div>
                    <div className="row-note">Datos no disponibles</div>
                  </div>
                </div>
                <div className="row-stats">
                  <div>
                    <strong>—</strong>
                    <span>Con estac.</span>
                  </div>
                  <div>
                    <strong>—</strong>
                    <span>Sin estac.</span>
                  </div>
                  <div>
                    <strong>—</strong>
                    <span>Período</span>
                  </div>
                  <button className="icon-button">?</button>
                </div>
              </div>
            )}
          </section>

          <section className="summary-card">
            <div className="summary-card-header">
              <div>
                <span className="summary-card-label">Salarios</span>
                <strong>mar-26</strong>
              </div>
              <div className="pill-group">
                {salarioOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={option === salarioView ? 'pill active' : 'pill'}
                    onClick={() => setSalarioView(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="summary-row">
              <div>
                <div className="row-icon">3</div>
                <div>
                  <div className="row-title">{salarioView}</div>
                  <div className="row-note">Valor actual</div>
                </div>
              </div>
              <div className="row-stats">
                <div>
                  <strong>$1.775.664</strong>
                  <span>Valor</span>
                </div>
                <div>
                  <strong>30,2 %</strong>
                  <span>Interanual</span>
                </div>
                <div>
                  <strong>2,4 %</strong>
                  <span>Mensual</span>
                </div>
                <button className="icon-button">?</button>
              </div>
            </div>
          </section>

          <section className="summary-card">
            <div className="summary-card-header">
              <div>
                <span className="summary-card-label">Industria</span>
                <strong>may-26</strong>
              </div>
              <div className="pill-group">
                {industriaOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={option === industriaView ? 'pill active' : 'pill'}
                    onClick={() => setIndustriaView(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="summary-row">
              <div>
                <div className="row-icon">4</div>
                <div>
                  <div className="row-title">{industriaView}</div>
                  <div className="row-note">Interanual</div>
                </div>
              </div>
              <div className="row-stats">
                <div>
                  <strong>-5,7 %</strong>
                  <span>Interanual</span>
                </div>
                <div>
                  <strong>--</strong>
                  <span></span>
                </div>
                <button className="icon-button">?</button>
              </div>
            </div>
          </section>
      </div>
    </>
  )
}
