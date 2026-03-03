<?php $titulo = 'Iniciar Sesión'; ?>

    <section class="auth-section">
        <div class="auth-container">
            <div class="auth-form">
                <h1>Iniciar Sesión</h1>

                <form action="/login" method="POST" class="form">
                    <div class="form-group">
                        <label for="email">Email:</label>
                        <input type="email" id="email" name="email" required>
                    </div>

                    <div class="form-group">
                        <label for="contraseña">Contraseña:</label>
                        <input type="password" id="contraseña" name="contraseña" required>
                    </div>

                    <button type="submit" class="btn btn-primary btn-large">
                        Iniciar Sesión
                    </button>
                </form>

                <p class="form-footer">
                    ¿No tienes cuenta? <a href="/registro">Regístrate aquí</a>
                </p>

                <!-- DEMOSTRACIÓN -->
                <div class="demo-box">
                    <h3>Cuentas de Prueba</h3>
                    <p><strong>Admin:</strong><br>
                    Email: admin@tienda.local<br>
                    Contraseña: Tienda123456</p>
                    
                    <p><strong>Usuario:</strong><br>
                    Email: demo@tienda.local<br>
                    Contraseña: Tienda123456</p>
                </div>
            </div>

            <div class="auth-info">
                <h2>Seguridad Garantizada</h2>
                <ul>
                    <li>✓ Contraseñas encriptadas con bcrypt</li>
                    <li>✓ Conexión HTTPS segura</li>
                    <li>✓ Sesiones seguras</li>
                    <li>✓ Validación de CSRF</li>
                    <li>✓ Protección contra XSS</li>
                    <li>✓ Auditoría de intentos de login</li>
                </ul>
            </div>
        </div>
    </section>

