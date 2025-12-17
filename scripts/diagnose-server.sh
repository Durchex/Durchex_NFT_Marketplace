#!/bin/bash

# Comprehensive Server Diagnostic Script
# Identifies why site serves backend instead of frontend

echo "🔍 Comprehensive Server Diagnostic"
echo "==================================="

echo ""
echo "🌐 Testing site response..."
echo "HTTP Response:"
curl -s http://localhost/ | head -5

echo ""
echo "API Response:"
curl -s http://localhost/api/health 2>/dev/null || echo "API not responding"

echo ""
echo "🔌 Checking port 80 (what's actually serving the site)..."
netstat -tlnp | grep :80

echo ""
echo "🔌 Checking port 8080 (backend port)..."
netstat -tlnp | grep :8080

echo ""
echo "📁 Checking frontend file location..."
FRONTEND_PATH="/home/durchex/htdocs/durchex.com/frontend/public"
echo "Expected frontend path: $FRONTEND_PATH"
if [ -d "$FRONTEND_PATH" ]; then
    echo "✅ Directory exists"
    ls -la "$FRONTEND_PATH" | head -10
    if [ -f "$FRONTEND_PATH/index.html" ]; then
        echo "✅ index.html exists"
        head -3 "$FRONTEND_PATH/index.html"
    else
        echo "❌ index.html NOT found"
    fi
else
    echo "❌ Directory does NOT exist"
    echo "Looking for frontend files elsewhere..."
    find /home/durchex -name "index.html" -type f 2>/dev/null | head -5
fi

echo ""
echo "🚀 Checking running processes..."
echo "Node processes:"
ps aux | grep node | grep -v grep

echo ""
echo "PM2 processes:"
pm2 list 2>/dev/null || echo "PM2 not found"

echo ""
echo "🔧 Checking nginx configuration..."
echo "Active nginx config for durchex.com:"
nginx -T 2>/dev/null | grep -A 10 "server_name durchex.com" | head -15

echo ""
echo "Nginx root directive:"
nginx -T 2>/dev/null | grep -A 2 "root /home/durchex" | head -3

echo ""
echo "🔍 Checking which nginx config is active..."
ls -la /etc/nginx/sites-enabled/ | grep durchex

echo ""
echo "📋 DIAGNOSIS:"
echo "============="

# Check if backend is on port 80
if netstat -tlnp | grep :80 | grep -q node; then
    echo "❌ PROBLEM: Backend is running on port 80, blocking nginx!"
    echo "   Solution: Move backend to port 8080"
fi

# Check if frontend files exist
if [ ! -f "$FRONTEND_PATH/index.html" ]; then
    echo "❌ PROBLEM: Frontend index.html not found at expected location!"
    echo "   Expected: $FRONTEND_PATH/index.html"
    echo "   Solution: Build and deploy frontend to correct location"
fi

# Check nginx config
if ! nginx -T 2>/dev/null | grep -q "root /home/durchex/htdocs/durchex.com/frontend/public"; then
    echo "❌ PROBLEM: Nginx root path is incorrect!"
    echo "   Solution: Update nginx config with correct root path"
fi

echo ""
echo "💡 QUICK FIXES:"
echo "==============="
echo "1. Kill backend on port 80: pkill -f 'node.*server.js'"
echo "2. Start backend on port 8080: PORT=8080 npm start (in backend directory)"
echo "3. Check frontend build: ls -la /home/durchex/htdocs/durchex.com/frontend/public/"
echo "4. Reload nginx: systemctl reload nginx"