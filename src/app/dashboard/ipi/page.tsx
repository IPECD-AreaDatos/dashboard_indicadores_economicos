import Sidebar from '@/components/Sidebar'

export default function IPIPage() {
  return (
    <div className="main-shell">
      <Sidebar />
      <main className="main-content">
        <div className="top-bar">
          <div>
            <h1>IPI / IERIC</h1>
            <p className="subtitle">Panel de industria y recursos IERIC.</p>
          </div>
        </div>
        <section className="page-card">
          <h2>IPI / IERIC</h2>
          <p>Aquí se mostrará la información de IPI y IERIC conectada a la base de datos.</p>
        </section>
      </main>
    </div>
  )
}
