import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore, useCartStore } from '../store'
import { authAPI } from '../api/client'
import '../styles/Navbar.css'

export default function Navbar() {
  const { usuario, logout } = useAuthStore()
  const { items } = useCartStore()
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')

  const handleBusqueda = (e) => {
    e.preventDefault()
    navigate('/?busqueda=' + busqueda)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          🛍️ Tienda Reactiva
        </Link>

        <form className="navbar-search" onSubmit={handleBusqueda}>
          <input
            type="text"
            placeholder="Buscar productos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button type="submit">Buscar</button>
        </form>

        <div className="navbar-links">
          <Link to="/">Inicio</Link>

          {usuario ? (
            <>
              <span className="user-name">👤 {usuario.nombre}</span>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/registro">Registro</Link>
            </>
          )}

          <Link to="/carrito" className="carrito-btn">
            🛒 Carrito ({items.length})
          </Link>
        </div>
      </div>
    </nav>
  )
}
