// src/app/Footer.tsx
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-logos">
          {/* Logo IMI a Color con texto negro, ideal para fondo claro */}
          <Image 
            src="/images/logo_color.png" 
            alt="Instituto de Modernización e Innovación CORRIENTES"
            width={280} // Ajustá este ancho visual según cómo se vea (es horizontal largo)
            height={70} // Ajustá el alto proporcionalmente
            className="footer-logo-img"
          />
        </div>
        
        {/* Texto institucional centralizado */}
        <p className="footer-text">
          © 2026 - Gobierno de la Provincia de Corrientes — Instituto Provincial de Estadística y Ciencia de Datos / IMI
        </p>
      </div>
    </footer>
  );
}