import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-logos">
          <Image 
            src="/images/logo_color.png" 
            alt="Instituto de Modernización e Innovación — Corrientes"
            width={240}
            height={55}
            priority
            className="footer-logo-img"
          />
        </div>
        
        <p className="footer-text">
          © 2026 - Gobierno de la Provincia de Corrientes - IMI
        </p>
      </div>
    </footer>
  );
}