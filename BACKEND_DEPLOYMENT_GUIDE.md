# Backend Deployment Guide

## Overview

This guide covers deploying the Durchex NFT Marketplace backend to production using Docker, AWS ECS, CI/CD pipelines, and automated monitoring.

## Prerequisites

- Docker and Docker Compose installed
- AWS Account with ECR, ECS, RDS, ElastiCache access
- GitHub repository with Actions enabled
- Terraform or CloudFormation for IaC (optional)
- kubectl for Kubernetes (if using EKS alternative)

## Local Development with Docker Compose

### Quick Start

```bash
# Clone repository
git clone <repo-url>
cd durchex-nft-marketplace

# Create environment file
cp .env.example .env.local

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down -v  # Remove volumes
```

### Environment Variables

```env
# MongoDB
MONGO_USER=admin
MONGO_PASSWORD=secure_password_here
MONGO_DB=durchex

# Redis
REDIS_PASSWORD=redis_secure_password

# Backend
NODE_ENV=production
PORT=5000
JWT_SECRET=your_jwt_secret
LOG_LEVEL=info

# Blockchain
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
PRIVATE_KEY=0x...
CONTRACT_ADDRESSES={"lazyMint":"0x...","auction":"0x..."}

# External APIs
SENDGRID_API_KEY=SG.xxx
ETHERSCAN_API_KEY=xxx
SENTRY_DSN=https://xxx@sentry.io/xxx

# CORS
CORS_ORIGIN=http://localhost:3000,https://durchex.com
```

## Docker Image Building

### Build Docker Image

```bash
# Build with tag
docker build -t durchex-backend:latest .
docker build -t durchex-backend:1.0.0 .

# Build with specific build args
docker build \
  --build-arg NODE_ENV=production \
  --build-arg VERSION=1.0.0 \
  -t durchex-backend:1.0.0 .

# Multi-stage build reduces final image size to ~150MB
```

### Test Docker Image Locally

```bash
# Run container
docker run -d \
  -p 5000:5000 \
  -e NODE_ENV=development \
  -e MONGO_URI=mongodb://localhost:27017/durchex \
  -e REDIS_URL=redis://localhost:6379 \
  --name durchex-backend \
  durchex-backend:latest

# Test endpoint
curl http://localhost:5000/health

# View logs
docker logs durchex-backend

# Stop container
docker stop durchex-backend
docker rm durchex-backend
```

## AWS Deployment

### 1. Setup AWS Infrastructure

```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name durchex-backend \
  --region us-east-1

# Get login token
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Tag and push image
docker tag durchex-backend:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/durchex-backend:latest

docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/durchex-backend:latest
```

### 2. Create ECS Cluster

```bash
# Create cluster
aws ecs create-cluster \
  --cluster-name durchex-production \
  --capacity-providers FARGATE FARGATE_SPOT

# Create CloudWatch log group
aws logs create-log-group \
  --log-group-name /ecs/durchex-backend
```

### 3. Create RDS Database

```bash
# MongoDB Atlas (recommended for managed service)
# Or AWS DocumentDB

aws docdb create-db-cluster \
  --db-cluster-identifier durchex-docdb \
  --engine docdb \
  --master-username admin \
  --master-user-password SecurePassword123! \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00"

# Create instance
aws docdb create-db-instance \
  --db-instance-identifier durchex-docdb-instance \
  --db-cluster-identifier durchex-docdb \
  --db-instance-class db.r5.large
```

### 4. Create ElastiCache (Redis)

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id durchex-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --port 6379 \
  --engine-version 7.0

# Enable encryption and auth
aws elasticache modify-cache-cluster \
  --cache-cluster-id durchex-redis \
  --auth-token YourSecureTokenHere \
  --auth-token-enabled
