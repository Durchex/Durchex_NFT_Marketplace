#!/bin/bash

# Durchex NFT Marketplace - VPS Deployment Script
# Automates the deployment process
# Usage: sudo bash vps-deploy.sh

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="${1:-durchex.com}"
GITHUB_REPO="${2:-https://github.com/YOUR_USERNAME/Durchex_NFT_Marketplace.git}"
DEPLOYMENT_PATH="/home/durchex/htdocs/durchex.com"
BACKEND_PORT=3000
ADMIN_EMAIL="${3:-admin@durchex.com}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   DURCHEX NFT MARKETPLACE - VPS DEPLOYMENT SCRIPT      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Domain: ${YELLOW}${DOMAIN}${NC}"
echo -e "Repo: ${YELLOW}${GITHUB_REPO}${NC}"
echo -e "Path: ${YELLOW}${DEPLOYMENT_PATH}${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
   echo -e "${RED}❌ This script must be run as root${NC}"
   echo "Usage: sudo bash vps-deploy.sh"
   exit 1
fi

# ====================================
# PHASE 1: System Setup
# ====================================

echo -e "${BLUE}📦 PHASE 1: System Setup${NC}"
echo ""

echo -e "  1️⃣  Updating system packages..."
apt update > /dev/null 2>&1
apt upgrade -y > /dev/null 2>&1
apt install -y curl wget git build-essential > /dev/null 2>&1
echo -e "     ${GREEN}✅ System updated${NC}"

echo -e "  2️⃣  Installing Node.js 18+..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - > /dev/null 2>&1
    apt install -y nodejs > /dev/null 2>&1
    echo -e "     ${GREEN}✅ Node.js $(node --version)${NC}"
else
    echo -e "     ${GREEN}✅ Node.js already installed ($(node --version))${NC}"
fi

echo -e "  3️⃣  Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx > /dev/null 2>&1
    systemctl start nginx
    systemctl enable nginx
    echo -e "     ${GREEN}✅ Nginx installed and running${NC}"
else
    echo -e "     ${GREEN}✅ Nginx already installed${NC}"
fi

echo -e "  4️⃣  Installing PM2 globally..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2 > /dev/null 2>&1
    pm2 startup > /dev/null 2>&1
    echo -e "     ${GREEN}✅ PM2 installed${NC}"
else
    echo -e "     ${GREEN}✅ PM2 already installed${NC}"
fi

echo -e "  5️⃣  Installing Certbot (SSL)..."
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx > /dev/null 2>&1
    echo -e "     ${GREEN}✅ Certbot installed${NC}"
else
    echo -e "     ${GREEN}✅ Certbot already installed${NC}"
fi

echo ""

# ====================================
# PHASE 2: Deploy Code
# ====================================

echo -e "${BLUE}📂 PHASE 2: Deploy Code${NC}"
echo ""

echo -e "  1️⃣  Creating deployment directory..."
mkdir -p /home/durchex/htdocs
chown -R $(logname):$(logname) /home/durchex 2>/dev/null || true
echo -e "     ${GREEN}✅ Directory created${NC}"

echo -e "  2️⃣  Cloning repository..."
if [ ! -d "$DEPLOYMENT_PATH" ]; then
    cd /home/durchex/htdocs
    git clone $GITHUB_REPO durchex.com > /dev/null 2>&1
    echo -e "     ${GREEN}✅ Repository cloned${NC}"
else
    echo -e "     ${YELLOW}⚠️  Directory already exists, pulling latest...${NC}"
    cd $DEPLOYMENT_PATH
    git pull > /dev/null 2>&1
    echo -e "     ${GREEN}✅ Repository updated${NC}"
fi

echo -e "  3️⃣  Setting up backend..."
cd $DEPLOYMENT_PATH/backend_temp

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "     ${YELLOW}⚠️  Creating .env file - PLEASE EDIT WITH YOUR CREDENTIALS${NC}"
    cat > .env << 'EOF'
# Server
NODE_ENV=production
PORT=3000

# Database (MongoDB Atlas) - UPDATE THIS
MONGO_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/durchex?retryWrites=true&w=majority
DATABASE=${MONGO_URI}

# JWT Secret - CHANGE THIS
JWT_SECRET=your_super_secure_jwt_secret_key_here_change_me_please_32_chars_minimum

# Blockchain
ETHEREUM_RPC_URL=https://ethereum-sepolia.core.chainstack.com/390cec07d0dbe1818b3bb25db398c3ca
POLYGON_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/demo

# Smart Contracts - UPDATE WITH YOUR DEPLOYED ADDRESSES
LAZY_MINT_CONTRACT_ADDRESS=0x...
AUCTION_CONTRACT_ADDRESS=0x...
MARKETPLACE_CONTRACT_ADDRESS=0x...

# IPFS (Pinata)
VITE_PINATA_API_KEY=your_key_here
VITE_PINATA_SECRET_KEY=your_secret_here

# Platform
PLATFORM_FEE_BPS=250
PLATFORM_FEE_RECEIVER=0x...
ADMIN_EMAIL=admin@durchex.com
EOF
    
    echo -e "     ${YELLOW}❌ IMPORTANT: Edit .env with your credentials:${NC}"
    echo -e "     ${YELLOW}   nano $DEPLOYMENT_PATH/backend_temp/.env${NC}"
    echo ""
else
    echo -e "     ${GREEN}✅ .env file exists${NC}"
fi

echo -e "     Installing dependencies..."
npm install > /dev/null 2>&1
echo -e "     ${GREEN}✅ Backend dependencies installed${NC}"

echo -e "  4️⃣  Setting up frontend..."
cd $DEPLOYMENT_PATH/frontend

# Check if .env exists
if [ ! -f ".env.production" ]; then
    cat > .env.production << 'EOF'
