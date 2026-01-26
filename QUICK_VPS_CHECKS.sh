#!/bin/bash

# Quick diagnostic commands to run on VPS
# Run these one by one or copy-paste into SSH session

echo "=== Quick Backend Diagnostics ==="
echo ""

echo "1. Check if backend is running on port 3000:"
echo "-------------------------------------------"
lsof -i :3000 2>/dev/null || netstat -tlnp 2>/dev/null | grep :3000 || ss -tlnp 2>/dev/null | grep :3000 || echo "Port 3000 is NOT in use"

echo ""
echo "2. Check PM2 processes:"
echo "-------------------------------------------"
pm2 list

echo ""
echo "3. Test backend directly:"
echo "-------------------------------------------"
curl -v http://localhost:3000/api/health 2>&1 | head -15

echo ""
echo "4. Test the failing endpoint directly:"
echo "-------------------------------------------"
curl -v http://localhost:3000/api/v1/nft/nfts/arbitrum 2>&1 | head -20

echo ""
echo "5. Check Nginx error logs for 502 errors:"
echo "-------------------------------------------"
tail -20 /var/log/nginx/error.log | grep -i "502\|bad gateway\|upstream" || echo "No 502 errors in recent logs"

echo ""
echo "6. Check Nginx API proxy configuration:"
echo "-------------------------------------------"
grep -A 5 "location /api/" /etc/nginx/sites-available/durchex.com 2>/dev/null || \
grep -A 5 "location /api/" /etc/nginx/sites-enabled/durchex.com 2>/dev/null || \
echo "Nginx config not found in standard locations"

echo ""
echo "7. Test through Nginx proxy:"
echo "-------------------------------------------"
curl -v http://localhost/api/v1/nft/nfts/arbitrum 2>&1 | head -20

echo ""
echo "8. Check backend logs (if PM2 is running):"
echo "-------------------------------------------"
pm2 logs --lines 20 --nostream 2>/dev/null | tail -20 || echo "PM2 not available or no logs"
