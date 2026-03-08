import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import { authAPI } from '../api/client'
import '../styles/Auth.css'

export default function Registro() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [contraseña, setContraseña] = useState('')
  const [contraseña2, setContraseña2] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (contraseña !== contraseña2) {
      setError('Las contraseñas no coinciden')
      return
    }

    setCargando(true)
    
    try {
      const res = await authAPI.register(nombre, email, contraseña)
      login(res.data.usuario, res.data.token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1>Crear Cuenta</h1>
        
        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre Completo</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Repetir Contraseña</label>
            <input
              type="password"
              value={contraseña2}
              onChange={(e) => setContraseña2(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={cargando}>
            {cargando ? 'Cargando...' : 'Crear Cuenta'}
          </button>
        </form>

        <p>¿Ya tienes cuenta? <a href="/login">Inicia sesión aquí</a></p>
      </div>
    </div>
  )
}
