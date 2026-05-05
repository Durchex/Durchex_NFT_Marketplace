#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# DURCHEX NFT MARKETPLACE - VPS DEPLOYMENT (Customized)
# ═══════════════════════════════════════════════════════════════════════════════
# VPS: 187.77.101.218
# Domain: durchex.com
# 
# Usage: 
#   1. SSH into VPS: ssh root@187.77.101.218
#   2. Run this script: sudo bash vps-deploy-production.sh
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# Configuration
VPS_IP="187.77.101.218"
DOMAIN="durchex.com"
GITHUB_REPO="https://github.com/YOUR_USERNAME/Durchex_NFT_Marketplace.git"
DEPLOYMENT_PATH="/home/durchex/htdocs"
DEPLOYMENT_SITE="$DEPLOYMENT_PATH/durchex.com"
BACKEND_PORT=3000

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║$1${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${CYAN}→ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "This script must be run as root"
    echo "Usage: sudo bash vps-deploy-production.sh"
    exit 1
fi

print_header "   DURCHEX NFT MARKETPLACE - PRODUCTION VPS DEPLOYMENT"

echo -e "${CYAN}Configuration:${NC}"
echo "  VPS IP:          $VPS_IP"
echo "  Domain:          $DOMAIN"
echo "  Deploy Path:     $DEPLOYMENT_SITE"
echo "  Backend Port:    $BACKEND_PORT"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 1: System Preparation
# ═══════════════════════════════════════════════════════════════════════════════

print_header "   PHASE 1: SYSTEM PREPARATION"

print_step "Checking system information..."
uname -a
echo ""

print_step "Updating system packages..."
apt update > /dev/null 2>&1
apt upgrade -y > /dev/null 2>&1
print_success "System packages updated"

print_step "Installing essential tools..."
apt install -y curl wget git build-essential nano htop > /dev/null 2>&1
print_success "Essential tools installed"

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 2: Install Runtime & Tools
# ═══════════════════════════════════════════════════════════════════════════════

print_header "   PHASE 2: INSTALL RUNTIME & TOOLS"

# Node.js
print_step "Installing Node.js 18+..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - > /dev/null 2>&1
    apt install -y nodejs > /dev/null 2>&1
    print_success "Node.js $(node --version) installed"
else
    print_success "Node.js $(node --version) already installed"
fi

# Nginx
print_step "Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx > /dev/null 2>&1
    systemctl start nginx
    systemctl enable nginx
    print_success "Nginx installed and running"
else
    print_success "Nginx already installed"
    systemctl start nginx > /dev/null 2>&1
fi

# PM2
print_step "Installing PM2 globally..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2 > /dev/null 2>&1
    pm2 startup > /dev/null 2>&1
    print_success "PM2 installed"
else
    print_success "PM2 already installed"
fi

# Certbot (SSL)
print_step "Installing Certbot for SSL..."
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx > /dev/null 2>&1
    print_success "Certbot installed"
else
    print_success "Certbot already installed"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 3: Clone Repository
# ═══════════════════════════════════════════════════════════════════════════════

print_header "   PHASE 3: CLONE REPOSITORY"

print_step "Creating deployment directory..."
mkdir -p $DEPLOYMENT_PATH
print_success "Directory created: $DEPLOYMENT_PATH"

print_step "Cloning repository from GitHub..."
cd $DEPLOYMENT_PATH

if [ ! -d "$DEPLOYMENT_SITE" ]; then
    git clone $GITHUB_REPO durchex.com > /dev/null 2>&1
    print_success "Repository cloned"
else
    print_warning "Directory already exists, pulling latest changes..."
    cd $DEPLOYMENT_SITE
    git pull > /dev/null 2>&1
    print_success "Repository updated"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 4: Setup Backend
# ═══════════════════════════════════════════════════════════════════════════════

print_header "   PHASE 4: SETUP BACKEND"

cd $DEPLOYMENT_SITE/backend_temp

print_step "Installing backend dependencies..."
npm install > /dev/null 2>&1
print_success "Backend dependencies installed"

# Check for .env
if [ ! -f ".env" ]; then
    print_warning "Creating default .env file - EDIT THIS WITH YOUR CREDENTIALS"
    
    cat > .env << 'EOF'
# ═══════════════════════════════════════════════════════════════════════════════
# DURCHEX BACKEND PRODUCTION CONFIGURATION
# EDIT THIS FILE WITH YOUR REAL CREDENTIALS
# ═══════════════════════════════════════════════════════════════════════════════

# Server Environment
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database Connection
MONGO_URI=mongodb+srv://YOUR_MONGODB_USERNAME:YOUR_PASSWORD@your-cluster.mongodb.net/durchex?retryWrites=true&w=majority
DATABASE=${MONGO_URI}

# JWT Authentication
JWT_SECRET=GENERATE_A_STRONG_SECRET_AT_LEAST_32_CHARACTERS_LONG_HERE

# Blockchain RPC URLs
ETHEREUM_RPC_URL=https://ethereum-sepolia.core.chainstack.com/390cec07d0dbe1818b3bb25db398c3ca
POLYGON_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/demo

# Smart Contract Addresses (UPDATE WITH YOUR DEPLOYED CONTRACTS)
LAZY_MINT_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
AUCTION_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
MARKETPLACE_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# IPFS Configuration (Pinata)
VITE_PINATA_API_KEY=YOUR_PINATA_API_KEY
VITE_PINATA_SECRET_KEY=YOUR_PINATA_SECRET_KEY

# Platform Configuration
PLATFORM_FEE_BPS=250
PLATFORM_FEE_RECEIVER=0x0000000000000000000000000000000000000000

# Admin Settings
ADMIN_EMAIL=admin@durchex.com

# ═══════════════════════════════════════════════════════════════════════════════
# END OF CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════
EOF
    
    print_warning "Created: $DEPLOYMENT_SITE/backend_temp/.env"
    print_error "ACTION REQUIRED: Edit the .env file with your credentials!"
    echo ""
    echo "Run: nano $DEPLOYMENT_SITE/backend_temp/.env"
    echo ""
else
    print_success "Using existing .env file"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 5: Setup Frontend
# ═══════════════════════════════════════════════════════════════════════════════

print_header "   PHASE 5: SETUP FRONTEND"

cd $DEPLOYMENT_SITE/frontend

print_step "Installing frontend dependencies..."
npm install > /dev/null 2>&1
print_success "Frontend dependencies installed"

print_step "Building frontend for production..."
npm run build > /dev/null 2>&1
print_success "Frontend build completed"

# Verify build
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    DIST_SIZE=$(du -sh dist/ | cut -f1)
    print_success "Frontend build verified ($DIST_SIZE)"
else
    print_error "Frontend build verification failed"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 6: Configure Nginx
# ═══════════════════════════════════════════════════════════════════════════════

print_header "   PHASE 6: CONFIGURE NGINX"

print_step "Creating Nginx configuration..."

cat > /etc/nginx/sites-available/durchex.com << 'NGINX_CONFIG'
# ═══════════════════════════════════════════════════════════════════════════════
# DURCHEX NFT MARKETPLACE - NGINX CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

# HTTP Server - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name durchex.com www.durchex.com;
    
    # Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name durchex.com www.durchex.com;
    
    # SSL Certificates (Let's Encrypt)
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
    
    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;
    gzip_min_length 1000;
    gzip_vary on;
    
    # Frontend Root
    root /home/durchex/htdocs/durchex.com/frontend/dist;
    index index.html;
    
    # ─────────────────────────────────────────────────────────────────────────────
    # Frontend Routing
    # ─────────────────────────────────────────────────────────────────────────────
    location / {
        # SPA routing - serve index.html for all routes
        try_files $uri $uri/ /index.html;
        
        # Caching
        expires 24h;
        add_header Cache-Control "public, must-revalidate";
    }
    
    # ─────────────────────────────────────────────────────────────────────────────
    # Static Assets (aggressive caching)
    # ─────────────────────────────────────────────────────────────────────────────
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # ─────────────────────────────────────────────────────────────────────────────
    # API Proxy to Node.js Backend
    # ─────────────────────────────────────────────────────────────────────────────
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
        proxy_set_header X-Forwarded-Host $server_name;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    # ─────────────────────────────────────────────────────────────────────────────
    # Block Sensitive Files
    # ─────────────────────────────────────────────────────────────────────────────
    location ~* (\.env|\.git|package\.json|\.lock) {
        return 403;
    }
    
    # ─────────────────────────────────────────────────────────────────────────────
    # Client Error Pages
    # ─────────────────────────────────────────────────────────────────────────────
    error_page 404 /index.html;
}

