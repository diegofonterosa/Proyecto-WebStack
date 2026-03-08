# 📖 Guía Rápida: Usar Strapi en el Proyecto

## 🎯 ¿Qué es Strapi en este proyecto?

Strapi es un **CMS Headless** que:
- Permite gestionar contenido (banners, páginas, testimonios, etc.)
- Expone el contenido vía API REST
- Tiene un panel admin intuitivo (http://localhost:1337/admin)
- Se integra con el frontend React

## ⚡ Inicio Rápido (5 minutos)

### 1. Iniciar Strapi

```bash
cd /workspaces/Proyecto-WebStack

# Si usas Docker Compose (recomendado)
docker-compose up strapi-cms -d
docker-compose logs -f strapi-cms

# Esperar ~30 segundos hasta que diga "Ready"
```

### 2. Acceder al Panel Admin

```
http://localhost:1337/admin
```

### 3. Crear Usuario Administrador

En la primera carga te pedirá:
- Email
- Password
- Nombre

### 4. Crear un Content Type

1. En el sidebar: **Content-Type Builder**
2. Click **Create new collection type**
3. Nombre: `banner`
4. Agregar campos:
   - `titulo` (Text, required)
   - `descripcion` (Text)
   - `imagen` (Image)
   - `enlace` (Text)
   - `activo` (Boolean, default true)
5. Click **Finish**
6. Click **Save**
7. Esperar a que se reinicie

### 5. Crear Contenido

1. En sidebar: **Banner** (el type que creaste)
2. Click **Create new entry**
3. Rellenar campos
4. Click **Publish** (importante, si no, no aparece en API)

### 6. Acceder desde API

```bash
# Obtener todos los banners
curl http://localhost:1337/api/banners?populate=*

# Respuesta:
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "titulo": "Bienvenido",
        "descripcion": "A nuestra tienda",
        "enlace": "/productos",
        "activo": true,
        "imagen": {
          "data": [
            {
              "attributes": {
                "url": "/uploads/imagen.jpg"
              }
            }
          ]
        }
      }
    }
  ]
}
```

---

## 📚 Tipos de Contenido Recomendados

### 1. Banner (Hero Section)
```
├─ Título (Text)
├─ Descripción (Text)
├─ Imagen (Image)
├─ Enlace (Text)
└─ Activo (Boolean)
```

### 2. Testimonial (Reviews)
```
├─ Autor (Text)
├─ Contenido (Text)
├─ Puntuación (Integer 1-5)
├─ Avatar (Image)
└─ Fecha (DateTime)
```

### 3. Página
```
├─ Título (Text)
├─ Slug (Text, unique)
├─ Contenido (Rich Text)
├─ Meta Descripción (Text)
└─ Publicado (Boolean)
```

### 4. FAQ
```
├─ Pregunta (Text)
├─ Respuesta (Rich Text)
└─ Orden (Integer)
```

---

## 🔗 Integración con Frontend

### Instalar cliente HTTP:

Frontend ya tiene Axios, agregar cliente Strapi:

**frontend/src/api/strapi.js:**
```javascript
import axios from 'axios'

const STRAPI_URL = import.meta.env.VITE_CMS_URL || 'http://localhost:1337'

export const strapi = axios.create({
  baseURL: `${STRAPI_URL}/api`,
})

export const getBanners = () => strapi.get('/banners?populate=*')
export const getTestimonials = () => strapi.get('/testimonials?populate=*&sort=fecha:desc')
export const getPageBySlug = (slug) => 
  strapi.get(`/paginas?filters[slug][$eq]=${slug}&populate=*`)
```

### Usar en componente:

**frontend/src/components/Banner.jsx:**
```jsx
import { useEffect, useState } from 'react'
import { getBanners } from '../api/strapi'

export default function Banner() {
  const [banner, setBanner] = useState(null)

  useEffect(() => {
    getBanners()
      .then(res => {
        if (res.data.data.length > 0) {
          setBanner(res.data.data[0])
        }
      })
      .catch(err => console.error('Error:', err))
  }, [])

  if (!banner) return null

  const { titulo, descripcion, enlace } = banner.attributes
  const imageUrl = banner.attributes.imagen?.data?.[0]?.attributes?.url
    ? `http://localhost:1337${banner.attributes.imagen.data[0].attributes.url}`
    : '/placeholder.jpg'

  return (
    <section className="hero">
      <img src={imageUrl} alt={titulo} />
      <div className="hero-content">
        <h1>{titulo}</h1>
        <p>{descripcion}</p>
        {enlace && <a href={enlace} className="btn">Ver más</a>}
      </div>
    </section>
  )
}
```

---

## 🔐 Seguridad y Permisos

### Permitir acceso público a ciertos tipos

**En Admin → Settings → Roles & Permissions:**

1. Click en **Public**
2. Expandir `Banners` → Marcar:
   - ✓ find
   - ✓ findone
3. Expandir `Testimonials` → Marcar:
   - ✓ find

Esto permite GET requests sin autenticación.

### Para contenido privado

Usar JWT tokens:

```bash
# Login para obtener token
curl -X POST http://localhost:1337/api/auth/local \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin@example.com",
    "password": "password123"
  }'