```

### 5. Register Task Definition

```bash
# Update ecs-task-definition.json with your account ID and image URI
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition.json
```

### 6. Create ECS Service

```bash
aws ecs create-service \
  --cluster durchex-production \
  --service-name durchex-backend-service \
  --task-definition durchex-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx,subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=backend,containerPort=5000 \
  --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100"
```

## CI/CD Pipeline Setup

### GitHub Actions Setup

1. **Create AWS IAM Role for GitHub**

```bash
# Create trust policy
cat > trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_ORG/Durchex_NFT_Marketplace:*"
        }
      }
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name github-actions-role \
  --assume-role-policy-document file://trust-policy.json

# Attach policy for ECR and ECS
aws iam attach-role-policy \
  --role-name github-actions-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser

aws iam attach-role-policy \
  --role-name github-actions-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceTaskRolePolicy
```

2. **Add GitHub Secrets**

```
AWS_ACCOUNT_ID: YOUR_ACCOUNT_ID
SLACK_WEBHOOK_URL: https://hooks.slack.com/services/...
```

3. **Workflow Triggers**

- Push to main: Deploy to production
- Push to develop: Deploy to staging
- Pull requests: Run tests only

## Monitoring & Logging

### CloudWatch Setup

```bash
# Create dashboard
aws cloudwatch put-dashboard \
  --dashboard-name durchex-backend \
  --dashboard-body file://monitoring/dashboard.json

# Create alarms
aws cloudwatch put-metric-alarm \
  --alarm-name durchex-backend-high-cpu \
  --alarm-description "Alert when CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

### Application Performance Monitoring

```bash
# Integrate Sentry for error tracking
npm install @sentry/node

# Initialize in server.js
const Sentry = require("@sentry/node");
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

## Database Backup & Recovery

### Automated Backups

```bash
# Create backup
bash scripts/backup-mongo.sh

# List backups
aws s3 ls s3://durchex-backups/mongo/

# Restore from backup
bash scripts/restore-mongo.sh /backups/mongo/durchex_20240115_120000.tar.gz
```

### Schedule with Cron

```
# Backup daily at 2 AM UTC
0 2 * * * cd /app && bash scripts/backup-mongo.sh >> /var/log/durchex-backup.log 2>&1
```

## Scaling Configuration

### Auto-Scaling Policy

```bash
# Create auto-scaling target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/durchex-production/durchex-backend-service \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy (CPU > 70%)
aws application-autoscaling put-scaling-policy \
  --policy-name scale-up-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/durchex-production/durchex-backend-service \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

## Security Checklist

- [ ] Secrets stored in AWS Secrets Manager (not .env files)
- [ ] IAM roles follow least-privilege principle
- [ ] VPC configured with public/private subnets
- [ ] Security groups restrict inbound to necessary ports
- [ ] RDS encryption at rest enabled
- [ ] Redis AUTH token configured
- [ ] Container images scanned for vulnerabilities
- [ ] CORS origins whitelisted
- [ ] Rate limiting enabled
- [ ] HTTPS/TLS enforced
- [ ] WAF rules configured in front of ALB
- [ ] CloudTrail logging enabled

## Rollback Procedure

```bash
# If deployment fails, rollback to previous task definition
aws ecs update-service \
  --cluster durchex-production \
  --service durchex-backend-service \
  --task-definition durchex-backend:2  # Previous version

# Monitor rollback
aws ecs describe-services \
  --cluster durchex-production \
  --services durchex-backend-service
```

## Production Readiness Checklist

- [ ] Load testing completed (>1000 RPS)
- [ ] Database backups verified and restorable
- [ ] Monitoring and alerts configured
- [ ] Error tracking (Sentry) functional
- [ ] Security audit passed
- [ ] Performance profiling completed
- [ ] Rate limiting tested
- [ ] CORS and authentication verified
- [ ] Graceful shutdown implemented
- [ ] Health check endpoints tested
- [ ] Log aggregation functional
- [ ] Incident response plan documented

## Support & Troubleshooting

For common issues and support, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
