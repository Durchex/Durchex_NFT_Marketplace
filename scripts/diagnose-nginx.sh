#!/bin/bash

# Nginx Configuration Diagnostic Script
# Helps identify why frontend isn't loading

echo "🔍 Nginx Configuration Diagnostic"
echo "================================="

echo ""
echo "📁 Checking file paths..."
echo "Frontend root: /home/durchex/htdocs/durchex.com/frontend/public"
ls -la /home/durchex/htdocs/durchex.com/frontend/public/

echo ""
echo "📄 Checking for index.html..."
if [ -f "/home/durchex/htdocs/durchex.com/frontend/public/index.html" ]; then
    echo "✅ index.html exists"
    head -5 /home/durchex/htdocs/durchex.com/frontend/public/index.html
else
    echo "❌ index.html NOT found"
fi

echo ""
echo "🔧 Checking nginx configuration..."
echo "Active nginx config:"
nginx -T | grep -A 20 "server_name durchex.com" | head -30

echo ""
echo "🌐 Checking which config is active..."
ls -la /etc/nginx/sites-enabled/

echo ""
echo "🔌 Checking what's listening on port 80..."
netstat -tlnp | grep :80

echo ""
echo "🚀 Checking backend status..."
if pgrep -f "node.*server.js" > /dev/null; then
    echo "✅ Backend process found"
    ps aux | grep "node.*server.js" | grep -v grep
else
    echo "❌ Backend process NOT found"
fi

echo ""
echo "🔍 Checking backend port 8080..."
netstat -tlnp | grep :8080

echo ""
echo "🧪 Testing requests..."
echo "Testing root path:"
curl -s http://localhost/ | head -3

echo ""
echo "Testing API path:"
curl -s http://localhost/api/health 2>/dev/null || echo "API endpoint not responding"

echo ""
echo "📋 Recommendations:"
echo "1. Ensure frontend files are in: /home/durchex/htdocs/durchex.com/frontend/public/"
echo "2. Backend should run on port 8080, not 80"
echo "3. Check nginx config syntax: nginx -t"
echo "4. Reload nginx: systemctl reload nginx"