import Sidebar from '@/components/Sidebar'

export default function DashboardPage() {
  return (
    <div className="main-shell">
      <Sidebar />
      <main className="main-content">
        <div className="top-bar">
          <div>
            <h1>Principales Indicadores Económicos</h1>
            <p className="subtitle">Resumen del tablero migrado de Power BI.</p>
          </div>
        </div>

        <section className="page-card">
          <h2>Resumen</h2>
          <p>Panel principal con los indicadores más importantes y accesos rápidos.</p>
        </section>
      </main>
    </div>
  )
}