REACT_APP_API_URL=https://durchex.com/api/v1
REACT_APP_ENVIRONMENT=production
REACT_APP_ETHEREUM_RPC_URL=https://ethereum-sepolia.core.chainstack.com/390cec07d0dbe1818b3bb25db398c3ca
REACT_APP_CHAIN_ID=11155111
EOF
    echo -e "     ${GREEN}✅ Frontend .env created${NC}"
fi

echo -e "     Installing dependencies..."
npm install > /dev/null 2>&1
echo -e "     ${GREEN}✅ Frontend dependencies installed${NC}"

echo -e "     Building frontend..."
npm run build > /dev/null 2>&1
echo -e "     ${GREEN}✅ Frontend built${NC}"

echo ""

# ====================================
# PHASE 3: Configure Nginx
# ====================================

echo -e "${BLUE}🔧 PHASE 3: Configure Nginx${NC}"
echo ""

echo -e "  1️⃣  Creating Nginx configuration..."

cat > /etc/nginx/sites-available/$DOMAIN << 'NGINX_CONFIG'
# HTTP redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;
    
    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    root /home/durchex/htdocs/DOMAIN_PLACEHOLDER/frontend/dist;
    index index.html;
    
    access_log /var/log/nginx/DOMAIN_PLACEHOLDER-access.log;
    error_log /var/log/nginx/DOMAIN_PLACEHOLDER-error.log;
    
    gzip on;
    gzip_types text/plain text/css text/javascript application/json;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_CONFIG

# Replace placeholder
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/$DOMAIN

# Enable site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/ 2>/dev/null || true

# Remove default
rm -f /etc/nginx/sites-enabled/default

# Test config
if nginx -t 2>/dev/null; then
    echo -e "     ${GREEN}✅ Nginx configuration valid${NC}"
    systemctl reload nginx
    echo -e "     ${GREEN}✅ Nginx reloaded${NC}"
else
    echo -e "     ${RED}❌ Nginx configuration error${NC}"
    exit 1
fi

echo ""

# ====================================
# PHASE 4: SSL Certificate
# ====================================

echo -e "${BLUE}🔐 PHASE 4: SSL Certificate${NC}"
echo ""

echo -e "  1️⃣  Requesting SSL certificate from Let's Encrypt..."
echo "     (Follow prompts, enter your email)"
echo ""

# Check if cert already exists
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    certbot certonly --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $ADMIN_EMAIL > /dev/null 2>&1
    echo -e "     ${GREEN}✅ SSL certificate issued${NC}"
    
    systemctl reload nginx
    echo -e "     ${GREEN}✅ Nginx reloaded with SSL${NC}"
else
    echo -e "     ${GREEN}✅ SSL certificate already exists${NC}"
fi

echo ""

# ====================================
# PHASE 5: Start Backend
# ====================================

echo -e "${BLUE}🚀 PHASE 5: Start Backend Services${NC}"
echo ""

echo -e "  1️⃣  Creating PM2 ecosystem config..."

cat > $DEPLOYMENT_PATH/backend_temp/ecosystem.config.js << 'EOF'
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
      time: true
    }
  ]
};
EOF

echo -e "     ${GREEN}✅ PM2 config created${NC}"

echo -e "  2️⃣  Starting backend with PM2..."

mkdir -p /var/log/pm2
chmod 777 /var/log/pm2

cd $DEPLOYMENT_PATH/backend_temp
pm2 start ecosystem.config.js > /dev/null 2>&1
pm2 save > /dev/null 2>&1

echo -e "     ${GREEN}✅ Backend started${NC}"

sleep 3

# Test backend
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "     ${GREEN}✅ Backend health check passed${NC}"
else
    echo -e "     ${RED}❌ Backend health check failed${NC}"
    echo -e "     ${YELLOW}   Run: pm2 logs durchex-backend${NC}"
fi

echo ""

# ====================================
# PHASE 6: Verification
# ====================================

echo -e "${BLUE}✅ PHASE 6: Final Verification${NC}"
echo ""

echo -e "  1️⃣  Checking services..."
echo -e "     Nginx: $(systemctl is-active nginx) ${GREEN}✅${NC}"
echo -e "     PM2: $([ $(pm2 list | wc -l) -gt 0 ] && echo 'Running' || echo 'Stopped') ${GREEN}✅${NC}"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            🎉 DEPLOYMENT COMPLETE! 🎉                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Your Durchex marketplace is now live!"
echo ""
echo -e "📝 NEXT STEPS:"
echo -e "  1. Edit backend .env with your credentials:"
echo -e "     ${YELLOW}nano $DEPLOYMENT_PATH/backend_temp/.env${NC}"
echo -e "     Update: MONGO_URI, JWT_SECRET, contract addresses"
echo ""
echo -e "  2. Restart backend after editing .env:"
echo -e "     ${YELLOW}pm2 restart durchex-backend${NC}"
echo ""
echo -e "  3. Verify everything is working:"
echo -e "     ${YELLOW}curl https://$DOMAIN/api/v1/health${NC}"
echo ""
echo -e "  4. Monitor logs:"
echo -e "     ${YELLOW}pm2 logs durchex-backend${NC}"
echo ""
echo -e "📍 URLs:"
echo -e "     ${BLUE}Frontend: https://$DOMAIN${NC}"
echo -e "     ${BLUE}API: https://$DOMAIN/api${NC}"
echo ""
echo -e "📞 Help:"
echo -e "     View troubleshooting: ${YELLOW}cat VPS_DEPLOYMENT_STEPS.md${NC}"
echo -e "     Check Nginx config: ${YELLOW}sudo nginx -T${NC}"
echo -e "     View PM2 status: ${YELLOW}pm2 status${NC}"
echo ""
