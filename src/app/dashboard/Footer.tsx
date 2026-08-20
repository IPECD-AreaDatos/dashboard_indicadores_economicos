import { withBasePath } from '../../lib/basePath';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-logos">
          <img 
            src={withBasePath("/images/logo_color.png")} 
            alt="Instituto de Modernización e Innovación — Corrientes"
            width={240}
            height={55}
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