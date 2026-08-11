'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { // Corregido: LayoutDashboard no existe, se reemplaza por LayoutGrid
  LayoutGrid,
  TrendingUp,
  Briefcase,
  Users,
  DollarSign,
  Factory,
  Building2,
  PieChart,
  ChevronRightIcon,
  GaugeCircle, // Reemplazamos TrafficLight por GaugeCircle
} from 'lucide-react';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface MenuGroup {
  category: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    category: 'GENERAL',
    items: [
      { name: 'Resumen Principal', href: '/dashboard', icon: LayoutGrid },
      { name: 'Semáforo de Indicadores', href: '/dashboard/semaforo', icon: GaugeCircle },
    ],
  },
  {
    category: 'MACROECONOMÍA Y PRECIOS',
    items: [
      { name: 'Precios (IPC)', href: '/dashboard/ipc', icon: TrendingUp },
      { name: 'Indicadores País', href: '/dashboard/indicadores-pais', icon: DollarSign },
    ],
  },
  {
    category: 'EMPLEO Y SALARIOS',
    items: [
      { name: 'Empleo Nacional (SIPA)', href: '/dashboard/empleo-nacional', icon: Users },
      { name: 'Empleo Provincial y NEA', href: '/dashboard/empleo-provincial', icon: Briefcase },
    ],
  },
  {
    category: 'SECTOR PRODUCTIVO Y ACTIVIDAD',
    items: [
      { name: 'Industria y Actividad', href: '/dashboard/industria', icon: Factory },
      { name: 'Producto Bruto (PBG)', href: '/dashboard/pbg', icon: PieChart },
      { name: 'Construcción (IERIC)', href: '/dashboard/construccion', icon: Building2 },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Header del Sidebar */}
      <div className="sidebar-header">
        <div className="sidebar-logo-container">
          <Image
            src="/images/logo_pluma_blanca.png"
            alt="Logo IPECD Corrientes"
            width={200}
            height={60}
            priority
            className="sidebar-logo-img"
          />
        </div>
        <div className="sidebar-title-group">
          <h2 className="sidebar-title">Indicadores Económicos</h2>
          <p className="sidebar-subtitle">Provincia de Corrientes</p>
        </div>
      </div>

      {/* Navegación por Categorías */}
      <nav className="sidebar-nav">
        {menuGroups.map((group) => (
          <div key={group.category} className="nav-group">
            <h3 className="nav-group-title">{group.category}</h3>
            <div className="nav-group-items">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    <div className="sidebar-link-content">
                      <Icon className="sidebar-link-icon" />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRightIcon className="sidebar-link-arrow" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      
    </aside>
  );
}