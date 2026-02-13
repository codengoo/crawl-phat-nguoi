# Deployment Guide

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum
- 10GB disk space

## Local Development

### 1. Clone repository

```bash
git clone <repository-url>
cd crawl
```

### 2. Install dependencies

```bash
npm install
```

### 3. Install Playwright browsers

```bash
npm run install:browsers
```

### 4. Configure environment

```bash
cp .env.example .env
```

Edit `.env` file:
```env
PORT=3000
NODE_ENV=development
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0
```

### 5. Run development server

```bash
npm run start:dev
```

Access:
- API: http://localhost:3000
- Swagger: http://localhost:3000/api-docs

## Docker Deployment

### Quick Start

```bash
# Build and start
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Manual Docker Build

```bash
# Build image
docker build -t csgt-crawler:latest .

# Run container
docker run -d \
  -p 3000:3000 \
  --name csgt-crawler \
  -e NODE_ENV=production \
  --restart unless-stopped \
  csgt-crawler:latest

# Check logs
docker logs -f csgt-crawler

# Stop container
docker stop csgt-crawler
docker rm csgt-crawler
```

## Production Deployment

### 1. Using Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml csgt

# Check services
docker service ls
docker service logs csgt_csgt-crawler

# Scale service
docker service scale csgt_csgt-crawler=3

# Remove stack
docker stack rm csgt
```

### 2. Using Kubernetes

Create `deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: csgt-crawler
spec:
  replicas: 3
  selector:
    matchLabels:
      app: csgt-crawler
  template:
    metadata:
      labels:
        app: csgt-crawler
    spec:
      containers:
      - name: csgt-crawler
        image: csgt-crawler:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        resources:
          requests:
            memory: "1Gi"
            cpu: "1"
          limits:
            memory: "2Gi"
            cpu: "2"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 40
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: csgt-crawler-service
spec:
  selector:
    app: csgt-crawler
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

Deploy:

```bash
kubectl apply -f deployment.yaml
kubectl get pods
kubectl get services
```

### 3. Using PM2 (Node.js Process Manager)

```bash
# Install PM2
npm install -g pm2

# Build application
npm run build

# Start with PM2
pm2 start dist/main.js --name csgt-crawler -i max

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'csgt-crawler',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '2G'
  }]
};
```

Start with config:

```bash
pm2 start ecosystem.config.js
```

## Nginx Reverse Proxy

Create `/etc/nginx/sites-available/csgt-crawler`:

```nginx
upstream csgt_backend {
    least_conn;
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    listen 80;
    server_name api.example.com;

    # Increase timeout for long-running requests
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;

    location / {
        proxy_pass http://csgt_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    # Access log
    access_log /var/log/nginx/csgt-access.log;
    error_log /var/log/nginx/csgt-error.log;
}
```

Enable and restart:

```bash
ln -s /etc/nginx/sites-available/csgt-crawler /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## SSL/TLS with Let's Encrypt

```bash
# Install certbot
apt-get install certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d api.example.com

# Auto-renewal
certbot renew --dry-run
```

## Monitoring

### Health Checks

```bash
# Shell script for monitoring
#!/bin/bash
HEALTH_URL="http://localhost:3000/health"

while true; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)
    
    if [ $HTTP_CODE -ne 200 ]; then
        echo "Health check failed with code: $HTTP_CODE"
        # Restart service
        docker-compose restart csgt-crawler
        # Or: pm2 restart csgt-crawler
    fi
    
    sleep 30
done
```

### Logging

Setup centralized logging with ELK stack or similar:

```yaml
# docker-compose.yml addition
services:
  csgt-crawler:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Environment Variables

Production `.env`:

```bash
# Server
NODE_ENV=production
PORT=3000

# Logging
LOG_LEVEL=info

# Performance
NODE_OPTIONS="--max-old-space-size=2048"

# Playwright
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
```

## Security Best Practices

### 1. Rate Limiting

Add to `main.ts`:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

### 2. Helmet for Security Headers

```bash
npm install --save @nestjs/platform-express helmet
```

Add to `main.ts`:

```typescript
import helmet from 'helmet';

app.use(helmet());
```

### 3. CORS Configuration

```typescript
app.enableCors({
  origin: ['https://yourapp.com'],
  credentials: true,
});
```

## Performance Tuning

### Docker Resource Limits

```yaml
# docker-compose.yml
services:
  csgt-crawler:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Node.js Optimization

```bash
# Increase memory
NODE_OPTIONS="--max-old-space-size=4096"

# Enable cluster mode
PM2_INSTANCES=4
```

## Backup Strategy

### Database Backup (if using DB)

```bash
# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup Docker volumes
docker run --rm \
  -v csgt_data:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/data_$DATE.tar.gz -C /data .
```

## Scaling Strategy

### Horizontal Scaling

```bash
# Docker Compose
docker-compose up -d --scale csgt-crawler=5

# Kubernetes
kubectl scale deployment csgt-crawler --replicas=10
```

### Load Balancer Configuration

Use Nginx, HAProxy, or cloud load balancers (AWS ALB, GCP Load Balancer).

## Troubleshooting

### High Memory Usage

```bash
# Check memory
docker stats csgt-crawler

# Restart if needed
docker-compose restart csgt-crawler
```

### Browser Issues

```bash
# Check browser status
curl http://localhost:3000/health/browser

# Restart browser
curl -X POST http://localhost:3000/health/browser/restart
```

### Performance Issues

```bash
# Check logs
docker-compose logs -f --tail=100 csgt-crawler

# Monitor resources
docker stats
```

## Rollback

```bash
# Docker
docker-compose down
docker-compose pull
docker-compose up -d

# Kubernetes
kubectl rollout undo deployment/csgt-crawler
kubectl rollout status deployment/csgt-crawler
```

## Maintenance

### Update Dependencies

```bash
npm update
npm audit fix
```

### Update Docker Image

```bash
docker-compose pull
docker-compose up -d
```

### Clean Old Images

```bash
docker system prune -a
```

## Support & Monitoring

- Health endpoint: `/health`
- Browser check: `/health/browser`
- API docs: `/api-docs`
- Logs: `docker-compose logs -f`
