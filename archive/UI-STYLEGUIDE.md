# UI Styleguide - Proyecto WebStack

## Objetivo visual
Interfaz e-commerce con personalidad, energia y legibilidad alta.
Estilo inspirado en marcas food/sport de tono atrevido, sin copiar layouts externos.

## Principios
- Jerarquia fuerte: titulares display, contenido claro, CTA visibles.
- Contraste alto: texto legible y botones claramente distinguibles.
- Ritmo visual: cards con profundidad, microinteracciones utiles y estados vacios claros.
- Consistencia: misma paleta, mismos radios y sombras en todo el sitio.

## Tipografia
- Display: Bebas Neue
- Texto base: Manrope
- Regla:
  - Titulares de seccion: display
  - Texto de formulario, tablas y descripciones: Manrope

## Paleta base (tokens activos)
- Primario: #ff5a2f
- Primario hover: #dc451d
- Fondo base: #fffaf4
- Superficie: #ffffff
- Texto principal: #1b1b1b
- Texto secundario: #6b6b6b
- Borde suave: #ffd9c9
- Exito: #10b981
- Error: #e11d48
- Focus ring: #0ea5e9

## Componentes clave
- Navbar:
  - Fondo claro translcido, buscador redondeado, carrito con badge animado.
- Hero:
  - Gradiente calido, formas decorativas, titular display y doble CTA.
- Product card:
  - Sticker de categoria, sombra suave, hover con ligera elevacion.
- Auth cards:
  - Contenedor con borde y sombra, badge contextual y subtitulo.
- Cart summary:
  - Caja destacada con total visible y CTA principal.
- Footer:
  - Cuatro columnas, tags de beneficios y enlaces de comunidad.

## Motion y accesibilidad
- Usar animaciones cortas (200-500ms) con easing suave.
- Evitar motion excesivo en acciones frecuentes.
- Respetar prefers-reduced-motion.
- Focus visible obligatorio en links, botones y campos.

## Responsive
- Mobile first para controles tactiles.
- Evitar tablas rigidas en pantallas pequenas.
- CTA principales con ancho completo en movil cuando aplica.

## Checklist para nuevos cambios UI
- Mantiene tokens y tipografias?
- Cumple contraste minimo AA en texto y botones?
- Tiene estado hover/focus/disabled?
- Se ve bien en <=768px y <=480px?
- Evita copias directas de disenos de terceros?
