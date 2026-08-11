// src/app/Sidebar.tsx
'use client';

import Image from 'next/image';
import { BarChart3, Building, Users, Briefcase, Home } from 'lucide-react';

const menuItems = [
  {
    category: 'GENERAL',
    items: [
      { name: 'Resumen', icon: Home, href: '/dashboard', active: true },
      { name: 'Semáforo', icon: BarChart3, href: '#' },
    ],
  },
  {
    category: 'MACROECONOMÍA',
    items: [
      { name: 'Precios', icon: BarChart3, href: '#' },
      { name: 'Actividad Económica', icon: Building, href: '#' },
      { name: 'Empleo', icon: Users, href: '#' },
      { name: 'Salarios', icon: Briefcase, href: '#' },
    ],
  },
  {
    category: 'SECTOR PRODUCTIVO',
    items: [
      { name: 'Industria', icon: Building, href: '#' },
      { name: 'Construcción', icon: Building, href: '#' },
      // ... agregar más items aquí
    ],
  },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        {/* Logo IMI Pluma Blanca centrado arriba (resalta en fondo oscuro) */}
        <div className="sidebar-logo-container">
          <Image 
            src="/images/logo_pluma_blanca.png" 
            alt="Logo IMI Indicadores Económicos"
            width={120} // Ajustá el ancho visual (más grande que los placeholders)
            height={60} // Ajustá el alto proporcional
            className="sidebar-logo-img"
          />
        </div>

        {/* Títulos alineados centralmente como en la referencia */}
        <div className="sidebar-title-group">
          <h2 className="sidebar-title">Indicadores Económicos</h2>
          <p className="sidebar-subtitle">IMI • Provincia de Corrientes</p>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((group) => (
          <div key={group.category} className="nav-group">
            <h3 className="nav-group-title">{group.category}</h3>
            {group.items.map((item) => (
              <a key={item.name} href={item.href} className={`nav-item ${item.active ? 'active' : ''}`}>
                <item.icon className="nav-item-icon" />
                <span>{item.name}</span>
              </a>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}