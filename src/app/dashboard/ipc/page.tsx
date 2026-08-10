import Sidebar from '@/components/Sidebar'

export default function IPCPage() {
  return (
    <div className="main-shell">
      <Sidebar />
      <main className="main-content">
        <div className="top-bar">
          <div>
            <h1>IPC</h1>
            <p className="subtitle">Datos de inflación y variaciones por categoría.</p>
          </div>
        </div>
        <section className="page-card">
          <h2>IPC</h2>
          <p>Aquí se mostrará la información de IPC conectada a la base de datos.</p>
        </section>
      </main>
    </div>
  )
}
