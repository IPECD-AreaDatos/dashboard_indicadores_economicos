import Sidebar from '@/components/Sidebar'

export default function EmpleoPage() {
  return (
    <div className="main-shell">
      <Sidebar />
      <main className="main-content">
        <div className="top-bar">
          <div>
            <h1>Empleo</h1>
            <p className="subtitle">Indicadores de empleo privado, SRT/SIPA y evolución.</p>
          </div>
        </div>
        <section className="page-card">
          <h2>Empleo</h2>
          <p>Aquí se mostrará la información de empleo conectada a la base de datos.</p>
        </section>
      </main>
    </div>
  )
}
