#!/bin/bash

# NUCLEAR FIX - Complete Frontend Setup
set -e

echo "🚀 NUCLEAR FIX - Setting up frontend properly"
echo "=============================================="

# Step 1: Stop everything
echo "⏹️ Stopping services..."
systemctl stop nginx
pkill -f "node.*server.js" 2>/dev/null || true
sleep 2

# Step 2: Verify frontend files
echo "📁 Checking frontend files..."
if [ ! -f "/home/durchex/htdocs/durchex.com/frontend/public/index.html" ]; then
    echo "❌ Frontend index.html missing!"
    echo "Attempting to build frontend..."
    cd /home/durchex/htdocs/durchex.com/frontend
    npm install
    npm run build
    mkdir -p /home/durchex/htdocs/durchex.com/frontend/public
    cp -r dist/* /home/durchex/htdocs/durchex.com/frontend/public/
fi

# Step 3: Fix permissions
echo "🔐 Fixing permissions..."
chmod -R 755 /home/durchex/htdocs/durchex.com/frontend/
chmod -R 755 /home/durchex/htdocs/durchex.com/frontend/public/
find /home/durchex/htdocs/durchex.com/frontend/public -type f -exec chmod 644 {} \;
find /home/durchex/htdocs/durchex.com/frontend/public -type d -exec chmod 755 {} \;

# Step 4: Remove ALL conflicting nginx configs
echo "🧹 Cleaning nginx configs..."
rm -f /etc/nginx/sites-enabled/* 2>/dev/null || true
rm -f /etc/nginx/sites-available/durchex.com* 2>/dev/null || true

# Step 5: Create SINGLE clean config
echo "📝 Creating clean nginx config..."
cat > /etc/nginx/sites-available/durchex.com << 'NGINX_CONFIG'
server {
    listen 80;
    listen [::]:80;
    server_name durchex.com www.durchex.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name durchex.com www.durchex.com;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/durchex.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/durchex.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Frontend root - MUST be correct
    root /home/durchex/htdocs/durchex.com/frontend/public;
    index index.html;

    # Security
    client_max_body_size 50M;

    # SPA routing - CRITICAL
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }

    # Static assets - Cache long
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API proxy to backend on port 8080
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Logging
    access_log /var/log/nginx/durchex.access.log;
    error_log /var/log/nginx/durchex.error.log;
}
NGINX_CONFIG

# Step 6: Enable config
echo "🔗 Enabling nginx config..."
ln -sf /etc/nginx/sites-available/durchex.com /etc/nginx/sites-enabled/durchex.com

# Step 7: Test nginx
echo "🧪 Testing nginx config..."
if ! nginx -t; then
    echo "❌ Nginx config test failed!"
    exit 1
fi

# Step 8: Start nginx
echo "▶️ Starting nginx..."
systemctl start nginx
sleep 2

# Step 9: Start backend on port 8080
echo "🚀 Starting backend on port 8080..."
cd /home/durchex/htdocs/durchex.com/backend
PORT=8080 npm start > /tmp/backend.log 2>&1 &
sleep 3

# Step 10: Test everything
echo ""
echo "🧪 Testing..."
echo "============"

echo "1. Testing HTTPS (frontend):"
if curl -s -k https://durchex.com/ | grep -q "index.html\|<!DOCTYPE\|<html"; then
    echo "✅ Frontend loads!"
else
    echo "❌ Frontend not loading"
    echo "Response:"
    curl -s -k https://durchex.com/ | head -20
fi

echo ""
echo "2. Testing API proxy:"
if curl -s http://localhost:8080/api/health 2>/dev/null | grep -q "OK\|ok"; then
    echo "✅ Backend API works!"
else
    echo "⚠️  Backend may not be responding"
    cat /tmp/backend.log
fi

echo ""
echo "3. Testing HTTP redirect:"
curl -I -L http://durchex.com/ 2>/dev/null | head -3

echo ""
echo "✅ SETUP COMPLETE!"
echo "Frontend: https://durchex.com/"
echo "API: https://durchex.com/api/"