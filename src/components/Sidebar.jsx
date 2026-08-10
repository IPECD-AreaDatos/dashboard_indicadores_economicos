import { MapPin, BarChart3, TrendingUp, Briefcase, SlidersHorizontal } from 'lucide-react'

const icons = {
  resumen: MapPin,
  ipc: BarChart3,
  empleo: Briefcase,
  indicadores: TrendingUp,
  ipi: SlidersHorizontal,
}

function Sidebar({ pages, activePage, onChangePage }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="logo">IMI</div>
        <span>Indicadores</span>
      </div>
      <nav className="sidebar-nav">
        {pages.map((page) => {
          const Icon = icons[page.key]
          return (
            <button
              key={page.key}
              className={page.key === activePage ? 'sidebar-link active' : 'sidebar-link'}
              onClick={() => onChangePage(page.key)}
              type="button"
            >
              {Icon && <Icon size={18} />}
              <span>{page.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar
