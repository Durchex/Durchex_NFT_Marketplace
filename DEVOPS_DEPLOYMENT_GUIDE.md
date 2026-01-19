# Durchex NFT Marketplace - DevOps & Deployment Guide

## Table of Contents
1. [Docker Deployment](#docker-deployment)
2. [Kubernetes Deployment](#kubernetes-deployment)
3. [CI/CD Pipeline](#cicd-pipeline)
4. [Environment Configuration](#environment-configuration)
5. [Monitoring & Logging](#monitoring--logging)
6. [Scaling & Performance](#scaling--performance)
7. [Security Hardening](#security-hardening)
8. [Disaster Recovery](#disaster-recovery)

## Docker Deployment

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 50GB disk space

### Local Development

```bash
# Clone repository
git clone https://github.com/durchex/marketplace.git
cd durchex_NFT_Marketplace

# Create .env file
cp .env.example .env

# Start services
docker-compose up -d

# Verify services
docker-compose ps
docker-compose logs -f backend
```

### Production Deployment

```bash
# Build production images
docker build -t durchex-backend:latest ./backend_temp
docker build -t durchex-frontend:latest ./frontend

# Push to registry
docker tag durchex-backend:latest registry.example.com/durchex-backend:latest
docker push registry.example.com/durchex-backend:latest

# Run with production compose
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Kubernetes Deployment

### Prerequisites
- Kubernetes 1.24+
- kubectl configured
- Helm 3.0+
- Persistent Volume provisioner

### Deployment Steps

```bash
# Create namespace
kubectl create namespace durchex

# Deploy MongoDB
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install mongodb bitnami/mongodb \
  --namespace durchex \
  --set auth.rootPassword=<PASSWORD>

# Deploy Redis
helm install redis bitnami/redis \
  --namespace durchex \
  --set auth.password=<PASSWORD>

# Deploy backend
kubectl apply -f k8s/backend-deployment.yaml -n durchex

# Deploy frontend
kubectl apply -f k8s/frontend-deployment.yaml -n durchex

# Check status
kubectl get pods -n durchex
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: Deploy Durchex Marketplace

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test
      
      - name: Run linter
        run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v3
      
      - name: Login to registry
        uses: docker/login-action@v2
        with:
          registry: ${{ secrets.REGISTRY }}
          username: ${{ secrets.REGISTRY_USER }}
          password: ${{ secrets.REGISTRY_PASSWORD }}
      
      - name: Build backend
        run: |
          docker build -t ${{ secrets.REGISTRY }}/durchex-backend:${{ github.sha }} ./backend_temp
          docker push ${{ secrets.REGISTRY }}/durchex-backend:${{ github.sha }}
      
      - name: Build frontend
        run: |
          docker build -t ${{ secrets.REGISTRY }}/durchex-frontend:${{ github.sha }} ./frontend
          docker push ${{ secrets.REGISTRY }}/durchex-frontend:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        run: |
          kubectl set image deployment/durchex-backend \
            backend=${{ secrets.REGISTRY }}/durchex-backend:${{ github.sha }} \
            -n durchex
          kubectl set image deployment/durchex-frontend \
            frontend=${{ secrets.REGISTRY }}/durchex-frontend:${{ github.sha }} \
            -n durchex
          kubectl rollout status deployment/durchex-backend -n durchex
```

## Environment Configuration

### .env Template

```env
# Node Environment
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb://user:password@mongodb:27017/durchex_nft
MONGODB_USER=admin
MONGODB_PASSWORD=your_password

# Cache
REDIS_URL=redis://:password@redis:6379
REDIS_PASSWORD=your_redis_password

# Web3
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/YOUR_API_KEY
INFURA_API_KEY=your_infura_key
ALCHEMY_API_KEY=your_alchemy_key

# Smart Contracts
NFT_CONTRACT_ADDRESS=0x...
GOVERNANCE_TOKEN_ADDRESS=0x...
BRIDGE_CONTRACT_ADDRESS=0x...

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRY=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# AWS
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=durchex-uploads
AWS_REGION=us-east-1

# IPFS
IPFS_GATEWAY=https://ipfs.io
IPFS_API_URL=https://ipfs.infura.io:5001

# Logging
LOG_LEVEL=info
LOG_FILE=/app/logs/durchex.log
```

## Monitoring & Logging

### Prometheus Setup

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'durchex-backend'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'

  - job_name: 'mongodb'
    static_configs:
      - targets: ['localhost:27017']
```

### ELK Stack Deployment

```bash
# Deploy Elasticsearch
helm install elasticsearch elastic/elasticsearch -n durchex

# Deploy Kibana
helm install kibana elastic/kibana -n durchex

# Deploy Logstash
helm install logstash elastic/logstash -n durchex
```

## Scaling & Performance

### Horizontal Scaling

```bash
# Scale backend replicas
kubectl scale deployment durchex-backend --replicas=3 -n durchex

# Scale frontend replicas
kubectl scale deployment durchex-frontend --replicas=2 -n durchex

# Autoscaling setup
kubectl autoscale deployment durchex-backend \
  --min=2 --max=10 \
  --cpu-percent=80 -n durchex
```

### Load Testing

```bash
# Using Apache Bench
ab -n 10000 -c 100 http://localhost:3000/api/health

# Using Locust
locust -f locustfile.py --host=http://localhost:3000
```

## Security Hardening

### SSL/TLS Configuration

```bash
# Generate certificates
certbot certonly --standalone -d durchex.com -d api.durchex.com

# Update Nginx
# Point to /etc/letsencrypt/live/durchex.com/
```

### Network Security

```yaml
# Network Policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: durchex-network-policy
  namespace: durchex
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: durchex
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              name: durchex
```

## Disaster Recovery

### Backup Strategy

```bash
# MongoDB Backup
mongodump --uri="mongodb://user:password@localhost:27017/durchex_nft" \
  --out=/backups/mongodb-$(date +%Y%m%d)

# Restore MongoDB
mongorestore --uri="mongodb://user:password@localhost:27017" \
  /backups/mongodb-20240101

# Redis Backup
redis-cli BGSAVE
```

### Automated Backups

```yaml
# Backup CronJob
apiVersion: batch/v1
kind: CronJob
metadata:
  name: durchex-backup
  namespace: durchex
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: backup
              image: mongodb:latest
              command: ["/bin/sh"]
              args:
                - -c
                - mongodump --uri="$MONGODB_URI" --out=/backups/$(date +%Y%m%d)
          restartPolicy: OnFailure
```

## Quick Start Commands

```bash
# Development
npm run dev

# Build
npm run build

# Production Start
npm run start

# Docker Development
docker-compose up -d

# Kubernetes Deployment
kubectl apply -f k8s/

# Run Tests
npm run test

# Linting
npm run lint

# View Logs
docker-compose logs -f backend

# Health Check
curl http://localhost:3000/api/health
```

## Troubleshooting

### Common Issues

**MongoDB Connection Error**
```bash
# Check MongoDB status
docker-compose ps mongodb
# Logs
docker-compose logs mongodb
# Restart
docker-compose restart mongodb
```

**High Memory Usage**
```bash
# Check resource usage
docker stats durchex_backend

# Increase memory limit in docker-compose.yml
# memory: 2gb
```

**Backend Crash**
```bash
# View logs
docker-compose logs --tail=100 backend
# Restart service
docker-compose restart backend
```

## Support & Documentation

- **Documentation**: https://docs.durchex.com
- **API Reference**: https://api.durchex.com/docs
- **GitHub Issues**: https://github.com/durchex/marketplace/issues
- **Discord**: https://discord.gg/durchex

---

Last Updated: January 2024
Version: 1.0.0
