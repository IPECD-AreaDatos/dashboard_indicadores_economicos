import Link from 'next/link'
import { MapPin, BarChart3, TrendingUp, Briefcase, SlidersHorizontal } from 'lucide-react'

const pages = [
  { href: '/dashboard', label: 'Resumen', icon: MapPin },
  { href: '/dashboard/ipc', label: 'IPC', icon: BarChart3 },
  { href: '/dashboard/empleo', label: 'Empleo', icon: Briefcase },
  { href: '/dashboard/indicadores', label: 'Indicadores', icon: TrendingUp },
  { href: '/dashboard/ipi', label: 'IPI / IERIC', icon: SlidersHorizontal },
]

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="logo">IMI</div>
        <span>Indicadores</span>
      </div>
      <nav className="sidebar-nav">
        {pages.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="sidebar-link">
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
