<?php $titulo = 'Crear Cuenta'; ?>

    <section class="auth-section">
        <div class="auth-container">
            <div class="auth-form">
                <h1>Crear Cuenta</h1>

                <form action="/registro" method="POST" class="form">
                    <div class="form-group">
                        <label for="nombre">Nombre Completo:</label>
                        <input type="text" id="nombre" name="nombre" required>
                    </div>

                    <div class="form-group">
                        <label for="email">Email:</label>
                        <input type="email" id="email" name="email" required>
                    </div>

                    <div class="form-group">
                        <label for="contraseña">Contraseña:</label>
                        <input type="password" id="contraseña" name="contraseña" required>
                        <small>Mínimo 8 caracteres, 1 mayúscula, 1 número</small>
                    </div>

                    <div class="form-group">
                        <label for="contraseña2">Repetir Contraseña:</label>
                        <input type="password" id="contraseña2" name="contraseña2" required>
                    </div>

                    <button type="submit" class="btn btn-primary btn-large">
                        Crear Cuenta
                    </button>
                </form>

                <p class="form-footer">
                    ¿Ya tienes cuenta? <a href="/login">Inicia sesión aquí</a>
                </p>
            </div>

            <div class="auth-info">
                <h2>Requisitos de Seguridad de Contraseña</h2>
                <div class="requirements">
                    <div class="requirement">
                        <span class="icon">📏</span>
                        <p><strong>Longitud mínima:</strong> 8 caracteres</p>
                    </div>
                    <div class="requirement">
                        <span class="icon">🔤</span>
                        <p><strong>Mayúscula:</strong> Al menos 1 letra mayúscula</p>
                    </div>
                    <div class="requirement">
                        <span class="icon">🔢</span>
                        <p><strong>Número:</strong> Al menos 1 dígito</p>
                    </div>
                </div>

                <div class="feature-list">
                    <h3>Tu Seguridad es Importante</h3>
                    <ul>
                        <li>✓ Encriptación bcrypt (costo 12)</li>
                        <li>✓ Validación en servidor</li>
                        <li>✓ Sin almacenar contraseñas en texto plano</li>
                        <li>✓ HTTPS obligatorio</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

