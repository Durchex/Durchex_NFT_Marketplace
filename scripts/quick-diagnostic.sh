#!/bin/bash

# Quick Fix: Check what's actually being served
echo "🔍 QUICK DIAGNOSTIC"
echo "==================="

echo ""
echo "1️⃣ What port 80 is serving:"
curl -s http://localhost/ 2>/dev/null | head -20

echo ""
echo "2️⃣ Backend on port 8080:"
curl -s http://localhost:8080/api/health 2>/dev/null || echo "Backend not responding on 8080"

echo ""
echo "3️⃣ Frontend files exist?"
ls -la /home/durchex/htdocs/durchex.com/frontend/public/

echo ""
echo "4️⃣ Nginx config in use:"
cat /etc/nginx/sites-enabled/durchex.com | head -30

echo ""
echo "5️⃣ Nginx actual running config:"
nginx -T 2>/dev/null | grep -A 5 "server_name durchex.com" | head -20

echo ""
echo "6️⃣ Process listening on port 80:"
lsof -i :80 2>/dev/null || netstat -tlnp | grep :80

echo ""
echo "7️⃣ Nginx errors:"
tail -20 /var/log/nginx/durchex.error.log 2>/dev/null