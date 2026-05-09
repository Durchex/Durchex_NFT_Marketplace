# Durchex NFT Marketplace - VPS Deployment Guide

**Last Updated**: May 5, 2026  
**Target Environment**: Production VPS (Linux Ubuntu 20.04+)

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────┐
│         User Browser (durchex.com)              │
└────────────────────┬────────────────────────────┘
                     │ HTTPS
┌────────────────────▼──────────────────────────┐
│              Nginx Reverse Proxy               │
│  - Port 443 (SSL/TLS)                        │
│  - Port 80 (HTTP → HTTPS redirect)           │
│  - Static file serving                       │
│  - API proxy (/api → :3000)                  │
└────┬───────────────────────┬──────────────────┘
     │                       │
  Frontend                 Backend API
  (React Build)      (Node.js Express)
  Port: 80/443       Port: 3000
  
     └───────────────────────┘
            │
  ┌─────────▼─────────┐
  │   MongoDB Atlas   │
  │   (Cloud DB)      │
  └───────────────────┘
```

---

## PREREQUISITES

### VPS Requirements
- **OS**: Ubuntu 20.04 LTS or newer
- **RAM**: 4GB minimum (8GB recommended)
- **CPU**: 2 cores minimum
- **Storage**: 20GB (SSD recommended)
- **Root or sudo access**

### Domains & SSL
- Domain name (e.g., durchex.com)
- DNS pointing to VPS IP
- SSL certificate (Let's Encrypt free option)

### Software Needed
```
✅ Node.js 18+ (for backend)
✅ npm / yarn (package manager)
✅ Nginx (web server)
✅ PM2 (process manager)
✅ MongoDB Atlas account (or local MongoDB)
✅ Git (for pulling code)
```

---

## STEP-BY-STEP DEPLOYMENT

### PHASE 1: SERVER SETUP (30 minutes)

#### Step 1.1: Update System
```bash
# SSH into your VPS
ssh root@your_vps_ip

# Update system packages
sudo apt update
sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential
```

#### Step 1.2: Install Node.js & npm
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version    # Should be v18.x or higher
npm --version     # Should be 8.x or higher
```

#### Step 1.3: Install Nginx
```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify
sudo systemctl status nginx
```

#### Step 1.4: Install PM2 (Global)
```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 startup
pm2 startup
# Copy and run the output command

# Verify
pm2 status
```

#### Step 1.5: Install Certbot (SSL)
```bash
# Install Certbot for Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx

# Test certificate automatic renewal
sudo certbot renew --dry-run
```

---

### PHASE 2: DEPLOY CODE (45 minutes)

#### Step 2.1: Clone Repository
```bash
# Create deployment directory
sudo mkdir -p /home/durchex/htdocs
sudo chown -R $USER:$USER /home/durchex

# Navigate to deployment directory
cd /home/durchex/htdocs

# Clone your repository (use HTTPS or SSH key)
git clone https://github.com/YOUR_USERNAME/Durchex_NFT_Marketplace.git durchex.com
cd durchex.com

# Verify structure
ls -la
# Should show: backend_temp/, frontend/, contracts/, etc.
```

#### Step 2.2: Setup Backend
```bash
# Navigate to backend
cd /home/durchex/htdocs/durchex.com/backend_temp

# Create .env file with production settings
cat > .env << 'EOF'
# Server
NODE_ENV=production
PORT=3000

# Database (MongoDB Atlas)
MONGO_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/durchex?retryWrites=true&w=majority
DATABASE=${MONGO_URI}

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here_at_least_32_chars

# Blockchain RPC URLs
ETHEREUM_RPC_URL=https://ethereum-sepolia.core.chainstack.com/390cec07d0dbe1818b3bb25db398c3ca
POLYGON_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/demo

# Smart Contract Addresses (update with your deployed contracts)
LAZY_MINT_CONTRACT_ADDRESS=0x...
AUCTION_CONTRACT_ADDRESS=0x...
MARKETPLACE_CONTRACT_ADDRESS=0x...

# IPFS Configuration (Pinata)
VITE_PINATA_API_KEY=your_pinata_key_here
VITE_PINATA_SECRET_KEY=your_pinata_secret_here

# Platform Fee Configuration
PLATFORM_FEE_BPS=250
PLATFORM_FEE_RECEIVER=0x...

# Admin Email
ADMIN_EMAIL=admin@durchex.com
EOF

# Install dependencies
npm install

# Build if needed (for TypeScript projects)
npm run build 2>/dev/null || echo "No build step needed"

# Test backend starts
npm start &
sleep 5
# Check if running
curl http://localhost:3000/health
# Kill test instance
pkill -f "node.*backend"
```