# ═══════════════════════════════════════════════════════════════════════════════
# END OF NGINX CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════
NGINX_CONFIG

print_success "Nginx configuration created"

print_step "Enabling Nginx site..."
ln -sf /etc/nginx/sites-available/durchex.com /etc/nginx/sites-enabled/durchex.com
rm -f /etc/nginx/sites-enabled/default > /dev/null 2>&1
print_success "Nginx site enabled"

print_step "Testing Nginx configuration..."
if nginx -t 2>/dev/null | grep -q "successful"; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration has errors"
    nginx -t
    exit 1
fi

print_step "Reloading Nginx..."
systemctl reload nginx > /dev/null 2>&1
print_success "Nginx reloaded"

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 7: SSL Certificate
# ═══════════════════════════════════════════════════════════════════════════════

print_header "   PHASE 7: SSL CERTIFICATE (Let's Encrypt)"

if [ ! -f "/etc/letsencrypt/live/durchex.com/fullchain.pem" ]; then
    print_step "Requesting SSL certificate from Let's Encrypt..."
    print_warning "You will be prompted for an email address"
    echo ""
    
    certbot certonly --nginx -d durchex.com -d www.durchex.com
    
    if [ -f "/etc/letsencrypt/live/durchex.com/fullchain.pem" ]; then
        print_success "SSL certificate issued"
        
        systemctl reload nginx > /dev/null 2>&1
        print_success "Nginx reloaded with SSL"
    else
        print_error "SSL certificate issuance failed"
        exit 1
    fi
