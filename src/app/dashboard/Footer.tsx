import { withBasePath } from '../../lib/basePath';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-logos">
          <img 
            src={withBasePath("/images/LOGO-Negro (IMI+Gob+Gerencia)_1.png")} 
            alt="Instituto de Modernización e Innovación — Gerencia de Inteligencia Artificial y Ciencia de Datos"
            width={340}
            height={55}
            className="footer-logo-img"
            style={{ objectFit: 'contain' }}
          />
        </div>
        
        <p className="footer-text">
          © 2026 - Gobierno de la Provincia de Corrientes - IMI
        </p>
      </div>
    </footer>
  );
}