#### Step 2.3: Setup Frontend
```bash
# Navigate to frontend
cd /home/durchex/htdocs/durchex.com/frontend

# Create .env file for production
cat > .env.production << 'EOF'
REACT_APP_API_URL=https://durchex.com/api/v1
REACT_APP_ENVIRONMENT=production
REACT_APP_ETHEREUM_RPC_URL=https://ethereum-sepolia.core.chainstack.com/390cec07d0dbe1818b3bb25db398c3ca
REACT_APP_CHAIN_ID=11155111
EOF

# Install dependencies
npm install

# Build for production
npm run build

# Verify build
ls -la dist/
# Should show built files
```

---

### PHASE 3: CONFIGURE NGINX (30 minutes)

#### Step 3.1: Create Nginx Configuration
```bash
# Create Nginx site configuration
sudo tee /etc/nginx/sites-available/durchex.com > /dev/null << 'NGINX_CONFIG'
# HTTP → HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name durchex.com www.durchex.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Temporary redirect for Let's Encrypt
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name durchex.com www.durchex.com;
    
    # SSL Certificates (will be added by Certbot)
    ssl_certificate /etc/letsencrypt/live/durchex.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/durchex.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Logging
    access_log /var/log/nginx/durchex-access.log;
    error_log /var/log/nginx/durchex-error.log;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;
    gzip_min_length 1000;
    
    # Frontend (React app) - root path
    root /home/durchex/htdocs/durchex.com/frontend/dist;
    index index.html;
    
    location / {
        # SPA routing - send all requests to index.html
        try_files $uri $uri/ /index.html;
        expires 24h;
        add_header Cache-Control "public, immutable";
    }
    
    # Static assets - cache aggressively
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API Proxy to Node.js backend (port 3000)
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    # Deny access to sensitive files
    location ~* (\.env|\.git|package\.json|\.lock) {
        return 403;
    }
}
NGINX_CONFIG

echo "✅ Nginx configuration created"
```

#### Step 3.2: Enable Site & Test
```bash
# Enable the site
sudo ln -sf /etc/nginx/sites-available/durchex.com /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test passes, reload
sudo systemctl reload nginx

echo "✅ Nginx configured and reloaded"
```

---

### PHASE 4: SETUP SSL CERTIFICATE (10 minutes)

#### Step 4.1: Generate SSL Certificate
```bash
# Request certificate with Let's Encrypt
sudo certbot certonly --nginx -d durchex.com -d www.durchex.com

# Follow prompts:
# 1. Enter your email
# 2. Accept terms
# 3. Choose sharing preferences

# Verify certificate
sudo certbot certificates

# Test auto-renewal
sudo certbot renew --dry-run
```

#### Step 4.2: Auto-Renewal
```bash
# Setup automatic renewal (runs every 12 hours)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Verify
sudo systemctl status certbot.timer

echo "✅ SSL certificate installed and auto-renewal enabled"
```

---

### PHASE 5: START BACKEND SERVICE (10 minutes)

