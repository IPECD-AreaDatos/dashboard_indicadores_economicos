'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrafficCone,
  TrendingUp,
  DollarSign,
  Users,
  Building,
  Factory,
  PieChart,
  Hammer,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    title: 'GENERAL',
    items: [
      { href: '/dashboard', label: 'Resumen Principal', icon: LayoutDashboard },
      { href: '/dashboard/semaforo', label: 'Semáforo de Indicadores', icon: TrafficCone },
    ],
  },
  {
    title: 'MACROECONOMÍA Y PRECIOS',
    items: [
      { href: '/dashboard/ipc', label: 'Precios (IPC)', icon: TrendingUp },
      { href: '/dashboard/indicadores_pais', label: 'Indicadores País', icon: DollarSign },
    ],
  },
  {
    title: 'EMPLEO Y SALARIOS',
    items: [
      { href: '/dashboard/empleo_nacional', label: 'Empleo Nacional (SIPA)', icon: Users },
      { href: '/dashboard/empleo_provincial', label: 'Empleo Provincial y NEA', icon: Building },
    ],
  },
  {
    title: 'SECTOR PRODUCTIVO Y ACTIVIDAD',
    items: [
      { href: '/dashboard/ipi', label: 'Industria y Actividad', icon: Factory },
      { href: '/dashboard/pbg', label: 'Producto Bruto (PBG)', icon: PieChart },
      { href: '/dashboard/construccion', label: 'Construcción (IERIC)', icon: Hammer },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Header Institucional con Escudo */}
      <div className="sidebar-header">
        <div className="sidebar-logo-container">
          <Image
            src="/images/logo_sidebar.png"
            alt="Instituto de Modernización e Innovación — Corrientes"
            width={180}
            height={50}
            priority
            className="sidebar-logo-img"
          />
        </div>
        <div className="sidebar-title-group">
          <h2 className="sidebar-title">Indicadores Económicos</h2>
          <p className="sidebar-subtitle">Provincia de Corrientes</p>
        </div>
      </div>

      {/* Navegación por Grupos */}
      <nav className="sidebar-nav">
        {navigationGroups.map((group) => (
          <div key={group.title} className="nav-group">
            <div className="nav-group-title">{group.title}</div>
            <div className="nav-group-items">
              {group.items.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    <div className="sidebar-link-content">
                      <Icon size={18} className="sidebar-link-icon" />
                      <span>{label}</span>
                    </div>
                    {isActive && <ChevronRight size={16} className="sidebar-link-arrow" />}
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