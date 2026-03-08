import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore, useAuthStore } from '../store'
import { cartAPI } from '../api/client'
import '../styles/Carrito.css'

export default function Carrito() {
  const { items, total, actualizarCantidad, eliminarProducto, vaciarCarrito } = useCartStore()
  const { usuario } = useAuthStore()
  const [procesando, setProcesando] = useState(false)
  const navigate = useNavigate()

  if (!usuario) {
    return (
      <main className="carrito">
        <div className="mensaje">
          <p>Debes <a href="/login">iniciar sesión</a> para comprar</p>
        </div>
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="carrito">
        <div className="carrito-vacio">
          <p>Tu carrito está vacío</p>
          <a href="/" className="btn-volver">Continuar comprando</a>
        </div>
      </main>
    )
  }

  const handleCheckout = async () => {
    setProcesando(true)
    try {
      const res = await cartAPI.crearPedido()
      alert(`Pedido creado: ${res.data.pedido_id}`)
      vaciarCarrito()
      navigate('/')
    } catch (error) {
      alert('Error al procesar el pago')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <main className="carrito">
      <h1>🛒 Carrito de Compras</h1>

      <div className="carrito-container">
        <div className="items">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio</th>
                <th>Cantidad</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.producto_id}>
                  <td>{item.nombre}</td>
                  <td>${item.precio}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) =>
                        actualizarCantidad(item.producto_id, parseInt(e.target.value))
                      }
                    />
                  </td>
                  <td>${(item.precio * item.cantidad).toFixed(2)}</td>
                  <td>
                    <button
                      onClick={() => eliminarProducto(item.producto_id)}
                      className="btn-remove"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="resumen">
          <h2>Resumen</h2>
          <div className="total">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={procesando}
            className="btn-checkout"
          >
            {procesando ? 'Procesando...' : '💳 Completar Compra'}
          </button>
          <button onClick={vaciarCarrito} className="btn-vaciar">
            Vaciar carrito
          </button>
        </div>
      </div>
    </main>
  )
}
