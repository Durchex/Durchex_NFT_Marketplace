#!/bin/bash

# Script to diagnose and fix the backend issue
# The backend shows as "online" in PM2 but isn't listening on port 3000

echo "=== Diagnosing Backend Issue ==="
echo ""

echo "1. Checking PM2 logs for errors:"
echo "-----------------------------------"
pm2 logs durchex-backend --lines 50 --nostream

echo ""
echo "2. Checking PM2 process details:"
echo "-----------------------------------"
pm2 describe durchex-backend

echo ""
echo "3. Finding backend directory:"
echo "-----------------------------------"
find /home -name "server.js" -type f 2>/dev/null | head -3
find /root -name "server.js" -type f 2>/dev/null | head -3
find /var/www -name "server.js" -type f 2>/dev/null | head -3

echo ""
echo "4. Checking if backend is listening on any port:"
echo "-----------------------------------"
netstat -tlnp 2>/dev/null | grep node || ss -tlnp 2>/dev/null | grep node || echo "No Node.js processes listening"

echo ""
echo "5. Checking backend process:"
echo "-----------------------------------"
ps aux | grep -i "node.*server.js\|durchex" | grep -v grep

echo ""
echo "=== Next Steps ==="
echo ""
echo "If logs show errors, fix them and restart:"
echo "  pm2 restart durchex-backend"
echo ""
echo "If backend directory is found, check:"
echo "  - .env file exists and has correct MONGO_URI"
echo "  - PORT=3000 is set"
echo "  - Dependencies are installed (npm install)"
echo ""
echo "To restart backend:"
echo "  cd [backend_directory]"
echo "  pm2 delete durchex-backend"
echo "  pm2 start ecosystem.config.cjs"
echo "  pm2 save"
