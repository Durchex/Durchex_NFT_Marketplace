#!/bin/bash

# Final fix for undici/File API error
# This script ensures npm overrides work for nested dependencies

echo "=== Final Fix for Undici Error ==="
echo ""

cd /home/durchex/htdocs/durchex.com/backend_temp

# 1. Stop PM2
echo "1. Stopping PM2..."
pm2 stop durchex-backend
pm2 delete durchex-backend

# 2. Verify package.json has overrides
echo ""
echo "2. Checking package.json for overrides..."
if grep -q '"overrides"' package.json; then
    echo "✅ Overrides section found"
    grep -A 3 '"overrides"' package.json
else
    echo "❌ Overrides section missing - adding it..."
    # Add overrides before the closing brace
    sed -i '/^}$/i\  "overrides": {\n    "undici": "5.28.2"\n  },' package.json
fi

# 3. Remove node_modules and package-lock
echo ""
echo "3. Cleaning up..."
rm -rf node_modules package-lock.json

# 4. Install with overrides
echo ""
echo "4. Installing dependencies with overrides..."
npm install

# 5. Verify undici version
echo ""
echo "5. Checking undici versions..."
echo "Main undici:"
npm list undici 2>/dev/null | head -3

echo ""
echo "Nested undici in @elastic/transport:"
if [ -d "node_modules/@elastic/transport/node_modules/undici" ]; then
    cd node_modules/@elastic/transport/node_modules/undici
    cat package.json | grep '"version"' | head -1
    cd ../../../../..
else
    echo "   No nested undici found (good - means override worked)"
fi

# 6. Alternative: Manually fix nested undici if override didn't work
echo ""
echo "6. If override didn't work, manually fixing nested undici..."
if [ -d "node_modules/@elastic/transport/node_modules/undici" ]; then
    echo "   Found nested undici, replacing with compatible version..."
    cd node_modules/@elastic/transport/node_modules
    rm -rf undici
    npm install undici@5.28.2 --save-exact --no-save
    cd ../../../../..
fi

# 7. Test if server can start
echo ""
echo "7. Testing server startup..."
timeout 10 node server.js 2>&1 | head -20 || echo "   Server test completed"

# 8. Start with PM2
echo ""
echo "8. Starting with PM2..."
pm2 start ecosystem.config.cjs
pm2 save

# 9. Wait and check
echo ""
echo "9. Waiting 5 seconds and checking status..."
sleep 5

echo ""
echo "PM2 status:"
pm2 list

echo ""
echo "Port 3000 check:"
lsof -i :3000 || netstat -tlnp | grep :3000 || echo "⚠️  Still not listening"

echo ""
echo "10. Recent logs:"
pm2 logs durchex-backend --lines 30 --nostream | tail -30

echo ""
echo "=== Summary ==="
echo ""
if lsof -i :3000 > /dev/null 2>&1 || netstat -tlnp 2>/dev/null | grep -q :3000; then
    echo "✅ Backend is listening on port 3000!"
    echo ""
    echo "Test it:"
    echo "  curl http://localhost:3000/api/health"
else
    echo "❌ Backend is still not listening"
    echo ""
    echo "Check logs for errors:"
    echo "  pm2 logs durchex-backend --lines 50"
    echo ""
    echo "If undici error persists, upgrade Node.js:"
    echo "  nvm install 20"
    echo "  nvm use 20"
    echo "  npm install"
fi
