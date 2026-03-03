# 🚀 DEPLOYMENT EN VERCEL - Microservicios + Strapi + React

## 📑 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura de Deployment](#arquitectura-de-deployment)
3. [Frontend en Vercel](#frontend-en-vercel)
4. [Backend en Diferentes Plataformas](#backend-en-diferentes-plataformas)
5. [Strapi Hosting](#strapi-hosting)
6. [Database en Producción](#database-en-producción)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Monitoreo y Logs](#monitoreo-y-logs)

---

## 🎯 Visión General

### Stack de Producción Recomendado

```
┌─────────────────────────────────────────────────────────────────┐
│                         VERCEL                                  │
│    ├─ Frontend React (PaaS)                                     │
│    └─ Serverless Functions (opcional)                           │
└──────────────────────────────▲──────────────────────────────────┘
                               │ HTTPS
                    ┌──────────┴──────────┐
                    ▼                     ▼
        ┌──────────────────┐  ┌──────────────────┐
        │  HEROKU /        │  │  STRAPI CLOUD    │
        │  RAILWAY         │  │  (CMS Hosting)   │
        │                  │  │                  │
        │ API Gateway      │  │ Strapi           │
        │ Auth Service     │  │ - Content Types  │
        │ Product Service  │  │ - Media Upload   │
        │ Order Service    │  │ - Admin Panel    │
        └──────────┬───────┘  └────────┬─────────┘
                   │                  │
        ┌──────────┴──────────┬───────┴──────────┐
        ▼                     ▼                  ▼
   ┌─────────┐       ┌──────────────┐    ┌───────────┐
   │  MySQL  │       │  AWS S3      │    │ Cloudinary│
   │  Cloud  │       │  (Imágenes)  │    │(Imágenes) │
   │  (RDS)  │       └──────────────┘    └───────────┘
   └─────────┘
```

---

## ⚙️ Arquitectura de Deployment

### Opción 1: Vercel (Frontend) + Heroku (Backend) - Económica

**Ventajas:**
- ✅ Vercel gratis para frontend
- ✅ Heroku gratis con limitaciones
- ✅ Fácil de configurar
- ✅ Buen para MVP/startup

**Desventajas:**
- ❌ Heroku puede tener coldstarts
- ❌ Limitaciones en dynos gratis

### Opción 2: Vercel + Railway (Backend) - Recomendada

**Ventajas:**
- ✅ Vercel para frontend
- ✅ Railway: más rápido que Heroku
- ✅ Mejor pricing
- ✅ Mejor rendimiento

**Desventajas:**
- ⚠️ Requiere pago mínimo

### Opción 3: Vercel + Strapi Cloud - Todo integrado

**Ventajas:**
- ✅ Frontend en Vercel
- ✅ Strapi Cloud (hosting oficial)
- ✅ MySQL en Atlas/RDS
- ✅ Mejor soporte

**Desventajas:**
- ⚠️ Costo más alto

---

## 🎨 Frontend en Vercel

### 1. Preparar el Proyecto

**Estructura necesaria:**
```
frontend/
├── package.json      ✓ Verificar scripts
├── vite.config.js    ✓ Build config
├── .env.production   ← Crear esto
└── src/
```

**Crear .env.production:**
```env
VITE_API_URL=https://api-tienda.example.com/api
VITE_CMS_URL=https://strapi-tienda.example.com
NODE_ENV=production
```

### 2. Conectar GitHub

1. **Hacer push del código:**
```bash
cd /workspaces/Proyecto-WebStack
git init
git add .
git commit -m "Initial commit: Microservicios con Strapi"
git remote add origin https://github.com/tuusuario/tienda-reactiva.git
git push -u origin main
```

2. **En Vercel:**
   - Ir a https://vercel.com
   - Click "Import Project"
   - Seleccionar repositorio GitHub
   - Vercel auto-detecta:
     ```
     Framework: Vite (React)
     Root Directory: ./frontend
     ```

3. **Configurar variables de entorno:**
   - En Vercel Dashboard → Settings → Environment Variables
   - Agregar:
     ```
     VITE_API_URL = https://tu-api-backend.herokuapp.com/api
     VITE_CMS_URL = https://tu-strapi.strapi.cloud
     ```

4. **Deploy:**
   - Click "Deploy"
   - Esperar ~2-3 minutos
   - Accesible en `https://tu-proyecto.vercel.app`

### 3. Custom Domain

En Vercel Dashboard:
1. Settings → Domains
2. Agregar dominio personalizado
3. Apuntar DNS a Vercel (muestra instrucciones)

---

## 🔧 Backend en Diferentes Plataformas

### Opción A: Heroku (Económico)

**1. Instalar Heroku CLI:**
```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

**2. Login y crear app:**
```bash
heroku login
heroku create tu-api-tienda
```

**3. Set environment variables:**
```bash
heroku config:set NODE_ENV=production \
  JWT_SECRET=tu_secreto_muy_seguro \
  DATABASE_HOST=tu-mysql.example.com \
  DATABASE_USER=root \
  DATABASE_PASSWORD=password \
  DATABASE_NAME=tienda_prod
```

**4. Deploy:**
```bash
# Desde la raíz del proyecto
git push heroku main
```

**5. Ver logs:**
```bash
heroku logs --tail
```

### Opción B: Railway (Recomendado)

**1. Ir a railway.app**

**2. Crear nuevo proyecto:**
```bash
npm install -g railway
railway login
railway init
```

**3. Configurar servicio:**
```bash
railway add   # Agregar API Gateway
railway variables add NODE_ENV=production
railway variables add DATABASE_HOST=mysql...
```

**4. Deploy:**
```bash
railway up
```

**5. URL pública:**
```bash
railway env  # Mostrar URL pública
```

### Opción C: Docker Hub + AWS/GCP

**1. Construir imagen:**
```bash
docker build -t tu-usuario/api-gateway:latest ./microservices/api-gateway
docker push tu-usuario/api-gateway:latest
```

**2. Desplegar en AWS EC2/ECS:**
```bash
# Usar docker-compose en servidor remoto
scp docker-compose.yml user@server:/app/
ssh user@server
cd /app
docker-compose -f docker-compose.prod.yml up -d
```

---

## 💾 Strapi Hosting

### Opción Recomendada: Strapi Cloud

**1. Registro:**
   - Ir a https://strapi.io/cloud
   - Conectar cuenta GitHub
   - Autorizar acceso

**2. Crear proyecto:**
   - Click "Create Project"
   - Seleccionar repositorio con Strapi
   - Path: `microservices/strapi-cms`

**3. Configurar base de datos:**
   - Strapi Cloud provee espacioMySQL
   - O conectar base de datos externa

**4. Variables de entorno:**
   ```
   ADMIN_JWT_SECRET = <generated>
   JWT_SECRET = <generated>
   API_URL = https://tu-proyecto.strapi.cloud
   ```

**5. Deploy automático:**
   - Cada push a main deploya automáticamente
   - Panel en https://dashboard.strapi.cloud

### Alternativa: Heroku para Strapi

**Crear git subtree:**
```bash
# Desde raíz del proyecto
git subtree push --prefix microservices/strapi-cms heroku main
```

**O manual:**
```bash
cd microservices/strapi-cms
heroku create tu-strapi-cms
git push heroku main
```

---

## 📊 Database en Producción

### AWS RDS (MySQL)

**1. Crear instancia:**
```bash
aws rds create-db-instance \
  --db-instance-identifier tienda-prod \
  --db-instance-class db.t2.micro \
  --engine mysql \
  --allocated-storage 20 \
  --master-username admin \
  --master-user-password tu_password_seguro
```

**2. Obtener endpoint:**
```bash
aws rds describe-db-instances \
  --db-instance-identifier tienda-prod \
  --query 'DBInstances[0].Endpoint.Address'
```

**3. Configurar en variables de entorno:**
```
DATABASE_HOST=tienda-prod.xxxxx.us-east-1.rds.amazonaws.com
DATABASE_USER=admin
DATABASE_PASSWORD=tu_password_seguro
DATABASE_NAME=tienda_db
```

### MongoDB Atlas (NoSQL - opcional)

**Para Strapi (alternativa a MySQL):**

```bash
# Variables en Strapi
DATABASE_CLIENT=mongo
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/strapi
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

**Crear .github/workflows/deploy.yml:**

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Test Frontend
        run: |
          cd frontend
          npm install
          npm run build

  deploy-vercel:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway login --token ${{ secrets.RAILWAY_TOKEN }}
          railway up --service api-gateway
```

**En GitHub Settings → Secrets agregar:**
- `VERCEL_TOKEN`
- `RAILWAY_TOKEN`

---

## 📈 Monitoreo y Logs

### Frontend (Vercel)

```
Dashoard → Analytics:
- Page Load Speed
- Web Vitals
- User Analytics
```

### Backend (Railway/Heroku)

**Railway:**
```bash
railway logs --service api-gateway
```

**Heroku:**
```bash
heroku logs --tail -a tu-api-tienda
```

### Strapi Cloud

Dashboard automáticamente muestra:
- Performance metrics
- API usage
- Error tracking

### Alertas

**Configurar en Sentry (error tracking):**

```javascript
// En api-gateway
import * as Sentry from "@sentry/node"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
})
```

---

## 🎯 Paso a Paso: Deploy Completo

### Semana 1: Preparación

- [ ] Crear cuenta Vercel (gratuita)
- [ ] Crear cuenta Railway o Heroku
- [ ] Crear cuenta Strapi Cloud
- [ ] Crear AWS RDS (opcional)
- [ ] Preparar GitHub repo public

### Semana 2: Deploy Inicial

- [ ] Conectar frontend a Vercel
- [ ] Deploy API Gateway a Railway
- [ ] Deploy Strapi a Strapi Cloud
- [ ] Apuntar database a RDS
- [ ] Tests manuales

### Semana 3: Configuración

- [ ] Setup custom domain
- [ ] Configurar SSL/HTTPS
- [ ] Configurar CORS
- [ ] Setup CI/CD GitHub Actions
- [ ] Configurar monitoreo

### Semana 4+: Mantenimiento

- [ ] Monitoring diario
- [ ] Actualizaciones de seguridad
- [ ] Backups automáticos
- [ ] Escalamiento si es necesario

---

## 💰 Costos Estimados (mensual)

| Servicio | Plan | Costo |
|----------|------|-------|
| **Vercel** | Hobby | Gratis |
| **Railway** | Pay-as-you-go | $5-30 |
| **Strapi Cloud** | Starter | $49+ |
| **AWS RDS** | db.t2.micro | $10-20 |
| **Storage (S3)** | 5GB | $1 |
| **TOTAL** | | **$65-100** |

---

## ✅ Checklist Final

- [ ] Frontend en Vercel (dominio funcionado)
- [ ] API Gateway respondiendo
- [ ] Strapi CMS accesible
- [ ] Database conectada y funcionando
- [ ] Variables de entorno configuradas
- [ ] CORS configurado correctamente
- [ ] SSL/HTTPS activo
- [ ] Logs y monitoreo
- [ ] Tests manuales completados
- [ ] CI/CD pipeline automático

---

**Versión:** 1.0  
**Última actualización:** 2024  
**Tiempo estimado:** 3-4 semanas de configuración
