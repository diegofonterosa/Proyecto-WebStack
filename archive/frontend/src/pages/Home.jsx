import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { productAPI } from '../api/client'
import { useProductStore } from '../store'
import '../styles/Home.css'

export default function Home() {
  const [productos, setProductos] = useState([])
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [categorias, setCategorias] = useState([])
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarProductos()
    cargarCategorias()
  }, [pagina, filtroCategoria])

  const cargarProductos = async () => {
    try {
      setCargando(true)
      const res = await productAPI.getProductos(pagina)
      setProductos(res.data.datos)
      setTotal(res.data.pagination.total)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setCargando(false)
    }
  }

  const cargarCategorias = async () => {
    try {
      const res = await productAPI.getCategorias()
      setCategorias(res.data.datos)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (cargando) return <div className="loading">Cargando...</div>

  return (
    <main className="home">
      <section className="hero">
        <h1>Bienvenido a Tienda Reactiva</h1>
        <p>Arquitectura moderna con microservicios</p>
      </section>

      <section className="filters">
        <select onChange={(e) => setFiltroCategoria(e.target.value)} value={filtroCategoria}>
          <option value="">Todas las categorías</option>
          {categorias.map((cat) => (
            <option key={cat.categoria} value={cat.categoria}>
              {cat.categoria}
            </option>
          ))}
        </select>
      </section>

      <section className="products">
        <div className="products-grid">
          {productos.map((prod) => (
            <div key={prod.id} className="product-card">
              <img src={prod.imagen_url} alt={prod.nombre} />
              <h3>{prod.nombre}</h3>
              <p className="precio">${prod.precio}</p>
              <p className="stock">Stock: {prod.stock}</p>
              <Link to={`/producto/${prod.id}`} className="btn-detail">
                Ver Detalles
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="pagination">
        {pagina > 1 && (
          <button onClick={() => setPagina(pagina - 1)}>← Anterior</button>
        )}
        <span>Página {pagina}</span>
        {products.length === 12 && (
          <button onClick={() => setPagina(pagina + 1)}>Siguiente →</button>
        )}
      </section>
    </main>
  )
}