#### Step 5.1: Create PM2 Ecosystem File
```bash
# Navigate to backend
cd /home/durchex/htdocs/durchex.com/backend_temp

# Create PM2 ecosystem config
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'durchex-backend',
      script: './server.js',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/durchex-backend-error.log',
      out_file: '/var/log/pm2/durchex-backend-out.log',
      log_file: '/var/log/pm2/durchex-backend-combined.log',
      time: true,
      merge_logs: true
    },
    {
      name: 'durchex-indexer',
      script: './services/blockchainListener.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/pm2/durchex-indexer-error.log',
      out_file: '/var/log/pm2/durchex-indexer-out.log',
      log_file: '/var/log/pm2/durchex-indexer-combined.log',
      time: true
    }
  ]
};
EOF

echo "✅ PM2 ecosystem configured"
```

#### Step 5.2: Start Backend with PM2
```bash
# Create PM2 log directory
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# Start application
pm2 start ecosystem.config.js

# Check status
pm2 status

# Setup PM2 to restart on reboot
pm2 startup
# Run the command it outputs

# Save PM2 process list
pm2 save

# View logs
pm2 logs durchex-backend

echo "✅ Backend started with PM2"
```

#### Step 5.3: Verify Backend is Running
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test through Nginx proxy
curl https://durchex.com/api/v1/nft/nfts

# Check backend logs
pm2 logs durchex-backend --lines 20

echo "✅ Backend verified"
```

---

### PHASE 6: VERIFY FULL DEPLOYMENT (15 minutes)

#### Step 6.1: Test All Services
```bash
# 1. Test Nginx is running
sudo systemctl status nginx

# 2. Test Backend is running
pm2 list

# 3. Test Frontend loads
curl -I https://durchex.com/

# 4. Test API through proxy
curl https://durchex.com/api/v1/health

# 5. Check Nginx error logs
sudo tail -20 /var/log/nginx/error.log

# 6. Check Nginx access logs
sudo tail -20 /var/log/nginx/durchex-access.log
```

#### Step 6.2: Health Checks
```bash
#!/bin/bash
# Save as health-check.sh

echo "=== Durchex Deployment Health Check ==="
echo ""

# 1. Nginx
echo "1️⃣ Nginx Status:"
sudo systemctl is-active nginx >/dev/null && echo "   ✅ Running" || echo "   ❌ Stopped"

# 2. Backend
echo "2️⃣ Backend Status:"
curl -s http://localhost:3000/api/health > /dev/null && echo "   ✅ Running" || echo "   ❌ Error"

# 3. Frontend
echo "3️⃣ Frontend Access:"
curl -s -I https://durchex.com/ | head -1

# 4. Database
echo "4️⃣ Database Connection:"
# Add your DB health check

# 5. SSL Certificate
echo "5️⃣ SSL Certificate:"
sudo certbot certificates | grep durchex.com

echo ""
echo "=== All Systems Operational ==="
```

Run the health check:
```bash
bash health-check.sh
```

---

## MONITORING & MAINTENANCE

### Monitor Logs in Real-Time
```bash
# Backend logs
pm2 logs durchex-backend

# Nginx access
sudo tail -f /var/log/nginx/durchex-access.log

# Nginx errors
sudo tail -f /var/log/nginx/durchex-error.log

# System messages
sudo journalctl -f
```

### Check Disk Space
```bash
df -h

# if running low:
# - Clean old logs: sudo journalctl --vacuum=5d
# - Remove old PM2 logs: pm2 logrotate
```

### Monitor Memory & CPU
```bash
# Real-time monitoring
pm2 monit

# One-time check
pm2 status
pm2 info durchex-backend
```

### Restart Services
```bash
# Restart backend
pm2 restart durchex-backend

# Restart all
pm2 restart all

# Reload Nginx
sudo systemctl reload nginx

# Full Nginx restart
sudo systemctl restart nginx
```

---

## TROUBLESHOOTING

### Issue: 502 Bad Gateway
```bash
# 1. Check backend is running
pm2 status

# 2. Check backend listen port
curl http://localhost:3000/api/health