# Usar token en siguiente request
TOKEN="eyJ..."
curl http://localhost:1337/api/contenido-privado \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📤 Subir Imágenes

### En el panel admin:

1. Crear/editar entrada
2. Ir a campo de imagen
3. Click en ícono de imagen
4. Seleccionar archivo o drag & drop
5. Click **Upload** o esperar

### Acceso desde API:

```javascript
const { imagen } = banner.attributes
const imageUrl = imagen?.data?.[0]?.attributes?.url
// Completa: http://localhost:1337/uploads/...
```

---

## 🔄 Relaciones entre Content Types

### Crear relación: Autor → Testimonials

1. En Banner, crear field:
   - Nombre: `autor`
   - Tipo: **Relation**
   - Destino: Testimonials (one-to-many)

2. En API:
```bash
curl "http://localhost:1337/api/banners?populate=autor"
```

---

## 🧪 Testing de API

### Herramientas recomendadas:

**Postman:**
```bash
GET http://localhost:1337/api/banners?populate=*
Headers:
  Content-Type: application/json
```

**Thunder Client (VS Code):**
```
GET http://localhost:1337/api/banners?populate=*
```

**curl:**
```bash
curl -s http://localhost:1337/api/banners?populate=* | jq
```

---

## 🐛 Problemas Comunes

### "Cannot GET /api/..."

- [ ] ¿Estás usando el path correcto? (ej: `/banners` no `banner`)
- [ ] ¿El content type está publicado?
- [ ] ¿Necesita token? (ver permisos)

### "Imágenes devuelven null"

```javascript
// Agregar populate=* a las queries
strapi.get('/banners?populate=*')  // ✓ Correcto
strapi.get('/banners')              // ✗ Sin imágenes
```

### "datos.data undefined"

La estructura de Strapi es:
```javascript
{
  data: [
    { id: 1, attributes: { ... } }
  ],
  meta: { ... }
}
```

Acceso correcto:
```javascript
res.data.data.map(item => item.attributes)
```

### Puerto 1337 ya en uso

```bash
lsof -i :1337
kill -9 <PID>

# O cambiar puerto en .env
PORT=1338 npm run dev
```

---

## 📊 Estructura de Respuesta de API

```javascript
// GET /api/banners?populate=*
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "titulo": "Bienvenido",
        "descripcion": "A nuestra tienda",
        "enlace": "/productos",
        "activo": true,
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z",
        "publishedAt": "2024-01-15T10:00:00.000Z",
        "imagen": {
          "data": [
            {
              "id": 1,
              "attributes": {
                "name": "banner.jpg",
                "url": "/uploads/banner_abc123.jpg",
                "width": 1200,
                "height": 600
              }
            }
          ]
        }
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 1
    }
  }
}
```

---

## 💾 Exportar/Importar Datos

### Exportar a JSON:

```bash
# Desde admin o vía GraphQL
curl "http://localhost:1337/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ banners { data { id attributes { titulo } } } }"}'
```

### Importar datos:

Usar script custom o plugin de Strapi.

---

## 🚀 Próximas Mejoras

- [ ] Agregar más content types
- [ ] Crear relaciones entre types
- [ ] Usar GraphQL en lugar de REST
- [ ] Implementar webhooks
- [ ] Configurar roles personalizados
- [ ] Integrar AWS S3 para imágenes
- [ ] Configurar CI/CD

---

## 📚 Recursos

- **Docs:** https://docs.strapi.io
- **API Reference:** https://docs.strapi.io/developer-docs/latest/developer-resources/database-apis-reference/rest-api.html
- **Marketplace:** https://market.strapi.io
- **Community:** https://forum.strapi.io

---

## ✅ Próximos Pasos

1. **Iniciar Strapi:** `docker-compose up strapi-cms`
2. **Ir a admin:** http://localhost:1337/admin
3. **Crear usuario:** Completar formulario
4. **Crear primer type:** Banner
5. **Crear contenido:** Agregar un banner
6. **Integrar en frontend:** Usar ejemplo arriba
7. **Publicar:** En producción

---

**¡Con Strapi tienes un CMS profesional sin necesidad de escribir código!** 🎉
