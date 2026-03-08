import React from 'react'
import '../styles/Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Sobre Nosotros</h3>
          <p>Tienda online con arquitectura de microservicios y frontend reactivo</p>
        </div>
        <div className="footer-section">
          <h3>Tecnología</h3>
          <ul>
            <li>React 18 + Vite</li>
            <li>Microservicios PHP</li>
            <li>API Gateway Node.js</li>
            <li>Docker Compose</li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Contacto</h3>
          <p>Email: info@tienda.local</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 Tienda Reactiva - Microservicios</p>
      </div>
    </footer>
  )
}
