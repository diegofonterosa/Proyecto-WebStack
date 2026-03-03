# 🎨 GUÍA STRAPI CMS - Integración y Deployment

## 📑 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Configuración Local](#configuración-local)
3. [Integración con Frontend](#integración-con-frontend)
4. [Deployment en Vercel](#deployment-en-vercel)
5. [API Reference](#api-reference)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Introducción

**Strapi** es un CMS Headless (sin interfaz predefinida) que permite:

- ✅ Gestionar contenido mediante una interfaz web intuitiva
- ✅ Exponer el contenido a través de APIs REST y GraphQL
- ✅ Crear tipos de contenido personalizados
- ✅ Gestionar usuarios y permisos
- ✅ Integración con múltiples fuentes de datos

### ¿Por qué Strapi?

- **Headless:** Separación entre contenido y presentación
- **API-first:** Expone contenido vía REST + GraphQL
- **Open Source:** Código abierto, extensible
- **Flexible:** Personalizable completamente
- **Escalable:** Listo para producción

---

## ⚙️ Configuración Local

### Estructura de Strapi

```
microservices/strapi-cms/
├── config/                    # Configuración de Strapi
│   ├── server.js             # Configuración del servidor
│   ├── database.js           # Conexión MySQL
│   ├── api.js                # API REST config
│   ├── middlewares.js        # Middlewares
│   └── admin.js              # Panel admin
├── src/                       # Código fuente
│   ├── index.js              # Bootstrap
│   ├── api/                  # Tipos de contenido
│   └── extensions/           # Extensiones
├── package.json              # Dependencias
├── Dockerfile                # Para producción
├── Dockerfile.dev            # Para desarrollo
└── .env.example              # Variables de entorno
```

### Iniciar Strapi Localmente

1. **Configurar variables de entorno:**
```bash
cd microservices/strapi-cms
cp .env.example .env
```

2. **Editar .env con valores locales:**
```bash
DATABASE_HOST=mysql
DATABASE_PORT=3306
DATABASE_NAME=strapi_db
DATABASE_USER=strapi_user
DATABASE_PASSWORD=strapi_pass
NODE_ENV=development
```

3. **Instalar dependencias:**
```bash
npm install
```

4. **Iniciar Strapi:**
```bash
npm run dev
# Accesible en: http://localhost:1337/admin
```

5. **Crear usuario administrador:**
   - Ir a http://localhost:1337/admin
   - Crear cuenta de administrador
   - Completar datos de usuario

### O usar Docker Compose:

```bash
cd /workspaces/Proyecto-WebStack
docker-compose up strapi-cms -d
docker-compose logs -f strapi-cms
# Esperar a que esté listo (~30 segundos)
# Ir a http://localhost:1337/admin
```

---

## 🔌 Integración con Frontend

### 1. Crear Tipos de Contenido (Content Types)

En el panel admin de Strapi (http://localhost:1337/admin):

#### Tipo: `Banner` (para hero section)
```
Campos:
├─ Títolo (Text)
├─ Descripción (Text)
├─ Imagen (Image)
├─ Enlace (Text)
└─ Activo (Boolean, default: true)
```

#### Tipo: `Página` (gestionar páginas)
```
Campos:
├─ Título (Text, required)
├─ Slug (Text, unique)
├─ Contenido (Rich Text)
├─ Imagen destacada (Image)
├─ Descripción SEO (Text)
└─ Publicado (Boolean)
```

#### Tipo: `Testimonial`
```
Campos:
├─ Nombre autor (Text)
├─ Contenido (Text)
├─ Puntuación (Integer, 1-5)
├─ Avatar (Image)
└─ Fecha (DateTime)
```

### 2. Cliente HTTP en Frontend

```javascript
// frontend/src/api/strapi.js
import axios from 'axios'

const STRAPI_URL = import.meta.env.VITE_CMS_URL || 'http://localhost:1337'

const strapiAPI = axios.create({
  baseURL: `${STRAPI_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// BANNERS
export const getBanners = () => 
  strapiAPI.get('/banners?populate=*')

// PÁGINAS
export const getPages = () => 
  strapiAPI.get('/paginas?populate=*')

export const getPageBySlug = (slug) => 
  strapiAPI.get(`/paginas?filters[slug][$eq]=${slug}&populate=*`)

// TESTIMONIOS
export const getTestimonials = () => 
  strapiAPI.get('/testimonials?populate=*&sort=fecha:desc')

export default strapiAPI
```

### 3. Mostrar Contenido en React

```jsx
// frontend/src/components/HeroBanner.jsx
import { useEffect, useState } from 'react'
import { getBanners } from '../api/strapi'

export default function HeroBanner() {
  const [banner, setBanner] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getBanners()
      .then(res => {
        const activos = res.data.data.filter(b => b.attributes.Activo)
        if (activos.length > 0) {
          setBanner(activos[0])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Cargando...</div>
  if (!banner) return null

  const { Titulo, Descripcion, Imagen, Enlace } = banner.attributes
  const imageURL = Imagen?.data?.[0]?.attributes?.url
    ? `http://localhost:1337${Imagen.data[0].attributes.url}`
    : '/placeholder.jpg'

  return (
    <section className="hero">
      <img src={imageURL} alt={Titulo} />
      <div className="hero-content">
        <h1>{Titulo}</h1>
        <p>{Descripcion}</p>
        {Enlace && <a href={Enlace} className="btn">Ver más</a>}
      </div>
    </section>
  )
}
```

### 4. Configurar Permisos

En Strapi Admin → Settings → Roles & Permissions:

**Para público (sin autenticación):**
- `api::banner.banner` → Find, Findone ✓
- `api::pagina.pagina` → Find, Findone ✓
- `api::testimonial.testimonial` → Find, Find ✓

**Para usuarios autenticados:**
- Acceso adicional a endpoints protegidos

---

## 🚀 Deployment en Vercel

### Opción A: Strapi + Heroku + Vercel Frontend

#### 1. Preparar Strapi para Heroku

**Dockerfile para producción:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 1337
ENV NODE_ENV=production
CMD ["npm", "run", "start"]
```

**Procfile (para Heroku):**
```
release: npm run build
web: npm run start
```

**Variables de entorno en Heroku:**
```bash
DATABASE_HOST=<mysql-host>
DATABASE_NAME=strapi_prod
DATABASE_USER=<user>
DATABASE_PASSWORD=<password>
NODE_ENV=production
ADMIN_JWT_SECRET=<generated-secret>
JWT_SECRET=<generated-secret>
API_URL=https://strapi-tienda.herokuapp.com
```

#### 2. Deploy a Heroku

```bash
# Instalar Heroku CLI
npm install -g heroku

# Login
heroku login

# Crear app
heroku create tu-strapi-tienda

# Agregar remote
git remote add heroku https://git.heroku.com/tu-strapi-tienda.git

# Setup variable de entorno
heroku config:set NODE_ENV=production -a tu-strapi-tienda

# Deploy
git push heroku main
```

### Opción B: Strapi en Vercel (Función Serverless)

#### 1. Convertir Strapi a modo Serverless

**vercel.json:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "strapi develop",
  "env": {
    "DATABASE_HOST": "@database_host",
    "DATABASE_USER": "@database_user",
    "DATABASE_PASSWORD": "@database_password",
    "DATABASE_NAME": "strapi_vercel"
  }
}
```

#### 2. Deploy Frontend React en Vercel

Sin necesidad de cambios mayores, el frontend puede desplegarse directamente:

```bash
cd frontend

# Login
vercel login

# Deploy
vercel --prod

# O conectar repositorio Git
# y Vercel auto-deploya en cada push
```

### Opción C: Strapi Hosting + Vercel (Recomendado)

**Usar servicios de hosting de Strapi:**

1. **Strapi Cloud:** https://strapi.io/cloud
   - Hosting administrado de Strapi
   - Base de datos incluida
   - SSL automático
   - Backups automáticos

2. **Pasos:**
   - Registrarse en Strapi Cloud
   - Conectar repositorio GitHub
   - Deploy automático
   - Acceder a `https://tu-proyecto.strapi.cloud`

3. **Variables de entorno en Vercel Frontend:**
```env
VITE_CMS_URL=https://tu-proyecto.strapi.cloud
VITE_API_URL=https://tu-api-gateway.vercel.app
```

---

## 📡 API Reference

### REST API Endpoints

**Generar token (si es privado):**
```bash
curl -X POST http://localhost:1337/api/auth/local \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "user@example.com",
    "password": "password123"
  }'
```

**Obtener banners:**
```bash
curl http://localhost:1337/api/banners?populate=*
```

**Obtener página específica:**
```bash
curl "http://localhost:1337/api/paginas?filters[slug][$eq]=home&populate=*"
```

**Obtener testimonios con paginación:**
```bash
curl "http://localhost:1337/api/testimonials?sort=fecha:desc&pagination[pageSize]=12"
```

### GraphQL Query

```graphql
query GetBanners {
  banners(filters: {Activo: {eq: true}}) {
    data {
      id
      attributes {
        Titulo
        Descripcion
        Enlace
        Imagen {
          data {
            attributes {
              url
            }
          }
        }
      }
    }
  }
}
```

---

## 🔄 Webhooks a Microservicios

Sincronizar cambios en Strapi con producto-service:

**En Strapi Admin:**
1. Settings → Webhooks
2. Create new webhook
3. Configurar:
```
URL: http://api-gateway:5000/api/webhooks/product-sync
Eventos: 
  ✓ banners.create
  ✓ banners.update
  ✓ banners.delete
```

**En API Gateway (handler webhook):**
```javascript
app.post('/api/webhooks/product-sync', (req, res) => {
  const { event, data } = req.body
  
  // Sincronizar con product-service
  if (event === 'banners.create' || event === 'banners.update') {
    // Actualizar caché o base de datos
    console.log('Producto actualizado:', data)
  }
  
  res.json({ success: true })
})
```

---

## 🖼️ Gestión de Medios/Imágenes

### Subir Imágenes en Production

**Usar servicio de almacenamiento:**

1. **AWS S3:**
```bash
npm install @strapi/provider-upload-aws-s3
```

2. **Cloudinary:**
```bash
npm install strapi-provider-upload-cloudinary
```

3. **Configurar en plugins.js:**
```javascript
module.exports = {
  upload: {
    provider: 'aws-s3',
    providerOptions: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
      params: {
        Bucket: process.env.AWS_BUCKET,
      },
    },
  },
}
```

---

## 🔐 Seguridad en Producción

### Configurar HTTPS y CORS

```javascript
// config/server.js
module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
})

// config/middlewares.js - CORS restringido
{
  name: 'strapi::cors',
  config: {
    enabled: true,
    origin: [
      'https://tienda.ejemplo.com',
      'https://www.tienda.ejemplo.com'
    ],
    credentials: true,
  },
}
```

### API Tokens

En Admin → Settings → API Tokens:

1. Crear token para frontend
2. Seleccionar permisos
3. Usar en headers: `Authorization: Bearer <token>`

---

## 🐛 Troubleshooting

### Error: "database table not found"

```bash
# Eliminar y recrear tablas
npm run develop

# O ejecutar migraciones
strapi migrations
```

### Error: "Port 1337 already in use"

```bash
lsof -i :1337
kill -9 <PID>

# O cambiar puerto
PORT=1338 npm run dev
```

### Imágenes no se cargan en production

```javascript
// Verificar URL base en config/server.js
module.exports = ({ env }) => ({
  url: env('PUBLIC_URL', 'https://tu-strapi.herokuapp.com'),
})
```

### Base de datos sin conectar

```bash
# Verificar variables de entorno
echo $DATABASE_HOST
echo $DATABASE_USER

# Verificar conectividad MySQL
docker-compose exec strapi-cms \
  mysql -h mysql -u strapi_user -p strapi_pass -e "USE strapi_db; SHOW TABLES;"
```

---

## 📚 Recursos Adicionales

- **Documentación oficial:** https://docs.strapi.io
- **Plugin marketplace:** https://market.strapi.io
- **Community Forum:** https://forum.strapi.io
- **YouTube tutorials:** Strapi official channel

---

## ✅ Checklist de Setup Completo

- [ ] Strapi corriendo localmente en puerto 1337
- [ ] Crear tipos de contenido (Banner, Página, Testimonial)
- [ ] Crear contenido de prueba
- [ ] Configurar permisos públicos
- [ ] Frontend conectado a API de Strapi
- [ ] Probar GET requests desde frontend
- [ ] Configurar variables .env para producción
- [ ] Deploy Strapi en Heroku/Strapi Cloud
- [ ] Deploy Frontend en Vercel
- [ ] Configurar URLs en producción
- [ ] Pruebas finales en producción
- [ ] Configurar webhooks (opcional)

---

### 🛠 Avanzado y Escalabilidad

#### Roles y Autenticación real
- Aprovecha el plugin **Users & Permissions** para crear roles personalizados y políticas. En el `bootstrap` de `src/extensions/users-permissions/bootstrap.js` puedes generar roles automáticos:
  ```js
  const roleService = strapi.plugins['users-permissions'].services.role;
  await roleService.create({
    name: 'Editor',
    type: 'editor',
    permissions: { /* defaults o personalizadas */ }
  });
  ```
- Crear colecciones `user`, `order`, `product` y relacionarlas. Usa políticas para restringir:
  ```js
  // ./src/policies/isOwner.js
  module.exports = async (ctx, next) => {
    const { id } = ctx.state.user;
    const { data } = await strapi.entityService.findOne(
      'api::order.order', ctx.params.id
    );
    if (data.attributes.user.data.id !== id) {
      return ctx.unauthorized('No es tu pedido');
    }
    await next();
  };
  ```
- Utiliza providers externos (Google, GitHub) configurando en Settings → Providers y ajusta los callbacks para crear permisos.

#### Base de datos externa/separada
- Edita `microservices/strapi-cms/config/database.js` para apuntar a la nueva DB (SQL Server, PostgreSQL, hosted MySQL, etc.).
- En Kubernetes define `Secret` con credenciales y `ConfigMap` para otros valores.
- Si migras datos de una instalación local a la externa usa `strapi export`/`strapi import` o plugins como `strapi-plugin-migrations`.

#### Migración al clúster Kubernetes
1. Construye la imagen y sube a tu registro (`docker build && docker push`).
2. Usa los manifiestos de ejemplo que ya existen en `PRODUCTION-SETUP.md` y agrega el servicio `strapi`:
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata: { name: strapi }
   spec:
     replicas: 2
     selector: { matchLabels: { app: strapi } }
     template:
       metadata: { labels: { app: strapi } }
       spec:
         containers:
           - name: strapi
             image: your-registry/strapi:latest
             ports:
               - containerPort: 1337
             envFrom:
               - secretRef: { name: strapi-secrets }
             env:
               - name: NODE_ENV
                 value: production
   ---
   kind: Service
   apiVersion: v1
   metadata: { name: strapi }
   spec:
     type: ClusterIP
     selector: { app: strapi }
     ports:
       - port: 1337
         targetPort: 1337
   ```
3. Adjunta un `PersistentVolume`/`PVC` si necesitas conservar la carpeta `./public/uploads`.
4. Re-aplica `kubectl apply -f k8s/` y verifica con `kubectl get pods,svc`.

#### Desplegar CMS en Vercel y ajustar API Gateway
- Vercel no es ideal para Strapi; prefiere Strapi Cloud/Heroku/Railway. Si aun así lo pones en Vercel, usa el adaptador serverless descrito más arriba y una DB externa.
- En el API gateway, utiliza variables de entorno (`STRAPI_URL`) para apuntar a la URL pública del CMS desplegado.
  ```js
  const CMS_URL = process.env.STRAPI_URL || 'http://localhost:1337';
  app.get('/api/bsome', async (req, res) => {
    const data = await axios.get(`${CMS_URL}/api/banners`);
    res.json(data.data);
  });
  ```

#### Mejoras de frontend
- Sustituye estilos de prueba por CSS/Sass/Tailwind reales. Importa desde `frontend/src/styles/*`.
- Consume datos dinámicos de otros endpoints (`/orders`, `/user/profile`) y maneja estados con `store/index.js` (Redux o Context).
- Agrega componentes de autenticación (login/register) usando el JWT generado por Strapi.

#### Escalar con nuevos microservicios, colas, caching y monitoreo
- **Autenticación/Órdenes:** crea servicios separados (`auth-service`, `order-service`) que expongan APIs y usen colas para procesamiento asíncrono.
- **Colas:** RabbitMQ o Kafka; añade un contenedor en `docker-compose` o en K8s como StatefulSet. Usa paquetes como `amqplib` (Node) para publicar/consumir mensajes.
- **Caching:** Redis para sesiones o resultados frecuentes; inserta un servicio `redis` y configura en cada microservicio. Ejemplo de cliente:
  ```js
  const redis = require('redis');
  const client = redis.createClient({ url: process.env.REDIS_URL });
  await client.connect();
  ```
- **Monitoreo:** Prometheus/Grafana para métricas y Jaeger para trazas. Ya hay ejemplos en este documento bajo “Deployment en Kubernetes” y “Monitoring” en `PRODUCTION-SETUP.md`.
- **Logging centralizado:** usa Elastic Stack o Loki/Promtail.

> 🧩 A medida que la aplicación crezca, prioriza: seguridad, tolerancia a fallos, escalado automático (HPA), backups de base de datos y pruebas de carga.

---

**Versión:** 1.0  
**Última actualización:** 2026  
**Compatibilidad:** Strapi 4.15+

