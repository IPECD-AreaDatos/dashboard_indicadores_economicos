import Sidebar from '@/components/Sidebar'

export default function IndicadoresPage() {
  return (
    <div className="main-shell">
      <Sidebar />
      <main className="main-content">
        <div className="top-bar">
          <div>
            <h1>Indicadores</h1>
            <p className="subtitle">Comparativo de RIPTE, SMVM, CBT y CBA.</p>
          </div>
        </div>
        <section className="page-card">
          <h2>Indicadores</h2>
          <p>Aquí se mostrarán gráficos y métricas de los principales indicadores.</p>
        </section>
      </main>
    </div>
  )
}
