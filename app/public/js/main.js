// =============================================================================
// JAVASCRIPT - Funcionalidad de Tienda Online
// =============================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Actualizar carrito en tiempo real
    const cantidadInputs = document.querySelectorAll('.cantidad-input');
    cantidadInputs.forEach(input => {
        input.addEventListener('change', function() {
            const carritoId = this.dataset.carritoId;
            const cantidad = this.value;
            
            const form = document.getElementById('update-cart-form');
            const updateFields = document.getElementById('update-fields');
            
            // Limpiar campos previos
            updateFields.innerHTML = '';
            
            // Agregar campo para este producto
            const field = document.createElement('input');
            field.type = 'hidden';
            field.name = `cantidad_${carritoId}`;
            field.value = cantidad;
            updateFields.appendChild(field);
            
            // Enviar formulario
            form.submit();
        });
    });

    // Remover producto del carrito
    const removeButtons = document.querySelectorAll('.btn-remove');
    removeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirm('¿Estás seguro que deseas eliminar este producto?')) {
                // Aquí iría el AJAX para eliminar
                this.closest('tr').style.opacity = '0.5';
            }
        });
    });

    // Cerrar alertas
    const alertCloses = document.querySelectorAll('.alert-close');
    alertCloses.forEach(btn => {
        btn.addEventListener('click', function() {
            this.parentElement.style.display = 'none';
        });
    });

    // Auto-cerrar alertas después de 5 segundos
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.display = 'none';
        }, 5000);
    });
});

// =============================================================================
// UTILIDADES DE VALIDACIÓN
// =============================================================================

/**
 * Validar email
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validar contraseña fuerte
 */
function validatePassword(password) {
    // Mínimo 8 caracteres, 1 mayúscula, 1 número
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return re.test(password);
}

/**
 * Formatear precio
 */
function formatPrice(price) {
    return '$' + parseFloat(price).toFixed(2);
}

/**
 * Mostrar loading
 */
function showLoading() {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;
    overlay.innerHTML = '<div style="background: white; padding: 30px; border-radius: 8px;">Procesando...</div>';
    document.body.appendChild(overlay);
}

/**
 * Ocultar loading
 */
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// =============================================================================
// MANEJO DE FORMULARIOS
// =============================================================================

/**
 * Preparar formulario para envío
 */
function prepareForm(form) {
    form.addEventListener('submit', function(e) {
        // Validar que no esté vacío
        const inputs = this.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
        let valid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.style.borderColor = 'red';
                valid = false;
            } else {
                input.style.borderColor = '';
            }
        });

        if (!valid) {
            e.preventDefault();
            alert('Por favor completa todos los campos');
        }
    });
}

// =============================================================================
// API CALLS (AJAX)
// =============================================================================

/**
 * Agregar producto al carrito (AJAX)
 */
async function addToCartAjax(productoId, cantidad = 1) {
    try {
        showLoading();
        
        const formData = new FormData();
        formData.append('producto_id', productoId);
        formData.append('cantidad', cantidad);
        
        const response = await fetch('/carrito/agregar', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            hideLoading();
            showNotification('Producto agregado al carrito', 'success');
            updateCartCount();
        } else {
            hideLoading();
            showNotification('Error al agregar el producto', 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('Error:', error);
        showNotification('Error de conexión', 'error');
    }
}

/**
 * Mostrar notificación
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.innerHTML = `
        ${message}
        <button class="alert-close">×</button>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    notification.querySelector('.alert-close').addEventListener('click', function() {
        notification.remove();
    });
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

/**
 * Actualizar contador de carrito
 */
function updateCartCount() {
    // En una aplicación real, esto haría un AJAX call
    location.reload();
}

// =============================================================================
// UTILIDADES DE PRUEBA
// =============================================================================

console.log('Script de tienda cargado correctamente');
console.log('Tienda Online - Proyecto de Consultoría Técnica 2026');