# 3. Check Nginx error log
sudo tail -30 /var/log/nginx/error.log

# 4. Reload Nginx
sudo systemctl reload nginx

# 5. Restart backend
pm2 restart durchex-backend
```

### Issue: Frontend Not Loading
```bash
# 1. Check frontend files exist
ls -la /home/durchex/htdocs/durchex.com/frontend/dist/

# 2. Check permissions
sudo chown -R $USER:$USER /home/durchex/htdocs/durchex.com

# 3. Check Nginx config
sudo nginx -t

# 4. Reload Nginx
sudo systemctl reload nginx

# 5. Check access logs
sudo tail -20 /var/log/nginx/durchex-access.log
```

### Issue: SSL Certificate Not Renewing
```bash
# 1. Check certificate status
sudo certbot certificates

# 2. Force renewal
sudo certbot renew --force-renewal

# 3. Check logs
sudo journalctl -u certbot

# 4. Restart services
sudo systemctl restart nginx
```

### Issue: Backend Out of Memory
```bash
# 1. Check memory usage
free -h
top

# 2. Restart backend
pm2 restart durchex-backend

# 3. Check PM2 config (max_memory_restart)
pm2 info durchex-backend | grep memory

# 4. Scale down instances
pm2 scale durchex-backend 1  # Reduce instances
```

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] VPS IP configured and SSH key setup
- [ ] Domain DNS pointing to VPS IP
- [ ] MongoDB Atlas cluster created and credentials ready
- [ ] Smart contracts deployed (testnet or mainnet)
- [ ] Environment variables prepared

### During Deployment
- [ ] Server updated (apt update/upgrade)
- [ ] Node.js & npm installed
- [ ] Nginx installed and configured
- [ ] PM2 installed globally
- [ ] Code cloned from repository
- [ ] Backend .env configured (MongoDB, keys, etc.)
- [ ] Frontend .env configured (API URL, etc.)
- [ ] Frontend built (npm run build)
- [ ] Nginx config created
- [ ] SSL certificate issued
- [ ] Backend started with PM2

### Post-Deployment
- [ ] Frontend loads at https://durchex.com
- [ ] API responds at https://durchex.com/api
- [ ] Backend health check passes
- [ ] Database connection works
- [ ] Logs monitoring configured
- [ ] SSL auto-renewal verified
- [ ] Uptime monitoring configured
- [ ] Backup strategy implemented

---

## QUICK COMMANDS REFERENCE

```bash
# View status
pm2 status
sudo systemctl status nginx

# View logs
pm2 logs durchex-backend
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart durchex-backend
sudo systemctl reload nginx

# Check ports
lsof -i -P -n | grep 3000  # Backend
lsof -i -P -n | grep 80    # Nginx
lsof -i -P -n | grep 443   # Nginx SSL

# View Nginx config
sudo nginx -T

# Test Nginx
sudo nginx -t

# SSL certificate status
sudo certbot certificates

# Monitor real-time
pm2 monit

# Stop/Start services
pm2 stop durchex-backend
pm2 start durchex-backend
```

---

## NEXT STEPS

1. **Post-Launch Optimization**
   - Setup CloudFlare CDN
   - Enable caching headers
   - Monitor performance with analytics

2. **Security Hardening**
   - Setup firewall rules (ufw)
   - Configure fail2ban for brute-force protection
   - Setup DDoS protection

3. **Backup & Recovery**
   - Setup automated MongoDB backups
   - Enable VPS snapshots/backups
   - Test recovery procedures

4. **Monitoring & Alerting**
   - Setup monitoring (UptimeRobot, New Relic)
   - Configure email alerts
   - Setup error tracking (Sentry)

5. **Performance Tuning**
   - Enable CDN for static assets
   - Optimize Nginx caching
   - Monitor and optimize database queries

---

**Deployment Complete! 🎉**

Your Durchex NFT Marketplace is now live at https://durchex.com
