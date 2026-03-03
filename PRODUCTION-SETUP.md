# 🚀 Configuración para Producción

## Consideraciones Importantes

Esta guía describe cómo adaptar la arquitectura actual para un entorno de producción escalable.

## 🏗️ Cambios Arquitectónicos Recomendados

### 1. Agregar Load Balancer (Nginx/HAProxy)

```yaml
# docker-compose.prod.yml - Agregar servicio
load-balancer:
  image: nginx:latest
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./nginx/ssl:/etc/nginx/ssl:ro
  depends_on:
    - api-gateway
    - frontend
  networks:
    - tienda-network
```

### 2. Usar Base de Datos por Servicio

```yaml
# En lugar de una MySQL compartida:

auth-db:
  image: mysql:8.0
  environment:
    MYSQL_DATABASE: auth_db
  volumes:
    - auth-data:/var/lib/mysql

product-db:
  image: mysql:8.0
  environment:
    MYSQL_DATABASE: product_db
  volumes:
    - product-data:/var/lib/mysql

order-db:
  image: mysql:8.0
  environment:
    MYSQL_DATABASE: order_db
  volumes:
    - order-data:/var/lib/mysql
```

### 3. Agregar Redis para Cache y Sessions

```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  volumes:
    - redis-data:/data
  networks:
    - tienda-network
```

### 4. Message Queue para Operaciones Asincrónicas

```yaml
rabbitmq:
  image: rabbitmq:3.12-management-alpine
  environment:
    RABBITMQ_DEFAULT_USER: guest
    RABBITMQ_DEFAULT_PASS: guest
  ports:
    - "5672:5672"
    - "15672:15672"
  volumes:
    - rabbitmq-data:/var/lib/rabbitmq
  networks:
    - tienda-network
```

## 🔐 Seguridad en Producción

### 1. HTTPS/TLS Obligatorio

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name tienda.ejemplo.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    location / {
        proxy_pass http://frontend:3000;
    }
    
    location /api {
        proxy_pass http://api-gateway:5000;
    }
}

# Redirigir HTTP a HTTPS
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}
```

### 2. Variables de Entorno en Secretos

```bash
# NO commitar .env files
echo "microservices/*/.env" >> .gitignore

# Usar sistema de secretos (AWS Secrets Manager, Vault, etc.)
# O en Kubernetes:
kubectl create secret generic jwt-secret --from-literal='JWT_SECRET=...'
```

### 3. API Key Protection

```php
// En API Gateway
if (empty($_SERVER['HTTP_X_API_KEY'])) {
    http_response_code(401);
    exit(json_encode(['error' => 'API Key requerida']));
}

$apiKey = $_SERVER['HTTP_X_API_KEY'];
if (!isset($_ENV['VALID_API_KEYS'][$apiKey])) {
    http_response_code(403);
    exit(json_encode(['error' => 'API Key inválida']));
}
```

### 4. Rate Limiting

```javascript
// API Gateway: express-rate-limit
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: 'Demasiadas solicitudes'
});

app.use('/api/', limiter);
```

### 5. CORS Restringido

```javascript
// API Gateway
const cors = require('cors');

app.use(cors({
  origin: ['https://tienda.ejemplo.com'],
  credentials: true,
  optionsSuccessStatus: 200
}));
```

## 📊 Monitoreo y Observabilidad

### 1. Logging Centralizado (ELK Stack)

```yaml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
  environment:
    - discovery.type=single-node
  volumes:
    - elasticsearch-data:/usr/share/elasticsearch/data

kibana:
  image: docker.elastic.co/kibana/kibana:8.0.0
  ports:
    - "5601:5601"
  depends_on:
    - elasticsearch

# Cada servicio envía logs a Elasticsearch
```

### 2. Métricas (Prometheus + Grafana)

```javascript
// API Gateway con prometheus-client
const prometheus = require('prom-client');

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    httpRequestDuration.observe({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    }, (Date.now() - start) / 1000);
  });
  next();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});
```

### 3. Distributed Tracing (Jaeger)

```javascript
// Instrumentación de trazas distribuidas
const initTracer = require('jaeger-client').initTracer;

const config = {
  serviceName: 'api-gateway',
  sampler: { type: 'const', param: 1 },
  reporter: { logSpans: true }
};

const tracer = initTracer(config);
```

## 🚀 Deployment en Kubernetes

### 1. Crear Manifiestos

```yaml
# k8s/deployment-api-gateway.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: registro.ejemplo.com/api-gateway:1.0.0
        ports:
        - containerPort: 5000
        env:
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-service
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 5000
  selector:
    app: api-gateway
```

### 2. Helm Chart (Opcional)

```bash
# Estructura recomendada
helm/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── api-gateway-deployment.yaml
│   ├── auth-service-deployment.yaml
│   ├── product-service-deployment.yaml
│   ├── order-service-deployment.yaml
│   ├── mysql-statefulset.yaml
│   └── ingress.yaml
```

## 🔄 CI/CD Pipeline

### GitHub Actions Ejemplo

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm test
      
      - name: Build Docker images
        run: docker-compose build
      
      - name: Push to registry
        run: |
          echo ${{ secrets.REGISTRY_PASSWORD }} | docker login -u ${{ secrets.REGISTRY_USER }} --password-stdin
          docker push registro.ejemplo.com/api-gateway:latest
          
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Kubernetes
        run: kubectl apply -f k8s/
```

## 📈 Escalabilidad

### 1. Horizontal Scaling

```yaml
# docker-compose con múltiples instancias
version: '3.8'

services:
  api-gateway:
    deploy:
      replicas: 3
    
  auth-service:
    deploy:
      replicas: 2
    
  product-service:
    deploy:
      replicas: 2
    
  order-service:
    deploy:
      replicas: 2
```

### 2. Database Replication

```bash
# MySQL Master-Slave Setup
# Master: puerto 3306
# Slave 1: puerto 3307
# Slave 2: puerto 3308

# En configuración del servicio:
DB_HOST=mysql-master  # Para writes
DB_REPLICA_HOST=mysql-slave-1  # Para reads
```

### 3. Caching Layer

```php
// En los servicios PHP
class Product {
    private $cache;
    
    public function get($id) {
        $cacheKey = "product_$id";
        
        $cached = $this->cache->get($cacheKey);
        if ($cached) return $cached;
        
        $product = $this->db->query("SELECT * FROM productos WHERE id = ?", [$id]);
        
        $this->cache->set($cacheKey, $product, 3600); // TTL 1 hora
        return $product;
    }
}
```

## ✅ Checklist Pre-Producción

- [ ] HTTPS/TLS configurado y válido
- [ ] JWT secret actualizado (no default)
- [ ] CORS limitado a dominio específico
- [ ] Rate limiting habilitado
- [ ] Logging centralizado configurado
- [ ] Backups automáticos de base de datos
- [ ] Monitoreo y alertas configuradas
- [ ] Tests unitarios/integración en CI/CD
- [ ] Documentación API actualizada
- [ ] Plan de disaster recovery
- [ ] Escalabilidad horizontal probada
- [ ] Security scan de dependencies (`npm audit`, `composer audit`)
- [ ] Performance testing completado
- [ ] SLA y uptime monitoring definidos

---

**Versión:** 1.0.0  
**Última actualización:** 2024