else
    print_success "SSL certificate already installed"
    systemctl reload nginx > /dev/null 2>&1
    print_success "Nginx reloaded"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 8: PM2 Setup
# ═══════════════════════════════════════════════════════════════════════════════

print_header "   PHASE 8: PM2 PROCESS MANAGER"

cd $DEPLOYMENT_SITE/backend_temp

print_step "Creating PM2 ecosystem configuration..."

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
      merge_logs: true,
      watch: false,
      ignore_watch: ['node_modules', 'dist', 'logs']
    }
  ]
};
EOF

print_success "PM2 ecosystem configuration created"

print_step "Creating PM2 log directory..."
mkdir -p /var/log/pm2
chmod 777 /var/log/pm2
print_success "Log directory created"

print_step "Starting backend with PM2..."
pm2 start ecosystem.config.js > /dev/null 2>&1
pm2 save > /dev/null 2>&1
print_success "Backend started with PM2"

print_step "Setting up PM2 startup script..."
pm2 startup > /dev/null 2>&1
print_success "PM2 startup configured"

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 9: Verification
# ═══════════════════════════════════════════════════════════════════════════════

print_header "   PHASE 9: SYSTEM VERIFICATION"

sleep 3

print_step "Checking system services..."
echo ""

# Nginx
if systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_error "Nginx is NOT running"
fi

# PM2
if pm2 list | grep -q "durchex-backend"; then
    print_success "Backend (PM2) is running"
else
    print_error "Backend (PM2) is NOT running"
    pm2 logs durchex-backend --lines 5
fi

# Backend health
echo -n "  Backend health: "
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    print_success "OK"
else
    print_warning "Cannot reach backend (DB may not be connected)"
fi

# Frontend
echo -n "  Frontend build: "
if [ -f "$DEPLOYMENT_SITE/frontend/dist/index.html" ]; then
    print_success "OK"
else
    print_error "Frontend build not found"
fi

# SSL Certificate
echo -n "  SSL Certificate: "
if [ -f "/etc/letsencrypt/live/durchex.com/fullchain.pem" ]; then
    CERT_EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/durchex.com/fullchain.pem | cut -d= -f2)
    echo -e "${GREEN}OK${NC} (expires: $CERT_EXPIRY)"
else
    print_warning "Certificate not found"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# COMPLETION
# ═══════════════════════════════════════════════════════════════════════════════

print_header "   ✅ DEPLOYMENT COMPLETE!"

echo -e "${CYAN}Your Durchex Marketplace is deployed!${NC}"
echo ""
echo -e "${CYAN}URLs:${NC}"
echo "  Frontend: ${YELLOW}https://durchex.com${NC}"
echo "  API: ${YELLOW}https://durchex.com/api${NC}"
echo "  VPS: ${YELLOW}ssh root@187.77.101.218${NC}"
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo "  1. Edit backend configuration:"
echo "     ${YELLOW}nano /home/durchex/htdocs/durchex.com/backend_temp/.env${NC}"
echo ""
echo "  2. Update these critical values:"
echo "     - MONGO_URI (MongoDB Atlas credentials)"
echo "     - JWT_SECRET (generate strong secret)"
echo "     - Contract addresses"
echo "     - IPFS keys"
echo ""
echo "  3. Restart backend after editing .env:"
echo "     ${YELLOW}pm2 restart durchex-backend${NC}"
echo ""
echo "  4. Monitor the deployment:"
echo "     ${YELLOW}pm2 logs durchex-backend --lines 20${NC}"
echo ""
echo -e "${CYAN}Useful Commands:${NC}"
echo "  View status:        ${YELLOW}pm2 status${NC}"
echo "  View logs:          ${YELLOW}pm2 logs durchex-backend${NC}"
echo "  Monitor real-time:  ${YELLOW}pm2 monit${NC}"
echo "  Restart backend:    ${YELLOW}pm2 restart durchex-backend${NC}"
echo "  Reload Nginx:       ${YELLOW}sudo systemctl reload nginx${NC}"
echo "  View Nginx errors:  ${YELLOW}sudo tail -f /var/log/nginx/error.log${NC}"
echo ""
echo -e "${CYAN}Support Files on VPS:${NC}"
echo "  Configuration:      ${YELLOW}$DEPLOYMENT_SITE/backend_temp/.env${NC}"
echo "  Nginx config:       ${YELLOW}/etc/nginx/sites-available/durchex.com${NC}"
echo "  PM2 config:         ${YELLOW}$DEPLOYMENT_SITE/backend_temp/ecosystem.config.js${NC}"
echo "  Logs (Nginx):       ${YELLOW}/var/log/nginx/durchex-access.log${NC}"
echo "  Logs (Nginx errors):${YELLOW}/var/log/nginx/durchex-error.log${NC}"
echo "  Logs (Backend):     ${YELLOW}pm2 logs durchex-backend${NC}"
echo ""

print_header "   🎉 READY FOR PRODUCTION!"
